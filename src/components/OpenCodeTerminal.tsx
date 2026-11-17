import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CornerDownLeft, Play, RotateCcw, ShieldCheck, Terminal as TerminalIcon, Zap } from 'lucide-react';
import { CONFIG_JSON_EXAMPLE } from '../data/runtimeData';
import {
  DEFAULT_LIVE_MODEL,
  DEFAULT_LOCAL_BASE,
  PROVIDER_LABEL,
  fetchRelayStatus,
  probeLocal,
  loadLiveConfig,
  saveLiveConfig,
  streamChat,
  type ChatMessage,
  type LiveConfig,
  type LiveProvider,
  type RelayStatus,
} from '../lib/liveClient';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type LineKind = 'cmd' | 'dim' | 'ok' | 'warn' | 'err' | 'box' | 'out';

interface TermLine {
  id: number;
  kind: LineKind;
  text: string;
}

interface TuiMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  text: string;
}

type Mode = 'mode1' | 'mode2';

interface Session {
  mode: Mode;
  model: string;
}

const MODE1_MODELS = [
  'deepseek-v4.1-flash-free',
  'nemotron-3.5-lightning-free',
  'flint-40b-free',
  'glm-5.3-flash-free',
  'nemotron-3.5-super-vl-free',
  'pulse-alpha-free',
  'big-pickle',
  'mimo-v2.6-flash-free',
  'beam-free',
  'crouton-alpha-free',
];

const MODE2_MODELS = [
  'anthropic/claude-3.7-sonnet',
  'openai/o3-mini',
  'google/gemini-2.5-pro',
  ...MODE1_MODELS,
];

const DEFAULT_MODEL: Record<Mode, string> = {
  mode1: 'deepseek-v4.1-flash-free',
  mode2: 'anthropic/claude-3.7-sonnet',
};

/* ------------------------------------------------------------------ */
/* Banner helpers                                                      */
/* ------------------------------------------------------------------ */

const BOX_WIDTH = 46;

const boxRow = (text: string) =>
  `│ ${text}${' '.repeat(Math.max(0, BOX_WIDTH - text.length - 1))}│`;

const boxTop = `┌${'─'.repeat(BOX_WIDTH)}┐`;
const boxBottom = `└${'─'.repeat(BOX_WIDTH)}┘`;

const BOOT_LINES: TermLine[] = [
  { id: 1, kind: 'dim', text: 'u0_a291@localhost · aarch64 · Android 14 · Termux 0.118' },
  { id: 2, kind: 'box', text: boxTop },
  { id: 3, kind: 'box', text: boxRow('OpenCode Termux Unlimited  v2.0.7') },
  { id: 4, kind: 'box', text: boxRow('gateway 127.0.0.1:8080 · WARP IPv6 · 6x') },
  { id: 5, kind: 'box', text: boxRow('interactive demo · replies simulated locally') },
  { id: 6, kind: 'box', text: boxBottom },
  { id: 7, kind: 'out', text: 'Type `opencode` to launch the CLI, or `help` for commands.' },
];

/* ------------------------------------------------------------------ */
/* Simulated replies                                                   */
/* ------------------------------------------------------------------ */

