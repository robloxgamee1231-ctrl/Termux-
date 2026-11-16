export const GITHUB_REPO_URL = 'https://github.com/leangtg123-art/opencode-termux-unlimited';
export const INSTALL_COMMAND =
  'curl -fsSL https://raw.githubusercontent.com/leangtg123-art/opencode-termux-unlimited/main/install.sh | bash';
export const UNINSTALL_COMMAND =
  'curl -fsSL https://raw.githubusercontent.com/leangtg123-art/opencode-termux-unlimited/main/uninstall.sh | bash';
export const LAUNCH_COMMAND = 'opencode';

export interface CoreFeature {
  index: string;
  title: string;
  shortLead: string;
  detail: string;
  specBadge: string;
  runtimeKey: string;
  runtimeVal: string;
  accent: 'phosphor' | 'amber';
}

export const CORE_FEATURES: CoreFeature[] = [
  {
    index: '01',
    title: 'Pure Native',
    shortLead: 'Runs via termux-chroot + glibc-runner (no containers).',
    detail:
      'Executes the patched monolithic ARM64 OpenCode binary directly in-process under grun (ld-linux-aarch64.so.1). Zero Docker overhead, zero root requirement, and immune to Android Bionic linker crashes (Exit 127).',
    specBadge: 'aarch64 · grun',
    runtimeKey: 'EXEC LAYER',
    runtimeVal: 'termux-chroot + glibc-runner',
    accent: 'phosphor',
  },
  {
    index: '02',
    title: 'Auto-Rotation',
    shortLead: 'Dynamic WARP IPv6 rotation on rate limits.',
    detail:
      'Maintains a 6-worker Cloudflare WARP IPv6 pool ("stack": "ipv6"). On upstream HTTP 429 or 403 quota blocks, opencode2api swaps to a fresh unicast 2a09:bac1::/32 exit—sidestepping congested shared IPv4 NAT pools.',
    specBadge: '6x WARP IPv6',
    runtimeKey: 'EGRESS POOL',
    runtimeVal: '2a09:bac1::/32 · Auto-Swap',
    accent: 'amber',
  },
  {
    index: '03',
    title: 'Failover Pool',
    shortLead: 'Auto-swaps between nemotron-3.5-lightning, flint-40b, deepseek-v4.1.',
    detail:
      'Continuously probes upstream latency and quota health across deepseek-v4.1, nemotron-3.5-lightning, flint-40b, and glm-5.3-flash (reasoning unlocked), failing over transparently mid-session.',
    specBadge: 'Zero-Drop Swap',
    runtimeKey: 'ACTIVE POOL',
    runtimeVal: 'deepseek-v4.1 · nemotron-3.5 · flint-40b',
    accent: 'phosphor',
  },
  {
    index: '04',
    title: 'Daemonized',
    shortLead: 'Double-fork background spawner survives terminal exit.',
    detail:
      'Detaches opencode2api (127.0.0.1:8080) and optional openrouter-bridge (:8085) via POSIX setsid() double-fork in daemon_spawn.py. Guarded by active /healthz polling and automatic SQLite 429 lockout inoculation.',
    specBadge: 'setsid() · :8080',
    runtimeKey: 'SUPERVISOR',
    runtimeVal: 'daemon_spawn.py + /healthz',
    accent: 'phosphor',
  },
];

export interface TerminalLine {
  type: 'cmd' | 'info' | 'ok' | 'warn' | 'err' | 'dim' | 'box' | 'output';
  text: string;
  delayMs?: number;
}

export interface TerminalScenario {
  id: string;
  tabLabel: string;
  badge: string;
  warpExit: string;
  activeModel: string;
  lines: TerminalLine[];
}

