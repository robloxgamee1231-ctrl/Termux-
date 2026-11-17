/**
 * Minimal OpenAI-compatible relay used by the in-browser OpenCode terminal.
 *
 * Providers
 *   - `openrouter` / `openai`: fixed cloud base URLs, key from the request
 *     (`x-provider-key`) or the server environment.
 *   - `local`: a loopback / LAN OpenAI-compatible endpoint such as
 *     opencode2api on `http://127.0.0.1:8080/v1`. Only private or loopback hosts
 *     are accepted, so the relay can never be used as an open proxy.
 *
 * Keys are never written to disk or logs. Upstream responses are streamed
 * straight through as SSE.
 */

const PROVIDERS = {
  openrouter: {
    label: 'OpenRouter',
    base: 'https://openrouter.ai/api/v1',
    requiresKey: true,
  },
  openai: {
    label: 'OpenAI',
    base: 'https://api.openai.com/v1',
    requiresKey: true,
  },
  local: {
    label: 'Local endpoint',
    base: '',
    requiresKey: false,
  },
};

const MAX_BODY_BYTES = 1_000_000;
const MAX_MESSAGES = 40;
const RATE_WINDOW_MS = 60_000;
const CHAT_RATE_MAX = 40;
const PROBE_RATE_MAX = 20;
const PROBE_TIMEOUT_MS = 4_000;

/** Tiny in-memory limiters so an open relay cannot be used as a free proxy. */
const hitLog = new Map();

function rateLimited(req, bucket, max) {
  const ip = req.socket?.remoteAddress || 'unknown';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const hits = (hitLog.get(key) || []).filter((stamp) => now - stamp < RATE_WINDOW_MS);
  hits.push(now);
  hitLog.set(key, hits);
  if (hitLog.size > 5000) hitLog.clear();
  return hits.length > max;
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJson(req) {
  try {
    return { body: JSON.parse(await readBody(req)) };
  } catch (error) {
    return { error: error.message === 'payload_too_large' ? 'payload_too_large' : 'invalid_json' };
  }
}

/* ------------------------------------------------------------------ */
/* Local endpoint validation                                           */
/* ------------------------------------------------------------------ */

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '::1' || host === '0.0.0.0') return true;
  if (host.endsWith('.local')) return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  return false;
}

/**
 * Accepts only http(s) URLs on loopback / private / .local hosts and returns a
 * normalised base (`http://127.0.0.1:8080/v1`), or null when unusable.
 */
export function normalizeLocalBase(raw) {
  if (!raw || typeof raw !== 'string' || raw.length > 300) return null;
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (url.search || url.hash) return null;
  if (!isPrivateHost(url.hostname)) return null;
  const path = url.pathname.replace(/\/+$/, '');
  return `${url.origin}${path}`;
}

export function configuredLocalBase() {
  return normalizeLocalBase(process.env.OPENCODE_LOCAL_BASE || process.env.OPENCODE_API_BASE || '');
}

function serverKeyFor(provider, localBase) {
  const env = process.env;
  if (provider === 'openai') return env.OPENAI_API_KEY || env.OPENCODE_API_KEY || '';
  if (provider === 'openrouter') return env.OPENROUTER_API_KEY || env.OPENCODE_API_KEY || '';
  if (provider === 'local' && localBase) {
    return env.OPENCODE_LOCAL_KEY || env.OPENCODE_API_KEY || '';
  }
  return '';
}

