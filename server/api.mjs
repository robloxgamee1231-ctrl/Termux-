/**
 * Minimal OpenAI-compatible relay used by the in-browser OpenCode terminal.
 *
 * - The browser never talks to a model provider directly (no CORS, no exposed
 *   provider URLs, and keys stay out of the page's network tab except for the
 *   single same-origin request that carries them here).
 * - A provider key can come from the request (`x-provider-key`) or from the
 *   server environment. Nothing is ever written to disk or to logs.
 * - Upstream base URLs are fixed; `OPENCODE_API_BASE` exists only so the relay
 *   can be pointed at a local mock during testing or a self-hosted endpoint.
 */

const PROVIDERS = {
  openrouter: {
    label: 'OpenRouter',
    base: 'https://openrouter.ai/api/v1',
    envKeys: ['OPENROUTER_API_KEY'],
  },
  openai: {
    label: 'OpenAI',
    base: 'https://api.openai.com/v1',
    envKeys: ['OPENAI_API_KEY'],
  },
};

const MAX_BODY_BYTES = 1_000_000;
const MAX_MESSAGES = 40;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;

/** Tiny in-memory limiter so an open relay cannot be used as a free API proxy. */
const hitLog = new Map();

function rateLimited(req) {
  const ip = req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const hits = (hitLog.get(ip) || []).filter((stamp) => now - stamp < RATE_WINDOW_MS);
  hits.push(now);
  hitLog.set(ip, hits);
  if (hitLog.size > 5000) hitLog.clear();
  return hits.length > RATE_MAX;
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

function serverKeyFor(provider) {
  const env = process.env;
  if (provider === 'openai') return env.OPENAI_API_KEY || env.OPENCODE_API_KEY || '';
  return env.OPENROUTER_API_KEY || env.OPENCODE_API_KEY || '';
}

function resolveBase(provider) {
  const override = process.env.OPENCODE_API_BASE;
  if (override) return override.replace(/\/+$/, '');
  return PROVIDERS[provider].base;
}

export function apiStatus() {
  const providers = Object.entries(PROVIDERS).map(([id, config]) => ({
    id,
    label: config.label,
    serverKey: Boolean(serverKeyFor(id)),
  }));
  return {
    ok: true,
    providers,
    customBase: Boolean(process.env.OPENCODE_API_BASE),
  };
}

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

export async function handleApi(req, res, pathname) {
  if (pathname === '/api/status') {
    if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
    return json(res, 200, apiStatus());
  }

  if (pathname !== '/api/chat') {
    return json(res, 404, { error: 'not_found' });
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method_not_allowed' });
  }

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (error) {
    return json(res, error.message === 'payload_too_large' ? 413 : 400, {
      error: error.message === 'payload_too_large' ? 'payload_too_large' : 'invalid_json',
    });
  }

  if (rateLimited(req)) {
    return json(res, 429, { error: 'rate_limited', limit: RATE_MAX, windowSeconds: RATE_WINDOW_MS / 1000 });
  }

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

  const headerKey = String(req.headers['x-provider-key'] || '').trim();
  const key = headerKey || serverKeyFor(provider);
  if (!key) {
    return json(res, 401, { error: 'no_key' });
  }

  const base = resolveBase(provider);
  const controller = new AbortController();
  res.on('close', () => controller.abort());

  let upstream;
  try {
    upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://localhost',
        'X-Title': 'OpenCode Termux Unlimited',
      },
      body: JSON.stringify({
        model,
        messages: cleaned,
        stream: true,
        temperature: body.temperature ?? 0.4,
        max_tokens: body.max_tokens ?? 1200,
      }),
    });
  } catch {
    return json(res, 502, { error: 'upstream_unreachable' });
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