export const TERMINAL_SCENARIOS: TerminalScenario[] = [
  {
    id: 'quickstart',
    tabLabel: 'install & launch',
    badge: 'MODE 1 · FREE',
    warpExit: '2a09:bac1:7680:14::2f9',
    activeModel: 'deepseek-v4.1-flash-free',
    lines: [
      {
        type: 'cmd',
        text: 'curl -fsSL https://raw.githubusercontent.com/leangtg123-art/opencode-termux-unlimited/main/install.sh | bash',
      },
      { type: 'dim', text: '[*] Verifying Android architecture... aarch64 (Termux native)' },
      { type: 'ok', text: '[✓] Linked termux-chroot + glibc-runner (ld-linux-aarch64.so.1)' },
      { type: 'ok', text: '[✓] Applied 1:1 GLM 5.3 reasoning unlock byte-patch to opencode-bin' },
      { type: 'ok', text: '[✓] Spawned daemon_spawn.py -> opencode2api on 127.0.0.1:8080 (PID 18492)' },
      { type: 'ok', text: '[✓] Cloudflare WARP IPv6 pool ready: 6 workers [2a09:bac1:7680::/48]' },
      { type: 'cmd', text: 'opencode' },
      { type: 'box', text: '┌─ OpenCode Termux Unlimited v2.0.7 · Gateway 127.0.0.1:8080 ─┐' },
      { type: 'box', text: '│ Mode 1: Unlimited Free Proxy · No API Key · Zero Rate Limit │' },
      { type: 'box', text: '└─────────────────────────────────────────────────────────────┘' },
      { type: 'output', text: '> Refactor proxy_pool.go for lock-free ring buffer telemetry' },
      { type: 'ok', text: '⚡ Streaming via deepseek-v4.1-flash-free (TTFT 184ms · 0 quota used)' },
    ],
  },
  {
    id: 'rotation',
    tabLabel: '429 warp rotation',
    badge: 'AUTO-ROTATE',
    warpExit: '2a09:bac5:3910:8a::c41',
    activeModel: 'nemotron-3.5-lightning',
    lines: [
      { type: 'cmd', text: 'opencode-proxy logs --follow' },
      { type: 'dim', text: '23:14:02 INF [gateway:8080] POST /v1/chat/completions model=nemotron-3.5-lightning' },
      { type: 'err', text: '23:14:02 WRN [upstream] HTTP 429 Free usage limit reached on exit 2a09:bac1:7680::2f9' },
      { type: 'warn', text: '23:14:02 WRN [warp-pool] Cooling worker #2 -> rotating to standby worker #5 (IPv6)' },
      { type: 'ok', text: '23:14:02 INF [warp-pool] New WARP exit bound: 2a09:bac5:3910:8a::c41 (RTT 29ms)' },
      { type: 'warn', text: '23:14:03 INF [failover] Swapping nemotron-3.5-lightning -> deepseek-v4.1 (attempt 2/6)' },
      { type: 'ok', text: '23:14:03 INF [gateway:8080] HTTP 200 SSE stream resumed · session preserved' },
      { type: 'dim', text: '23:14:08 INF [db-guard] SQLite 429 lockout check clean (0 poisoned rows)' },
    ],
  },
  {
    id: 'audit',
    tabLabel: 'audit refusal guard',
    badge: 'GATEWAY :8080',
    warpExit: '2a09:bac1:7680:14::8b0',
    activeModel: 'flint-40b',
    lines: [
      { type: 'cmd', text: 'opencode -1 "Audit ELF symbols & open local sockets in Termux $PREFIX/bin"' },
      { type: 'dim', text: '[gateway:8080] Inspecting outbound system/audit task context...' },
      { type: 'err', text: '[intercept] Upstream returned false-positive safety refusal on ELF/socket audit' },
      { type: 'warn', text: '[gateway:8080] Applying system-audit framing normalization + failover -> flint-40b' },
      { type: 'ok', text: '[gateway:8080] Upstream accepted diagnostic audit context (HTTP 200 OK)' },
      { type: 'output', text: 'Analyzing ELF dynamic section via readelf -d & ss -tulpn on 127.0.0.1...' },
      { type: 'ok', text: '✓ Audit report generated: 2 local listeners (:8080 opencode2api, :8081 webui).' },
    ],
  },
  {
    id: 'doctor',
    tabLabel: 'opencode doctor',
    badge: 'DIAGNOSTICS',
    warpExit: '2a09:bac1:7680:14::2f9',
    activeModel: '10 models online',
    lines: [
      { type: 'cmd', text: 'opencode doctor' },
      { type: 'box', text: '=== OpenCode Termux System Diagnostics (Doctor) ===' },
      { type: 'ok', text: '[*] Checking system architecture... OK (aarch64)' },
      { type: 'ok', text: '[*] Checking termux-chroot + glibc-runner (grun)... OK' },
      { type: 'ok', text: '[*] Checking OpenCode binary (v1.19.5 monolithic)... FOUND' },
      { type: 'ok', text: '[*] Checking GLM 5.3 reasoning patch... ACTIVE (Unlocked)' },
      { type: 'ok', text: '[*] Checking Unlimited Proxy (127.0.0.1:8080)... RUNNING (WARP: 6/6, Models: 10)' },
      { type: 'ok', text: '[*] Checking OpenRouter Bridge (127.0.0.1:8085)... STANDBY (Mode 2 ready)' },
      { type: 'ok', text: '[*] Validating ~/.config/opencode/opencode.jsonc... VALID' },
      { type: 'ok', text: '[✓] All core systems operational. Zero rate-limit locks.' },
    ],
  },
];

