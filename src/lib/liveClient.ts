export type LiveProvider = 'openrouter' | 'openai';

export interface LiveConfig {
  provider: LiveProvider;
  model: string;
  apiKey: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RelayStatus {
  ok: boolean;
  providers: Array<{ id: LiveProvider; label: string; serverKey: boolean }>;
  customBase: boolean;
}

const STORAGE_KEY = 'opencode-termux-live';

export const DEFAULT_LIVE_MODEL: Record<LiveProvider, string> = {
  openrouter: 'deepseek/deepseek-chat',
  openai: 'gpt-4o-mini',
};

export function loadLiveConfig(): LiveConfig | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LiveConfig>;
    if (parsed.provider !== 'openrouter' && parsed.provider !== 'openai') return null;
    if (typeof parsed.model !== 'string' || !parsed.model) return null;
    return {
      provider: parsed.provider,
      model: parsed.model,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
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
  const record = (payload ?? {}) as { error?: string; detail?: string };
  if (status === 401 || record.error === 'no_key') {
    return 'No API key — add one in Connect, or set OPENROUTER_API_KEY on the server.';
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
    return `Provider error ${status}${detail ? `: ${detail.slice(0, 300)}` : ''}`;
  }
  if (record.error === 'rate_limited') {
    return 'Rate limit hit on the relay (40 requests/minute) — wait a moment.';
  }
  if (record.error === 'upstream_unreachable') {
    return 'Provider unreachable from this server — check outbound network access.';
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