export function apiStatus() {
  const localBase = configuredLocalBase();
  return {
    ok: true,
    providers: Object.entries(PROVIDERS).map(([id, config]) => ({
      id,
      label: config.label,
      requiresKey: config.requiresKey,
      serverKey: Boolean(serverKeyFor(id, localBase)),
    })),
    local: {
      base: localBase,
      serverKey: Boolean(serverKeyFor('local', localBase)),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Upstream helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Transforms a non-streaming chat completion JSON body into a single SSE frame
 * so the browser only ever has to speak one protocol.
 */
function jsonToSse(payload) {
  const content = payload?.choices?.[0]?.message?.content ?? '';
  const frame = {
    id: payload?.id,
    model: payload?.model,
    choices: [{ index: 0, delta: { content }, finish_reason: 'stop' }],
  };
  return `data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`;
}

function providerLabel(id) {
  return PROVIDERS[id]?.label || id;
}

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

async function handleProbe(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req, 'probe', PROBE_RATE_MAX)) {
    return json(res, 429, { error: 'rate_limited', scope: 'probe' });
  }

  const parsed = await readJson(req);
  if (parsed.error) {
    return json(res, parsed.error === 'payload_too_large' ? 413 : 400, { error: parsed.error });
  }

  const body = parsed.body || {};
  const base = normalizeLocalBase(body.baseUrl) || configuredLocalBase();
  if (!base) {
    return json(res, 400, { error: 'invalid_base' });
  }

  const headerKey = String(req.headers['x-provider-key'] || '').trim();
  const key = headerKey || serverKeyFor('local', base);

  let upstream;
  try {
    upstream = await fetch(`${base}/models`, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: key ? { Authorization: `Bearer ${key}` } : {},
    });
  } catch {
    return json(res, 502, { error: 'probe_unreachable', base });
  }

  if (!upstream.ok) {
    return json(res, 502, { error: 'probe_failed', status: upstream.status, base });
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch {
    return json(res, 502, { error: 'probe_bad_payload', base });
  }

  const rawList = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.models)
      ? payload.models
      : [];

  const models = rawList
    .map((entry) => (typeof entry === 'string' ? entry : entry?.id || entry?.name || entry?.model))
    .filter((id) => typeof id === 'string' && id.length > 0)
    .slice(0, 200);

  return json(res, 200, { ok: true, base, models, count: models.length });
}

async function handleChat(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req, 'chat', CHAT_RATE_MAX)) {
    return json(res, 429, {
      error: 'rate_limited',
      scope: 'chat',
      limit: CHAT_RATE_MAX,
      windowSeconds: RATE_WINDOW_MS / 1000,
    });
  }

  const parsed = await readJson(req);
  if (parsed.error) {
    return json(res, parsed.error === 'payload_too_large' ? 413 : 400, { error: parsed.error });
  }
  const body = parsed.body || {};

  const provider = String(body.provider || 'openrouter');
  if (!PROVIDERS[provider]) {
    return json(res, 400, { error: 'unsupported_provider' });
  }

  const model = String(body.model || '').trim();
  if (!model || model.length > 200) {
    return json(res, 400, { error: 'missing_model' });
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
  const cleaned = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant' || m.role === 'system'))
    .map((m) => ({ role: m.role, content: String(m.content || '').slice(0, 24_000) }));

  if (!cleaned.length) {
    return json(res, 400, { error: 'missing_messages' });
  }

  let base;
  if (provider === 'local') {
    base = normalizeLocalBase(body.baseUrl) || configuredLocalBase();
    if (!base) return json(res, 400, { error: 'invalid_base' });
  } else {
    base = PROVIDERS[provider].base;
  }

  const headerKey = String(req.headers['x-provider-key'] || '').trim();
  const key = headerKey || serverKeyFor(provider, base);

  if (PROVIDERS[provider].requiresKey && !key) {
    return json(res, 401, { error: 'no_key' });
  }

  const controller = new AbortController();
  res.on('close', () => controller.abort());

  const headers = {
    'Content-Type': 'application/json',
    'X-Title': 'OpenCode Termux Unlimited',
  };
  if (key) headers.Authorization = `Bearer ${key}`;
  if (provider !== 'local') headers['HTTP-Referer'] = req.headers.origin || 'https://localhost';

  let upstream;
  try {
    upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        model,
        messages: cleaned,
        stream: true,
        temperature: body.temperature ?? 0.4,
        max_tokens: body.max_tokens ?? 1200,
      }),
    });
  } catch {
    return json(res, 502, { error: 'upstream_unreachable', provider: providerLabel(provider), base });
  }

  if (!upstream.ok) {
    let detail = '';
    try {
      detail = (await upstream.text()).slice(0, 800);
    } catch {
      detail = '';
    }
    return json(res, upstream.status, {
      error: 'upstream_error',
      status: upstream.status,
      detail,
      provider: providerLabel(provider),
    });
  }

  const contentType = upstream.headers.get('content-type') || '';

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (!contentType.includes('text/event-stream')) {
    try {
      const payload = await upstream.json();
      res.end(jsonToSse(payload));
    } catch {
      res.end('data: {"error":"bad_upstream_payload"}\n\n');
    }
    return;
  }

  const reader = upstream.body?.getReader();
  if (!reader) {
    res.end();
    return;
  }

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } catch {
    // Client went away or upstream dropped mid-stream.
  } finally {
    res.end();
  }
}

export async function handleApi(req, res, pathname) {
  if (pathname === '/api/status') {
    if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
    return json(res, 200, apiStatus());
  }

  if (pathname === '/api/chat') return handleChat(req, res);
  if (pathname === '/api/local/probe') return handleProbe(req, res);

  return json(res, 404, { error: 'not_found' });
}