export interface ArchNode {
  id: string;
  stage: string;
  title: string;
  subtitle: string;
  binaryOrPort: string;
  path: string;
  summary: string;
  highlights: string[];
}

export const ARCH_NODES: ArchNode[] = [
  {
    id: 'cli',
    stage: 'STAGE 01 · CLIENT RUNTIME',
    title: 'OpenCode CLI (Native ARM64)',
    subtitle: 'termux-chroot + glibc-runner (grun)',
    binaryOrPort: 'opencode-bin v1.19.5',
    path: '~/.local/bin/opencode',
    summary:
      'Runs the patched monolithic ARM64 OpenCode TUI directly inside Android Termux without root, Docker, or full OS PRoot distributions.',
    highlights: [
      'Executes via glibc-runner (ld-linux-aarch64.so.1) + termux-chroot to prevent Android Bionic Exit 127 crashes',
      'Includes automated 1:1 binary byte-patch unlocking GLM 5.3 reasoning effort (low / medium / high / max)',
      'Protected against accidental npm/bun v2.x overwrites via OPENCODE_DISABLE_AUTOUPDATE=true',
    ],
  },
  {
    id: 'gateway',
    stage: 'STAGE 02 · LOCAL GATEWAY',
    title: 'opencode2api Gateway & Refusal Guard',
    subtitle: '127.0.0.1:8080 · WebUI :8081',
    binaryOrPort: '127.0.0.1:8080/v1',
    path: '~/.opencode-proxy/bin/opencode2api',
    summary:
      'Compiled Go ARM64 local OpenAI-compatible gateway spawned via double-fork daemon_spawn.py so background inference survives terminal exit.',
    highlights: [
      'Intercepts false-positive safety refusals triggered during legitimate Linux/Android system & security audit tasks',
      'Detects HTTP 429 / 403 upstream responses in real time and retries up to 6x before surfacing any error to the TUI',
      'Includes SQLite 429 session lockout auto-inoculation to prevent recursive retry loops in opencode.db',
    ],
  },
  {
    id: 'warp',
    stage: 'STAGE 03 · EGRESS ROTATION',
    title: 'Cloudflare WARP IPv6 Worker Pool',
    subtitle: '6 Concurrent Tunnels · "stack": "ipv6"',
    binaryOrPort: '2a09:bac1::/32',
    path: '~/.opencode-proxy/config.json',
    summary:
      'Locks egress to dedicated Cloudflare WARP IPv6 unicast exits (preload: 3, active: 3, standby: 3) rather than shared IPv4 NAT ranges.',
    highlights: [
      'Sidesteps congested Cloudflare 104.28.x.x IPv4 NAT addresses that trigger global upstream HTTP 429 blocks',
      'Rotates instantaneously to a warm standby IPv6 tunnel upon any 429/403 quota response',
      'Propagates ca-certificates-glibc & SSL_CERT_FILE cleanly across Termux network handoffs (Wi-Fi <-> 5G)',
    ],
  },
  {
    id: 'pool',
    stage: 'STAGE 04 · UPSTREAM FAILOVER',
    title: 'Multi-Model Failover Pool + Bridge',
    subtitle: '10 Free Unlimited + Mode 2 OpenRouter (:8085)',
    binaryOrPort: 'Zero Quota Cap',
    path: '~/.config/opencode/opencode.jsonc',
    summary:
      'Automatically routes and fails over across high-speed free coding models, with an optional Mode 2 Python stdlib bridge on 127.0.0.1:8085.',
    highlights: [
      'Primary Failover Trio: deepseek-v4.1-flash-free, nemotron-3.5-lightning-free, flint-40b-free',
      'Extended 1M-context free pool: glm-5.3-flash-free, nemotron-3.5-super-vl-free, pulse-alpha-free, beam-free',
      'Optional Mode 2 Dual Gateway (:8085) adds smart-egress OpenRouter access for Claude 3.7 Sonnet, GPT-4o & o3-mini',
    ],
  },
];