function buildReply(prompt: string, model: string): string {
  const p = prompt.toLowerCase();

  if (/audit|elf|socket|readelf|ss -|security|permission/.test(p)) {
    return `Running a read-only system audit of $PREFIX/bin.

1. ELF headers
   aarch64 monoliths — opencode-bin, opencode2api. No PIE conflicts.

2. Dynamic section (readelf -d)
   NEEDED  libc.so.6, libpthread.so.0
   The glibc-runner shim resolves both; no Bionic fallback is hit.

3. Local listeners (ss -tulpn)
   :8080  opencode2api   127.0.0.1  (loopback only)
   :8081  webui          127.0.0.1  (loopback only)
   :8085  bridge         standby

Nothing is bound to 0.0.0.0. No findings that affect the host.

> next: pipe this into \`opencode doctor --json\` for a machine-readable copy.`;
  }

  if (/429|rate limit|quota|blocked|403/.test(p)) {
    return `That 429 is an egress-reputation block, not a model limit.

What the gateway does:
- worker #2 is parked in COOLDOWN for 60s
- worker #5 (2a09:bac5:..., 29ms) is bound as the new exit
- the request is replayed as attempt 2/6, so the session survives

You don't need to touch anything. If all six exits cool down, the
failover pool swaps ${model} → flint-40b-free until a tunnel is warm again.

Check it with: opencode-proxy status`;
  }

  if (/refactor|function|bug|error|fix|code|typescript|python|go\b/.test(p)) {
    return `Here's the shape I'd use.

\`\`\`ts
// drain the ring buffer without allocating per frame
export function drain<T>(ring: T[], head: number, tail: number): T[] {
  if (head === tail) return [];
  return head > tail
    ? ring.slice(tail, head)
    : [...ring.slice(tail), ...ring.slice(0, head)];
}
\`\`\`

Three notes:
- \`head > tail\` is the common case — one slice, zero copies of the array.
- The wrapped case allocates once, which is fine at 60fps telemetry rates.
- Don't lock; a single writer plus an atomic read index is enough here.

Want me to write the test harness for wraparound boundaries?`;
  }

  if (/install|setup|termux|android|glibc|chroot/.test(p)) {
    return `Install is one command and takes about 90 seconds on a mid-range phone:

curl -fsSL .../install.sh | bash

It will:
1. verify aarch64 and install termux-chroot + glibc-runner
2. patch the OpenCode binary (GLM 5.3 reasoning unlock)
3. double-fork opencode2api onto 127.0.0.1:8080
4. warm 6 Cloudflare WARP IPv6 tunnels

Then just run \`opencode\`. Never run \`npm update -g opencode\` — v2.x
crashes on the Bionic linker with Exit 127.`;
  }

  return `Working on it: "${prompt}"

Reading the repo from ~/projects, then I'll:
1. map the entry points I need to touch
2. propose the smallest diff that gets you there
3. run the checks (\`npm run build\`, \`opencode doctor\`) before handing back

Everything here runs through the local gateway on 127.0.0.1:8080, so no
quota is consumed and no request leaves the device except the model call.

Tell me to proceed and I'll start with the file list.`;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const OpenCodeTerminal: React.FC = () => {
  const [lines, setLines] = useState<TermLine[]>(BOOT_LINES);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [proxyRunning, setProxyRunning] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const historyIndex = useRef<number>(-1);

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<TuiMessage[]>([]);
  const [tuiDraft, setTuiDraft] = useState('');
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [live, setLive] = useState<LiveConfig | null>(() => loadLiveConfig());
  const [relay, setRelay] = useState<RelayStatus | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [formProvider, setFormProvider] = useState<LiveProvider>('openrouter');
  const [formKey, setFormKey] = useState('');
  const [formModel, setFormModel] = useState(DEFAULT_LIVE_MODEL.openrouter);
  const [formBase, setFormBase] = useState(DEFAULT_LOCAL_BASE);
  const [formError, setFormError] = useState('');
  const [probe, setProbe] = useState<{ state: 'idle' | 'probing' | 'ok' | 'error'; models: string[]; message: string }>(
    { state: 'idle', models: [], message: '' },
  );
  const abortRef = useRef<AbortController | null>(null);
  const liveAccum = useRef('');

  const idRef = useRef(100);
  const timersRef = useRef<number[]>([]);
  const streamTimerRef = useRef<number | null>(null);
  const shellViewportRef = useRef<HTMLDivElement | null>(null);
  const tuiViewportRef = useRef<HTMLDivElement | null>(null);
  const shellInputRef = useRef<HTMLInputElement | null>(null);
  const tuiInputRef = useRef<HTMLInputElement | null>(null);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchRelayStatus().then((status) => {
      if (active && status) setRelay(status);
    });
    return () => {
      active = false;
    };
  }, []);

  /* ------------------------- autoscroll ------------------------- */
  useEffect(() => {
    const node = shellViewportRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines]);

  useEffect(() => {
    const node = tuiViewportRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, streamingText, rotating]);

  /* ------------------------- shell I/O ------------------------- */
  const push = useCallback((...items: Array<{ kind: LineKind; text: string }>) => {
    setLines((prev) => [...prev, ...items.map((item) => ({ ...item, id: nextId() }))]);
  }, []);

  const play = useCallback(
    (items: Array<{ kind: LineKind; text: string }>, stepMs = 115, done?: () => void) => {
      setBusy(true);
      items.forEach((item, index) => {
        later(() => {
          push(item);
          if (index === items.length - 1) {
            setBusy(false);
            done?.();
          }
        }, index * stepMs);
      });
    },
    [later, push],
  );

  /* ------------------------- TUI helpers ------------------------- */
  const pushMessage = useCallback((role: TuiMessage['role'], text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role, text }]);
  }, []);

  const startStream = useCallback((full: string) => {
    const chunks = full.match(/\S+\s*/g) || [full];
    let index = 0;
    setStreamingText('');
    if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
    streamTimerRef.current = window.setInterval(() => {
      index += 2;
      setStreamingText(chunks.slice(0, index).join(''));
      if (index >= chunks.length) {
        if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
        setStreamingText(null);
        setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text: full }]);
      }
    }, 24);
  }, []);

  const exitTui = useCallback(() => {
    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamingText(null);
    setRotating(false);
    if (session) {
      push({
        kind: 'ok',
        text: live
          ? `[✓] session closed · live ${live.provider} · ${live.model}`
          : `[✓] session saved · model ${session.model} · gateway 127.0.0.1:8080`,
      });
    }
    setSession(null);
    setMessages([]);
    setTuiDraft('');
    later(() => shellInputRef.current?.focus(), 60);
  }, [later, live, push, session]);

  /* ------------------------- live model streaming ------------------------- */
  const runLivePrompt = useCallback(
    (text: string) => {
      if (!live) return;

      const prior: ChatMessage[] = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text }));

      pushMessage('user', text);
      liveAccum.current = '';
      setStreamingText('');

      const controller = new AbortController();
      abortRef.current = controller;

      streamChat({
        config: live,
        messages: [...prior, { role: 'user', content: text }],
        signal: controller.signal,
        onDelta: (_delta, accumulated) => {
          liveAccum.current = accumulated;
          setStreamingText(accumulated);
        },
      })
        .then((full) => {
          setStreamingText(null);
          const body = full.trim();
          if (body) pushMessage('assistant', body);
          else pushMessage('system', 'provider returned an empty response');
        })
        .catch((error: unknown) => {
          setStreamingText(null);
          if ((error as Error)?.name === 'AbortError') {
            const partial = liveAccum.current.trim();
            if (partial) pushMessage('assistant', partial);
            pushMessage('system', 'stream aborted');
            return;
          }
          const message = error instanceof Error ? error.message : 'live request failed';
          const unreachable = /unreachable|Could not reach/i.test(message);
          pushMessage(
            'system',
            unreachable ? `${message} · falling back to the local simulation` : message,
          );
          if (unreachable) {
            later(() => startStream(buildReply(text, live.model)), 400);
          }
        })
        .finally(() => {
          abortRef.current = null;
          liveAccum.current = '';
        });
    },
    [later, live, messages, pushMessage, startStream],
  );

  const sendTuiPrompt = useCallback(
    (raw: string, explicitSession?: Session) => {
      const activeSession = explicitSession ?? session;
      const text = raw.trim();
      if (!text || !activeSession) return;
      setTuiDraft('');

      if (streamingText !== null) return;

      /* TUI slash commands */
      if (text.startsWith('/')) {
        const [cmd, ...rest] = text.split(/\s+/);
        switch (cmd) {
          case '/help':
            pushMessage(
              'system',
              'commands: /models · /model <id> · /proxy status · /connect · /disconnect · /clear · /exit',
            );
            return;
          case '/models': {
            if (live) {
              pushMessage(
                'system',
                `live · ${live.provider} · current model ${live.model}\nset another with /model <provider-model-id>`,
              );
              return;
            }
            const list = activeSession.mode === 'mode2' ? MODE2_MODELS : MODE1_MODELS;
            pushMessage('system', `${list.length} models available:\n${list.map((m) => `  · ${m}`).join('\n')}`);
            return;
          }
          case '/model': {
            const wanted = rest.join(' ').trim();

            if (live) {
              if (!wanted) {
                pushMessage('system', `usage: /model <provider-model-id> · current: ${live.model}`);
              } else {
                const next = { ...live, model: wanted };
                setLive(next);
                saveLiveConfig(next);
                pushMessage('system', `live model → ${wanted}`);
              }
              return;
            }

            const list = activeSession.mode === 'mode2' ? MODE2_MODELS : MODE1_MODELS;
            const match = list.find(
              (m) => m === wanted || m.includes(wanted.toLowerCase()) || m.startsWith(wanted.toLowerCase()),
            );
            if (!wanted) {
              pushMessage('system', `usage: /model <id> · current: ${activeSession.model}`);
            } else if (!match) {
              pushMessage(
                'system',
                `model not in the ${activeSession.mode === 'mode1' ? 'Mode 1' : 'Mode 2'} pool: ${wanted}`,
              );
            } else {
              setSession({ ...activeSession, model: match });
              pushMessage('system', `model → ${match}`);
            }
            return;
          }
          case '/connect':
            setPanelOpen(true);
            return;
          case '/disconnect':
            if (!live) {
              pushMessage('system', 'not connected — running the local simulation');
            } else {
              setLive(null);
              saveLiveConfig(null);
              pushMessage('system', 'disconnected · back to simulated replies');
            }
            return;
          case '/proxy':
            pushMessage(
              'system',
              rest[0] === 'status'
                ? `opencode2api · running · pid 18492 · workers 6/6 · wss healthy`
                : 'usage: /proxy status',
            );
            return;
          case '/clear':
            setMessages([]);
            return;
          case '/exit':
            exitTui();
            return;
          default:
            pushMessage('system', `unknown command: ${cmd} · try /help`);
            return;
        }
      }

      /* ---- real model path ---- */
      if (live) {
        runLivePrompt(text);
        return;
      }

      /* ---- simulated path ---- */
      pushMessage('user', text);

      const lower = text.toLowerCase();
      const isAudit = /audit|elf|socket|readelf|security|permission/.test(lower);
      const isQuota = /429|rate limit|quota|blocked|403/.test(lower);

      if (isAudit) {
        later(() => {
          pushMessage(
            'system',
            'gateway: upstream refused audit framing (false positive) → normalized context · retry on flint-40b-free',
          );
        }, 700);
      }

      if (isQuota) {
        setRotating(true);
        later(() => {
          pushMessage(
            'system',
            'upstream 429 on 2a09:bac1:7680::2f9 → cooling worker #2 · binding 2a09:bac5:3910:8a::c41 (29ms) · attempt 2/6',
          );
        }, 650);
        later(() => setRotating(false), 1600);
      }

      const delay = isAudit ? 1500 : isQuota ? 1200 : 500;
      later(() => startStream(buildReply(text, activeSession.model)), delay);
    },
    [exitTui, later, live, pushMessage, runLivePrompt, session, startStream, streamingText],
  );

  /* ------------------------- live connection form ------------------------- */
  const canUseServerKey = relay?.providers.some((p) => p.id === formProvider && p.serverKey) ?? false;
  const isLocal = formProvider === 'local';

  const detectLocal = useCallback(async () => {
    setProbe({ state: 'probing', models: [], message: 'probing the endpoint…' });
    try {
      const result = await probeLocal(formBase.trim(), formKey.trim());
      setProbe({
        state: 'ok',
        models: result.models,
        message: `${result.count} model${result.count === 1 ? '' : 's'} at ${result.base}`,
      });
      if (result.models.length && !result.models.includes(formModel)) {
        setFormModel(result.models[0]);
      }
    } catch (error) {
      setProbe({
        state: 'error',
        models: [],
        message: error instanceof Error ? error.message : 'probe failed',
      });
    }
  }, [formBase, formKey, formModel]);

  const connectLive = useCallback(() => {
    const key = formKey.trim();
    let baseUrl: string | undefined;

    if (isLocal) {
      const raw = formBase.trim().replace(/\/+$/, '');
      if (!/^https?:\/\//i.test(raw)) {
        setFormError('Enter an http(s) endpoint, e.g. http://127.0.0.1:8080/v1');
        return;
      }
      try {
        const host = new URL(raw).hostname.toLowerCase().replace(/^\[|\]$/g, '');
        const isPrivate =
          host === 'localhost' ||
          host === '::1' ||
          host.endsWith('.local') ||
          /^127\./.test(host) ||
          /^10\./.test(host) ||
          /^192\.168\./.test(host) ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
          /^169\.254\./.test(host);
        if (!isPrivate) {
          setFormError('Only loopback or private-network endpoints are allowed.');
          return;
        }
      } catch {
        setFormError('That is not a valid URL.');
        return;
      }
      baseUrl = raw;
    } else if (!key && !canUseServerKey) {
      setFormError('Paste an API key, or start the server with OPENROUTER_API_KEY set.');
      return;
    }

    const next: LiveConfig = {
      provider: formProvider,
      model: formModel.trim() || DEFAULT_LIVE_MODEL[formProvider],
      apiKey: key,
      baseUrl,
    };
    setLive(next);
    saveLiveConfig(next);
    setPanelOpen(false);
    setFormError('');
    if (session) {
      pushMessage('system', `live · ${next.provider} · ${next.model}`);
    } else {
      push({ kind: 'ok', text: `[✓] live model connected · ${next.provider} · ${next.model}` });
    }
  }, [canUseServerKey, formBase, formKey, formModel, formProvider, isLocal, push, pushMessage, session]);

  const disconnectLive = useCallback(() => {
    setLive(null);
    saveLiveConfig(null);
    setPanelOpen(false);
    if (session) {
      pushMessage('system', 'disconnected · back to simulated replies');
    } else {
      push({ kind: 'warn', text: '[!] live model disconnected' });
    }
  }, [push, pushMessage, session]);

  const openConnectPanel = useCallback(() => {
    setPanelOpen((open) => !open);
    setFormError('');
    setProbe({ state: 'idle', models: [], message: '' });
    if (live) {
      setFormProvider(live.provider);
      setFormModel(live.model);
      setFormKey(live.apiKey);
      if (live.baseUrl) setFormBase(live.baseUrl);
    } else if (relay?.local.base) {
      setFormBase(relay.local.base);
    }
  }, [live, relay]);

  /* ------------------------- shell commands ------------------------- */
  const openSession = useCallback(
    (mode: Mode, model?: string, autoPrompt?: string) => {
      const resolved = model || DEFAULT_MODEL[mode];
      setSession({ mode, model: resolved });
      setMessages([
        {
          id: nextId(),
          role: 'system',
          text:
            mode === 'mode1'
              ? 'Mode 1 · free unlimited proxy · 127.0.0.1:8080 · no API key'
              : 'Mode 2 · OpenRouter bridge · 127.0.0.1:8085',
        },
      ]);
      setTuiDraft('');
      setStreamingText(null);
      later(() => tuiInputRef.current?.focus(), 80);
      if (autoPrompt) {
        later(() => sendTuiPrompt(autoPrompt, { mode, model: resolved }), 700);
      }
    },
    [later, sendTuiPrompt],
  );

  const runInstaller = useCallback(() => {
    play(
      [
        { kind: 'dim', text: '[*] Verifying Android architecture... aarch64 (Termux native)' },
        { kind: 'ok', text: '[✓] Linked termux-chroot + glibc-runner (ld-linux-aarch64.so.1)' },
        { kind: 'ok', text: '[✓] Applied 1:1 GLM 5.3 reasoning unlock byte-patch to opencode-bin' },
        { kind: 'ok', text: '[✓] Spawned daemon_spawn.py → opencode2api on 127.0.0.1:8080 (pid 18492)' },
        { kind: 'ok', text: '[✓] Cloudflare WARP IPv6 pool warmed: 6 workers' },
        { kind: 'out', text: 'Installed. Type `opencode` to launch.' },
      ],
      420,
      () => setProxyRunning(true),
    );
  }, [play]);

  const runProxyCommand = useCallback(
    (sub: string) => {
      switch (sub) {
        case 'status':
          push(
            { kind: 'out', text: 'opencode2api    ' + (proxyRunning ? 'RUNNING' : 'STOPPED') + '    127.0.0.1:8080' },
            { kind: 'out', text: 'webui           ' + (proxyRunning ? 'RUNNING' : 'STOPPED') + '    127.0.0.1:8081' },
            { kind: 'out', text: 'openrouter      STANDBY    127.0.0.1:8085' },
            { kind: 'dim', text: 'warp workers    6/6 active · stack ipv6 · 2a09:bac1::/32' },
            { kind: 'dim', text: 'uptime          4h 12m · pid 18492 · models 10 free' },
            { kind: 'dim', text: 'retry policy    6 attempts · 180s timeout · sqlite guard clean' },
          );
          return;
        case 'start':
          if (proxyRunning) {
            push({ kind: 'dim', text: 'already running (pid 18492)' });
            return;
          }
          play(
            [
              { kind: 'dim', text: '[*] daemon_spawn.py: setsid() double-fork...' },
              { kind: 'ok', text: '[✓] opencode2api listening on 127.0.0.1:8080 (pid 21904)' },
            ],
            400,
            () => setProxyRunning(true),
          );
          return;
        case 'stop':
          if (!proxyRunning) {
            push({ kind: 'dim', text: 'not running' });
            return;
          }
          play(
            [
              { kind: 'warn', text: '[!] SIGTERM → opencode2api (pid 18492)' },
              { kind: 'dim', text: '[*] flushing ring buffer · closing 6 WARP tunnels' },
              { kind: 'ok', text: '[✓] gateway stopped' },
            ],
            350,
            () => setProxyRunning(false),
          );
          return;
        case 'restart':
          if (!proxyRunning) {
            push(
              { kind: 'warn', text: '[!] gateway is not running — use `opencode-proxy start`' },
              { kind: 'dim', text: 'hint: `opencode` will spawn it automatically.' },
            );
            return;
          }
          play(
            [
              { kind: 'warn', text: '[!] SIGTERM → opencode2api (pid 18492)' },
              { kind: 'dim', text: '[*] daemon_spawn.py: setsid() double-fork...' },
              { kind: 'ok', text: '[✓] listening on 127.0.0.1:8080 (pid 22011)' },
              { kind: 'ok', text: '[✓] 6 WARP IPv6 workers re-warmed in 1.8s' },
            ],
            380,
          );
          return;
        case 'test':
          if (!proxyRunning) {
            push({ kind: 'err', text: 'connect ECONNREFUSED 127.0.0.1:8080 — start the gateway first' });
            return;
          }
          play(
            [
              { kind: 'dim', text: '[*] POST /v1/chat/completions · model deepseek-v4.1-flash-free' },
              { kind: 'ok', text: '[✓] HTTP 200 · TTFT 184ms · 41 tok/s · exit 2a09:bac1:7680::2f9' },
              { kind: 'dim', text: '[*] quota check: 0 used · failover pool healthy' },
            ],
            380,
          );
          return;
        case 'logs':
          if (!proxyRunning) {
            push({ kind: 'err', text: 'no log stream — gateway stopped' });
            return;
          }
          play(
            [
              { kind: 'dim', text: '23:14:02 INF [gateway:8080] POST /v1/chat/completions model=nemotron-3.5-lightning' },
              { kind: 'err', text: '23:14:02 WRN [upstream] HTTP 429 free usage limit · exit 2a09:bac1:7680::2f9' },
              { kind: 'warn', text: '23:14:02 WRN [warp-pool] cooling worker #2 → standby #5 (ipv6)' },
              { kind: 'ok', text: '23:14:02 INF [warp-pool] new exit 2a09:bac5:3910:8a::c41 (RTT 29ms)' },
              { kind: 'warn', text: '23:14:03 INF [failover] nemotron-3.5-lightning → deepseek-v4.1 (attempt 2/6)' },
              { kind: 'ok', text: '23:14:03 INF [gateway:8080] HTTP 200 SSE resumed · session preserved' },
              { kind: 'dim', text: '23:14:08 INF [db-guard] sqlite 429 lockout check clean (0 poisoned rows)' },
            ],
            240,
          );
          return;
        case 'kill':
          play(
            [
              { kind: 'warn', text: '[!] SIGKILL → daemon + 6 tunnels' },
              { kind: 'ok', text: '[✓] all proxy processes killed' },
            ],
            300,
            () => setProxyRunning(false),
          );
          return;
        default:
          push({
            kind: 'out',
            text: 'usage: opencode-proxy <start|stop|restart|status|test|logs|kill>',
          });
      }
    },
    [play, proxyRunning, push],
  );

  const runDoctor = useCallback(() => {
    play(
      [
        { kind: 'dim', text: '=== OpenCode Termux System Diagnostics (Doctor) ===' },
        { kind: 'ok', text: '[*] Checking architecture... OK (aarch64)' },
        { kind: 'ok', text: '[*] Checking termux-chroot + glibc-runner (grun)... OK' },
        { kind: 'ok', text: '[*] Checking OpenCode binary (v1.19.5 monolithic)... FOUND' },
        { kind: 'ok', text: '[*] Checking GLM 5.3 reasoning patch... ACTIVE (Unlocked)' },
        proxyRunning
          ? { kind: 'ok' as const, text: '[*] Checking Unlimited Proxy (127.0.0.1:8080)... RUNNING (WARP 6/6, 10 models)' }
          : { kind: 'err' as const, text: '[*] Checking Unlimited Proxy (127.0.0.1:8080)... NOT RUNNING' },
        { kind: 'ok', text: '[*] Checking OpenRouter Bridge (127.0.0.1:8085)... STANDBY' },
        { kind: 'ok', text: '[*] Validating ~/.config/opencode/opencode.jsonc... VALID' },
        proxyRunning
          ? { kind: 'ok' as const, text: '[✓] All core systems operational. Zero rate-limit locks.' }
          : { kind: 'warn' as const, text: '[!] 1 issue found: gateway down → run `opencode-proxy start`' },
      ],
      150,
    );
  }, [play, proxyRunning]);

  const handleShellCommand = useCallback(
    (raw: string) => {
      const input = raw.trim();
      if (!input) return;

      setHistory((prev) => [...prev, input]);
      historyIndex.current = -1;
      push({ kind: 'cmd', text: input });

      const parts = input.split(/\s+/);
      const head = parts[0];
      const args = parts.slice(1);
      const joined = args.join(' ');

      switch (head) {
        case 'help':
          push(
            { kind: 'out', text: 'opencode               launch the CLI · Mode 1 free unlimited' },
            { kind: 'out', text: 'opencode -1            force Mode 1 (:8080)' },
            { kind: 'out', text: 'opencode -2            Mode 2 · + OpenRouter bridge (:8085)' },
            { kind: 'out', text: 'opencode -m <model>    pin a model, e.g. -m flint-40b-free' },
            { kind: 'out', text: 'opencode doctor        full system diagnostics' },
            { kind: 'out', text: 'opencode-proxy <cmd>   start · stop · restart · status · test · logs' },
            { kind: 'out', text: 'cat config.json        print ~/.opencode-proxy/config.json' },
            { kind: 'out', text: 'clear · pwd · ls · whoami · uname -m' },
            { kind: 'dim', text: 'Tip: inside the CLI press esc to exit, or type /help.' },
          );
          return;

        case 'clear':
          setLines([]);
          return;

        case 'pwd':
          push({ kind: 'out', text: '/data/data/com.termux/files/home' });
          return;

        case 'whoami':
          push({ kind: 'out', text: 'u0_a291' });
          return;

        case 'uname':
          push({ kind: 'out', text: 'Linux localhost 5.15.104-android13 aarch64 Android' });
          return;

        case 'ls':
          push(
            { kind: 'out', text: '.config  .local  .opencode-proxy  projects  storage  termux-chroot' },
          );
          return;

        case 'cat': {
          const path = joined.toLowerCase();
          if (path === 'config' || path.includes('config.json')) {
            push({
              kind: 'out',
              text: CONFIG_JSON_EXAMPLE,
            });
          } else if (path.includes('opencode.jsonc')) {
            push({ kind: 'out', text: 'hint: `cat ~/.config/opencode/opencode.jsonc` — see the Docs tab below.' });
          } else {
            push({ kind: 'err', text: `cat: ${joined || '(none)'}: No such file or directory` });
          }
          return;
        }

        case 'curl':
          if (input.includes('install.sh')) {
            runInstaller();
          } else {
            push({ kind: 'dim', text: 'demo sandbox · only the install.sh pipe is wired up' });
          }
          return;

        case 'opencode-proxy':
          if (!args[0]) {
            push({ kind: 'out', text: 'usage: opencode-proxy <start|stop|restart|status|test|logs|kill>' });
            return;
          }
          runProxyCommand(args[0]);
          return;

        case 'opencode': {
          /* flags + optional prompt */
          let mode: Mode = 'mode1';
          let model: string | undefined;
          const promptParts: string[] = [];

          for (let i = 0; i < args.length; i += 1) {
            const arg = args[i];
            if (arg === '-1') mode = 'mode1';
            else if (arg === '-2') mode = 'mode2';
            else if (arg === '-m' || arg === '--model') {
              model = args[i + 1];
              i += 1;
            } else if (arg === 'doctor') {
              runDoctor();
              return;
            } else if (arg === 'repair') {
              play(
                [
                  { kind: 'dim', text: '[*] Re-linking glibc-runner + ca-certificates-glibc...' },
                  { kind: 'ok', text: '[✓] binary links repaired · GLM 5.3 patch re-applied' },
                  { kind: 'ok', text: '[✓] gateway restarted on 127.0.0.1:8080' },
                ],
                330,
                () => setProxyRunning(true),
              );
              return;
            } else if (arg === 'update') {
              play(
                [
                  { kind: 'dim', text: '[*] Checking pinned release v1.19.5...' },
                  { kind: 'ok', text: '[✓] you are on the latest supported build (nothing to pull)' },
                  { kind: 'warn', text: '[!] `npm update -g opencode` is blocked on purpose (Bionic Exit 127)' },
                ],
                300,
              );
              return;
            } else if (arg.startsWith('-')) {
              push({ kind: 'err', text: `opencode: unknown flag ${arg}` });
              return;
            } else {
              promptParts.push(arg);
            }
          }

          const prompt = promptParts.join(' ').replace(/^["']+|["']+$/g, '');

          if (model && !MODE1_MODELS.includes(model) && !MODE2_MODELS.includes(model)) {
            push({ kind: 'err', text: `opencode: model not in the pool: ${model}` });
            push({ kind: 'dim', text: 'run `opencode` and type /models to list what is available.' });
            return;
          }

          if (!proxyRunning) {
            play(
              [
                { kind: 'warn', text: '[!] gateway cold on 127.0.0.1:8080 — spawning daemon_spawn.py' },
                { kind: 'ok', text: '[✓] opencode2api ready (pid 22140) · 6 WARP IPv6 workers warmed' },
              ],
              400,
              () => {
                setProxyRunning(true);
                openSession(mode, model, prompt || undefined);
              },
            );
            return;
          }

          openSession(mode, model, prompt || undefined);
          return;
        }

        case 'exit':
        case 'logout':
          push({ kind: 'dim', text: 'logout — closing demo session' });
          return;

        default:
          push({ kind: 'err', text: `bash: ${head}: command not found` });
      }
    },
    [openSession, play, push, runDoctor, runInstaller, runProxyCommand, proxyRunning],
  );

  /* ------------------------- inputs ------------------------- */
  const submitShell = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const value = draft;
    setDraft('');
    handleShellCommand(value);
  };

  const submitTui = (event: React.FormEvent) => {
    event.preventDefault();
    sendTuiPrompt(tuiDraft);
  };

  const focusShell = () => {
    if (window.getSelection()?.toString()) return;
    shellInputRef.current?.focus();
  };

  const focusTui = () => {
    if (window.getSelection()?.toString()) return;
    tuiInputRef.current?.focus();
  };

  const onShellKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!history.length) return;
      const next = historyIndex.current < 0 ? history.length - 1 : Math.max(0, historyIndex.current - 1);
      historyIndex.current = next;
      setDraft(history[next]);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex.current < 0) return;
      const next = historyIndex.current + 1;
      if (next >= history.length) {
        historyIndex.current = -1;
        setDraft('');
      } else {
        historyIndex.current = next;
        setDraft(history[next]);
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  };

  const chips: Array<{ label: string; command: string }> = [
    { label: 'opencode', command: 'opencode' },
    { label: 'doctor', command: 'opencode doctor' },
    { label: 'proxy logs', command: 'opencode-proxy logs' },
    { label: 'mode 2', command: 'opencode -2' },
  ];

  /* ------------------------- render ------------------------- */
  const renderShellLine = (line: TermLine) => {
    switch (line.kind) {
      case 'cmd':
        return (
          <div key={line.id} className="flex items-start gap-2 pt-1.5 pb-0.5 text-[#ECF2EE]">
            <span className="text-[#10E88A] select-none shrink-0 font-semibold">~ $</span>
            <span className="break-all font-medium">{line.text}</span>
          </div>
        );
      case 'ok':
        return (
          <div key={line.id} className="text-[#10E88A] leading-relaxed break-words">
            {line.text}
          </div>
        );
      case 'warn':
        return (
          <div key={line.id} className="text-[#F59E0B] leading-relaxed break-words">
            {line.text}
          </div>
        );
      case 'err':
        return (
          <div key={line.id} className="text-[#F87171] leading-relaxed break-words">
            {line.text}
          </div>
        );
      case 'box':
        return (
          <div key={line.id} className="text-[#B8C7BF] leading-snug whitespace-pre">
            {line.text}
          </div>
        );
      case 'out':
        return (
          <div key={line.id} className="text-[#D5E1DA] leading-relaxed whitespace-pre-wrap break-words">
            {line.text}
          </div>
        );
      default:
        return (
          <div key={line.id} className="text-[#8A9A91] leading-relaxed break-words">
            {line.text}
          </div>
        );
    }
  };

  const modeLabel = session?.mode === 'mode2' ? 'MODE 2 · :8085' : 'MODE 1 · :8080';

  return (
    <div className="w-full bg-[#0C100E] border border-[#232E29] shadow-[0_24px_70px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden">
      {/* Window chrome */}
      <div className="px-3.5 py-2.5 bg-[#121815] border-b border-[#1E2622] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A3630] border border-[#3B4B43]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A3630] border border-[#3B4B43]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10E88A]" />
          </div>
          <span className="text-[11px] font-mono text-[#94A39B] tracking-tight">
            u0_a291@termux:~ <span className="text-[#8A9A91]">(aarch64)</span>
          </span>
          <button
            type="button"
            onClick={openConnectPanel}
            title={live ? 'Live model settings' : 'Connect a real model'}
            className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono border transition-colors cursor-pointer ${
              live
                ? 'border-[#10E88A]/45 bg-[#10E88A]/12 text-[#10E88A] hover:bg-[#10E88A]/20'
                : 'border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20'
            }`}
          >
            <span
              className={`w-1 h-1 rounded-full animate-pulse-dot ${live ? 'bg-[#10E88A]' : 'bg-[#F59E0B]'}`}
            />
            {live ? `live · ${live.provider}` : 'connect api'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#090B0A] border border-[#24302A] text-[#F59E0B]">
            <Zap className="w-3 h-3" />
            2a09:bac1:7680::2f9
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#10E88A]/10 border border-[#10E88A]/30 text-[#10E88A]">
            <ShieldCheck className="w-3 h-3" />
            {proxyRunning ? 'gateway up' : 'gateway down'}
          </span>
        </div>
      </div>

      {/* ================= LIVE CONNECTION PANEL ================= */}
      {panelOpen && (
        <div className="border-b border-[#1E2622] bg-[#0E1411] px-3.5 py-3 space-y-2.5 font-mono">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10.5px] uppercase tracking-wider text-[#10E88A]">
              {live ? 'Live model settings' : 'Connect a live model'}
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="text-[10.5px] text-[#78897F] hover:text-[#ECF2EE] transition-colors cursor-pointer"
            >
              close ✕
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['openrouter', 'openai', 'local'] as LiveProvider[]).map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => {
                  setProbe({ state: 'idle', models: [], message: '' });
                  setFormError('');
                  setFormProvider(provider);
                  setFormModel((prev) =>
                    prev === DEFAULT_LIVE_MODEL[formProvider] || !prev.trim()
                      ? DEFAULT_LIVE_MODEL[provider]
                      : prev,
                  );
                  if (provider === 'local' && !formBase.trim()) {
                    setFormBase(relay?.local.base || DEFAULT_LOCAL_BASE);
                  }
                }}
                className={`px-2.5 py-1 text-[10.5px] border transition-colors cursor-pointer ${
                  formProvider === provider
                    ? 'border-[#10E88A] bg-[#10E88A]/15 text-[#10E88A]'
                    : 'border-[#26322C] bg-[#121815] text-[#94A39B] hover:text-[#ECF2EE]'
                }`}
              >
                {PROVIDER_LABEL[provider]}
              </button>
            ))}
            <span className="ml-auto text-[9.5px] text-[#78897F]">
              {isLocal ? 'loopback / LAN only' : 'key stays in this browser'}
            </span>
          </div>

          {isLocal && (
            <div className="space-y-1.5">
              <span className="block text-[9.5px] uppercase tracking-wider text-[#78897F]">Endpoint base URL</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  type="text"
                  value={formBase}
                  onChange={(event) => {
                    setFormBase(event.target.value);
                    setProbe({ state: 'idle', models: [], message: '' });
                  }}
                  placeholder={DEFAULT_LOCAL_BASE}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Local endpoint base URL"
                  className="flex-1 min-w-[180px] bg-[#090C0B] border border-[#26322C] px-2 py-1.5 text-[16px] sm:text-[11px] text-[#ECF2EE] placeholder:text-[#5D6D65] outline-none focus:border-[#10E88A]/60"
                />
                <button
                  type="button"
                  onClick={detectLocal}
                  disabled={probe.state === 'probing'}
                  className="px-2.5 py-1.5 text-[10.5px] border border-[#26322C] bg-[#121815] text-[#C5D2CB] hover:border-[#10E88A]/50 hover:text-[#10E88A] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {probe.state === 'probing' ? 'detecting…' : 'detect'}
                </button>
              </div>
              <p
                className={`text-[9.5px] leading-relaxed ${
                  probe.state === 'error'
                    ? 'text-[#F87171]'
                    : probe.state === 'ok'
                      ? 'text-[#10E88A]'
                      : 'text-[#78897F]'
                }`}
              >
                {probe.message ||
                  (relay?.local.base
                    ? `relay default: ${relay.local.base} · detect lists its models`
                    : 'point this at opencode2api, vLLM, or any OpenAI-compatible gateway on this machine or LAN')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-[9.5px] uppercase tracking-wider text-[#78897F] mb-1">
                API key {isLocal && <span className="normal-case tracking-normal">(optional)</span>}
              </span>
              <input
                type="password"
                value={formKey}
                onChange={(event) => setFormKey(event.target.value)}
                placeholder={
                  isLocal
                    ? 'local-test-key (optional)'
                    : canUseServerKey
                      ? 'server key available — optional'
                      : 'sk-…'
                }
                autoComplete="off"
                spellCheck={false}
                aria-label="Provider API key"
                className="w-full bg-[#090C0B] border border-[#26322C] px-2 py-1.5 text-[16px] sm:text-[11px] text-[#ECF2EE] placeholder:text-[#5D6D65] outline-none focus:border-[#10E88A]/60"
              />
            </label>
            <label className="block">
              <span className="block text-[9.5px] uppercase tracking-wider text-[#78897F] mb-1">Model</span>
              <input
                type="text"
                value={formModel}
                onChange={(event) => setFormModel(event.target.value)}
                placeholder={DEFAULT_LIVE_MODEL[formProvider]}
                autoComplete="off"
                spellCheck={false}
                aria-label="Live model id"
                list="opencode-local-models"
                className="w-full bg-[#090C0B] border border-[#26322C] px-2 py-1.5 text-[16px] sm:text-[11px] text-[#ECF2EE] placeholder:text-[#5D6D65] outline-none focus:border-[#10E88A]/60"
              />
              {probe.models.length > 0 && (
                <datalist id="opencode-local-models">
                  {probe.models.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              )}
            </label>
          </div>

          {!isLocal && canUseServerKey && (
            <p className="text-[10px] text-[#8A9A91]">
              This server already holds a {PROVIDER_LABEL[formProvider]} key — you can connect with the field empty.
            </p>
          )}
          {isLocal && relay?.local.base && (
            <p className="text-[10px] text-[#8A9A91]">
              Relay default: <span className="text-[#C8D5CE]">{relay.local.base}</span> — this only resolves if the
              site&apos;s server runs on the same machine or network as the gateway.
            </p>
          )}
          {formError && <p className="text-[10px] text-[#F87171]">{formError}</p>}

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={connectLive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-semibold bg-[#10E88A] text-[#06110B] hover:bg-[#34F5A1] transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3" />
              {live ? 'Update connection' : 'Connect'}
            </button>
            {live && (
              <button
                type="button"
                onClick={disconnectLive}
                className="px-2.5 py-1.5 text-[10.5px] border border-[#3A2A2A] bg-[#171111] text-[#F0A0A0] hover:border-[#F87171]/60 transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            )}
            <span className="text-[9.5px] text-[#78897F]">
              prompts then stream from the provider through this site&apos;s relay
            </span>
          </div>
        </div>
      )}

      {/* ================= SHELL VIEW ================= */}
      {!session && (
        <>
          <div
            ref={shellViewportRef}
            onClick={focusShell}
            className="p-4 sm:p-5 font-mono text-xs sm:text-[12.5px] h-[330px] overflow-auto term-scroll bg-[#090C0B] space-y-1 cursor-text"
          >
            {lines.map(renderShellLine)}

            {/* live prompt */}
            <form onSubmit={submitShell} className="flex items-center gap-2 pt-1.5">
              <span className="text-[#10E88A] select-none font-semibold shrink-0">~ $</span>
              <input
                ref={shellInputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onShellKeyDown}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="none"
                aria-label="Terminal command input"
                placeholder={busy ? 'working…' : 'type a command — try `opencode`'}
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[16px] sm:text-[12.5px] font-mono text-[#ECF2EE] placeholder:text-[#5D6D65] caret-[#10E88A] p-0 focus:ring-0"
              />
              <button
                type="submit"
                aria-label="Run command"
                className="shrink-0 p-1 text-[#8A9A91] hover:text-[#10E88A] transition-colors cursor-pointer disabled:opacity-40"
                disabled={busy}
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Quick run chips + reset */}
          <div className="px-2.5 py-2 bg-[#111614] border-t border-[#1E2622] flex items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[#78897F] hidden sm:inline select-none pl-1">run:</span>
              {chips.map((chip) => (
                <button
                  key={chip.command}
                  type="button"
                  onClick={() => {
                    if (busy) return;
                    handleShellCommand(chip.command);
                    shellInputRef.current?.focus();
                  }}
                  disabled={busy}
                  className="px-2 py-1 bg-[#18201D] hover:bg-[#10E88A]/15 hover:border-[#10E88A]/50 hover:text-[#10E88A] text-[#B4C2BA] border border-[#26322C] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={openConnectPanel}
                title={live ? 'Live model settings' : 'Connect a real model'}
                className={`inline-flex items-center gap-1 px-2.5 py-1 border transition-colors cursor-pointer ${
                  live
                    ? 'bg-[#10E88A]/12 border-[#10E88A]/45 text-[#10E88A] hover:bg-[#10E88A]/20'
                    : 'bg-[#141B18] border-[#28342E] text-[#C5D2CB] hover:border-[#10E88A]/50 hover:text-[#10E88A]'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{live ? 'live' : 'connect'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLines(BOOT_LINES);
                  setBusy(false);
                  setProxyRunning(true);
                  setHistory([]);
                  historyIndex.current = -1;
                  shellInputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#141B18] hover:bg-[#1C2521] text-[#C5D2CB] border border-[#28342E] transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3 text-[#10E88A]" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= OPENCODE TUI VIEW ================= */}
      {session && (
        <div className="bg-[#090C0B]">
          {/* TUI header */}
          <div className="px-3.5 py-2 border-b border-[#1E2622] bg-[#0E1411] flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px]">
            <div className="flex items-center gap-2 min-w-0">
              <TerminalIcon className="w-3.5 h-3.5 text-[#10E88A] shrink-0" />
              <span className="text-[#ECF2EE] font-semibold">opencode</span>
              <span className="text-[#3B4A43]">/</span>
              <span className="text-[#94A39B] truncate">~/projects/termux-proxy</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`px-1.5 py-0.5 border ${
                  session.mode === 'mode2'
                    ? 'border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]'
                    : 'border-[#10E88A]/35 bg-[#10E88A]/10 text-[#10E88A]'
                }`}
              >
                {modeLabel}
              </span>
              {live && (
                <button
                  type="button"
                  onClick={openConnectPanel}
                  className="px-1.5 py-0.5 border border-[#10E88A]/45 bg-[#10E88A]/12 text-[#10E88A] cursor-pointer hover:bg-[#10E88A]/20 transition-colors"
                >
                  LIVE
                </button>
              )}
              <span className="px-1.5 py-0.5 border border-[#26322C] bg-[#121815] text-[#B4C2BA] max-w-[150px] truncate">
                {live ? live.model : session.model}
              </span>
            </div>
          </div>

          {/* TUI transcript */}
          <div
            ref={tuiViewportRef}
            onClick={focusTui}
            className="px-3.5 sm:px-4 py-3 font-mono text-xs h-[292px] overflow-auto term-scroll space-y-2 cursor-text"
          >
            <div className="text-[#78897F] text-[10.5px] leading-relaxed pb-2 border-b border-[#161E1A]">
              {session.mode === 'mode1'
                ? '10 free models routed through 127.0.0.1:8080 · no API key · WARP IPv6 rotation on 429'
                : 'OpenRouter bridge on 127.0.0.1:8085 · BYOK models alongside the free pool'}
              <div className={`mt-1 ${live ? 'text-[#10E88A]' : 'text-[#78897F]'}`}>
                {live
                  ? `live · ${PROVIDER_LABEL[live.provider]}${live.baseUrl ? ` · ${live.baseUrl}` : ''} · replies stream through this site's relay`
                  : 'demo session · replies are simulated in your browser'}
              </div>
            </div>

            {messages.map((message) => {
              if (message.role === 'system') {
                return (
                  <div
                    key={message.id}
                    className="flex items-start gap-2 text-[10.5px] text-[#B08A3E] bg-[#F59E0B]/[0.07] border border-[#F59E0B]/25 px-2 py-1.5 leading-relaxed"
                  >
                    <span className="text-[#F59E0B] shrink-0">⚙</span>
                    <span className="whitespace-pre-wrap break-words">{message.text}</span>
                  </div>
                );
              }

              if (message.role === 'user') {
                return (
                  <div key={message.id} className="flex items-start gap-2">
                    <span className="text-[#10E88A] select-none shrink-0 font-semibold">›</span>
                    <span className="text-[#ECF2EE] whitespace-pre-wrap break-words leading-relaxed">
                      {message.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={message.id} className="pl-4 border-l border-[#1E2A24]">
                  <div className="text-[#C8D5CE] whitespace-pre-wrap break-words leading-relaxed">
                    {message.text}
                  </div>
                </div>
              );
            })}

            {streamingText !== null && (
              <div className="pl-4 border-l border-[#10E88A]/40">
                <div className="text-[#C8D5CE] whitespace-pre-wrap break-words leading-relaxed">
                  {streamingText}
                  <span className="inline-block w-1.5 h-3 ml-0.5 align-middle bg-[#10E88A] animate-cursor" />
                </div>
              </div>
            )}

            {rotating && (
              <div className="text-[10.5px] text-[#F59E0B] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse-dot" />
                warp-pool: rotating IPv6 exit…
              </div>
            )}
          </div>

          {/* TUI input */}
          <form
            onSubmit={submitTui}
            className="px-3.5 py-2.5 border-t border-[#1E2622] bg-[#0B100E] flex items-center gap-2 font-mono"
          >
            <span className="text-[#10E88A] select-none shrink-0">›</span>
            <input
              ref={tuiInputRef}
              value={tuiDraft}
              onChange={(e) => setTuiDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  exitTui();
                }
              }}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="none"
              aria-label="OpenCode prompt"
              placeholder={
                streamingText !== null
                  ? 'streaming…'
                  : live
                    ? `ask ${live.model} · /connect to change · esc to exit`
                    : 'ask anything · /connect for live replies · esc to exit'
              }
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[16px] sm:text-[12.5px] font-mono text-[#ECF2EE] placeholder:text-[#5D6D65] caret-[#10E88A] p-0 focus:ring-0"
            />
            <button
              type="submit"
              disabled={streamingText !== null}
              aria-label="Send prompt"
              className="shrink-0 p-1 text-[#8A9A91] hover:text-[#10E88A] transition-colors cursor-pointer disabled:opacity-40"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* TUI keybind bar */}
          <div className="px-3.5 py-1.5 border-t border-[#151D19] bg-[#0E1311] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[#78897F]">
            <div className="flex items-center gap-3">
              <span><span className="text-[#B4C2BA]">esc</span> exit</span>
              <span><span className="text-[#B4C2BA]">/model</span> switch</span>
              <button
                type="button"
                onClick={openConnectPanel}
                className={`cursor-pointer transition-colors ${
                  live ? 'text-[#10E88A] hover:text-[#34F5A1]' : 'text-[#B4C2BA] hover:text-[#10E88A]'
                }`}
              >
                {live ? 'live settings' : '/connect api'}
              </button>
            </div>
            <button
              type="button"
              onClick={exitTui}
              className="inline-flex items-center gap-1 text-[#B4C2BA] hover:text-[#10E88A] transition-colors cursor-pointer"
            >
              <Play className="w-2.5 h-2.5 rotate-180" />
              back to shell
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
