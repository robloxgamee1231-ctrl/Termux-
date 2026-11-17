export type LiveProvider = 'openrouter' | 'openai' | 'local';

export interface LiveConfig {
  provider: LiveProvider;
  model: string;
  apiKey: string;
  /** Only used by the `local` provider — loopback or LAN OpenAI-compatible base. */
  baseUrl?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RelayProviderInfo {
  id: LiveProvider;
  label: string;
  requiresKey: boolean;
  serverKey: boolean;
}

export interface RelayStatus {
  ok: boolean;
  providers: RelayProviderInfo[];
  local: { base: string | null; serverKey: boolean };
}

export interface ProbeResult {
  ok: boolean;
  base: string;
  models: string[];
  count: number;
}

const STORAGE_KEY = 'opencode-termux-live';

export const DEFAULT_LIVE_MODEL: Record<LiveProvider, string> = {
  openrouter: 'deepseek/deepseek-chat',
  openai: 'gpt-4o-mini',
  local: 'deepseek-v4.1-flash-free',
};

export const DEFAULT_LOCAL_BASE = 'http://127.0.0.1:8080/v1';

export const PROVIDER_LABEL: Record<LiveProvider, string> = {
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  local: 'Local endpoint',
};

const PROVIDERS: LiveProvider[] = ['openrouter', 'openai', 'local'];

export function loadLiveConfig(): LiveConfig | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LiveConfig>;
    if (!parsed.provider || !PROVIDERS.includes(parsed.provider)) return null;
    if (typeof parsed.model !== 'string' || !parsed.model) return null;
    const baseUrl =
      parsed.provider === 'local'
        ? typeof parsed.baseUrl === 'string' && parsed.baseUrl
          ? parsed.baseUrl
          : DEFAULT_LOCAL_BASE
        : undefined;
    return {
      provider: parsed.provider,
      model: parsed.model,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      baseUrl,
    };
  } catch {
    return null;
  }
}

export function saveLiveConfig(config: LiveConfig | null): void {
  try {
    if (!config) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Storage can be blocked (private mode) — the session still works in-memory.
  }
}

export async function fetchRelayStatus(): Promise<RelayStatus | null> {
  try {
    const res = await fetch('/api/status', { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return (await res.json()) as RelayStatus;
  } catch {
    return null;
  }
}

/** Asks the relay to call `GET <base>/models` so the UI can list local models. */
export async function probeLocal(baseUrl: string, apiKey = ''): Promise<ProbeResult> {
  let res: Response;
  try {
    res = await fetch('/api/local/probe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-provider-key': apiKey } : {}),
      },
      body: JSON.stringify({ baseUrl }),
    });
  } catch {
    throw new LiveError('Could not reach the relay on this site.', 0);
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new LiveError(describeRelayError(res.status, payload), res.status);
  }
  return payload as ProbeResult;
}

export interface StreamOptions {
  config: LiveConfig;
  messages: ChatMessage[];
  signal?: AbortSignal;
  onDelta: (delta: string, accumulated: string) => void;
}

export class LiveError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'LiveError';
    this.status = status;
  }
}

function describeRelayError(status: number, payload: unknown): string {
  const record = (payload ?? {}) as { error?: string; detail?: string; status?: number; provider?: string };
  const provider = record.provider || 'the provider';

  if (status === 401 || record.error === 'no_key') {
    return 'No API key — add one in Connect, or set OPENROUTER_API_KEY on the server.';
  }
  if (record.error === 'rate_limited') {
    return 'Rate limit hit on the relay — wait a moment and try again.';
  }
  if (record.error === 'invalid_base') {
    return 'That endpoint is not allowed. Use a loopback or private-network http(s) URL such as http://127.0.0.1:8080/v1.';
  }
  if (record.error === 'probe_unreachable') {
    return 'Nothing answered at that endpoint. Is the local gateway running (opencode-proxy start)?';
  }
  if (record.error === 'probe_failed' || record.error === 'probe_bad_payload') {
    return `The endpoint answered but did not return a model list (${record.status || 'no status'}).`;
  }
  if (record.error === 'upstream_error') {
    let detail = record.detail || '';
    try {
      const parsed = JSON.parse(detail) as { error?: string | { message?: string } };
      if (typeof parsed.error === 'string') detail = parsed.error;
      else if (parsed.error?.message) detail = parsed.error.message;
    } catch {
      // keep raw detail
    }
    return `${provider} error ${status}${detail ? `: ${detail.slice(0, 300)}` : ''}`;
  }
  if (record.error === 'upstream_unreachable') {
    return `Could not reach ${provider} from this server — check that the endpoint is running and reachable.`;
  }
  return `Relay error ${status}${record.error ? ` (${record.error})` : ''}`;
}

/**
 * Streams a chat completion through the local relay (`/api/chat`) and reports
 * incremental deltas. Resolves with the full text when the stream completes.
 */
export async function streamChat({ config, messages, signal, onDelta }: StreamOptions): Promise<string> {
  let response: Response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'x-provider-key': config.apiKey } : {}),
      },
      body: JSON.stringify({
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        messages,
      }),
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new LiveError('Could not reach the relay on this site.', 0);
  }

  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new LiveError(describeRelayError(response.status, payload), response.status);
  }

  if (!response.body) {
    throw new LiveError('The relay returned an empty stream.', 0);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';

  const handleFrame = (frame: string) => {
    const lines = frame.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }

      const payload = parsed as {
        choices?: Array<{ delta?: { content?: string | null } }>;
        error?: string;
      };

      if (payload.error) throw new LiveError(`Provider error: ${payload.error}`, 502);

      const delta = payload.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta.length > 0) {
        accumulated += delta;
        onDelta(delta, accumulated);
      }
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      handleFrame(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) handleFrame(buffer);
  return accumulated;
}