export interface ModelItem {
  id: string;
  shortAlias: string;
  provider: string;
  context: string;
  mode: 'mode1' | 'mode2';
  isPrimaryFailover?: boolean;
  badge?: string;
  capabilities: string;
}

export const MODEL_CATALOG: ModelItem[] = [
  {
    id: 'deepseek-v4.1-flash-free',
    shortAlias: 'deepseek-v4.1',
    provider: 'DeepSeek',
    context: '1,000,000',
    mode: 'mode1',
    isPrimaryFailover: true,
    badge: 'FAILOVER POOL #1',
    capabilities: 'Primary coding & agentic tool execution, ultra-low TTFT',
  },
  {
    id: 'nemotron-3.5-lightning-free',
    shortAlias: 'nemotron-3.5-lightning',
    provider: 'NVIDIA',
    context: '262,144',
    mode: 'mode1',
    isPrimaryFailover: true,
    badge: 'FAILOVER POOL #2',
    capabilities: 'High-speed instruction following, rapid shell & audit loops',
  },
  {
    id: 'flint-40b-free',
    shortAlias: 'flint-40b',
    provider: 'Flint',
    context: '128,000',
    mode: 'mode1',
    isPrimaryFailover: true,
    badge: 'FAILOVER POOL #3',
    capabilities: 'Balanced systems reasoning, code synthesis & audit fallback',
  },
  {
    id: 'glm-5.3-flash-free',
    shortAlias: 'glm-5.3-flash',
    provider: 'Zhipu AI',
    context: '1,000,000',
    mode: 'mode1',
    badge: 'REASONING UNLOCKED',
    capabilities: 'Byte-patched effort levels (low / med / high / max) + vision',
  },
  {
    id: 'nemotron-3.5-super-vl-free',
    shortAlias: 'nemotron-3.5-super-vl',
    provider: 'NVIDIA',
    context: '1,048,576',
    mode: 'mode1',
    badge: 'VISION · 1M',
    capabilities: 'Multimodal UI/screenshot inspection & large document analysis',
  },
  {
    id: 'pulse-alpha-free',
    shortAlias: 'pulse-alpha',
    provider: 'Pulse',
    context: '1,048,576',
    mode: 'mode1',
    capabilities: 'High-throughput multi-file autonomous agent execution',
  },
  {
    id: 'big-pickle',
    shortAlias: 'big-pickle',
    provider: 'Pickle',
    context: '200,000',
    mode: 'mode1',
    capabilities: 'Deliberate architectural planning & root-cause debugging',
  },
  {
    id: 'mimo-v2.6-flash-free',
    shortAlias: 'mimo-v2.6-flash',
    provider: 'Xiaomi',
    context: '262,144',
    mode: 'mode1',
    capabilities: 'Low-latency code drafting & inline edits',
  },
  {
    id: 'beam-free',
    shortAlias: 'beam-free',
    provider: 'Reflection',
    context: '1,048,576',
    mode: 'mode1',
    capabilities: 'Multi-turn verification & deep repository context',
  },
  {
    id: 'crouton-alpha-free',
    shortAlias: 'crouton-alpha',
    provider: 'Crouton',
    context: '1,048,576',
    mode: 'mode1',
    capabilities: 'Long-horizon full-repo context window (1M+ tokens)',
  },
  {
    id: 'anthropic/claude-3.7-sonnet',
    shortAlias: 'claude-3.7-sonnet',
    provider: 'OpenRouter (:8085)',
    context: '200,000',
    mode: 'mode2',
    badge: 'MODE 2 BRIDGE',
    capabilities: 'Frontier hybrid reasoning via Smart Egress Auto-Probe (BYOK)',
  },
  {
    id: 'openai/o3-mini',
    shortAlias: 'o3-mini',
    provider: 'OpenRouter (:8085)',
    context: '200,000',
    mode: 'mode2',
    badge: 'MODE 2 BRIDGE',
    capabilities: 'Deep algorithmic & systems reasoning via :8085 Python bridge',
  },
  {
    id: 'google/gemini-2.5-pro',
    shortAlias: 'gemini-2.5-pro',
    provider: 'OpenRouter (:8085)',
    context: '1,048,576',
    mode: 'mode2',
    badge: 'MODE 2 BRIDGE',
    capabilities: '1M-token multimodal frontier synthesis via :8085 bridge',
  },
];

export const CONFIG_JSON_EXAMPLE = `{
  "listen": "127.0.0.1:8080",
  "server_keys": ["local-test-key"],
  "anonymous": true,
  "warp": {
    "enabled": true,
    "pool_size": 6,
    "stack": "ipv6",
    "source_ipv6": ""
  },
  "retry": {
    "max_attempts": 6,
    "timeout_seconds": 180
  },
  "models": {
    "refresh_seconds": 300,
    "free_only": true
  },
  "webui": {
    "enabled": true,
    "listen": "127.0.0.1:8081",
    "username": "admin"
  }
}`;

export const OPENCODE_JSONC_EXAMPLE = `{
  "$schema": "https://opencode.ai/config.json",
  "autoupdate": false,
  "model": "opencode-unlimited-proxy/deepseek-v4.1-flash-free",
  "provider": {
    "opencode-unlimited-proxy": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "http://127.0.0.1:8080/v1",
        "apiKey": "local-test-key"
      },
      "models": {
        "deepseek-v4.1-flash-free": {},
        "nemotron-3.5-lightning-free": {},
        "flint-40b-free": {},
        "glm-5.3-flash-free": {
          "variants": {
            "low": { "reasoningEffort": "low" },
            "medium": { "reasoningEffort": "medium" },
            "high": { "reasoningEffort": "high" },
            "max": { "reasoningEffort": "max" }
          }
        }
      }
    }
  }
}`;

export const FILE_LAYOUT_TREE = `~/.local/bin/
├── opencode           # Multi-mode launcher, wrapper guard & system doctor
├── opencode-bin       # Patched ARM64 OpenCode v1.19.5 (GLM 5.3 unlocked)
├── opencode-proxy     # Daemon controller for local 127.0.0.1:8080 proxy
└── openrouter-bridge  # Daemon controller for optional 127.0.0.1:8085 bridge

~/.opencode-proxy/
├── bin/opencode2api   # Native Go ARM64 WARP-enabled gateway + refusal guard
├── daemon_spawn.py    # POSIX setsid() double-fork background spawner
├── config.json        # 6-worker IPv6 WARP pool & retry configuration
└── proxy.log          # Live ring-buffer telemetry & rotation logs

~/.config/opencode/
└── opencode.jsonc     # Pre-wired failover models & autoupdate lock`;
