# OpenCode Termux Unlimited — Site

Product & documentation site for [leangtg123-art/opencode-termux-unlimited](https://github.com/leangtg123-art/opencode-termux-unlimited).

> Run OpenCode CLI natively on Android with zero rate limits. No root, no Docker.

Built with **React 19**, **TypeScript**, **Vite 6**, and **Tailwind CSS v4**.

## Sections

- **Hero** — title, tagline, one-line install command, and a working in-browser terminal. Type real commands (`opencode`, `opencode -1`/`-2`, `-m <model>`, `opencode doctor`, `opencode-proxy status|restart|test|logs`, `curl ... | bash`, `cat`, `help`, `clear`, arrow-key history) and use the simulated OpenCode TUI: prompt streaming, `/model`, `/models`, `/proxy status`, `/exit`, `esc` to leave. Model replies are simulated locally — no requests leave the browser.
- **Core Features** — Pure Native, Auto-Rotation, Failover Pool, Daemonized.
- **Gateway Architecture** — interactive four-stage pipeline (`opencode` → `127.0.0.1:8080` → WARP IPv6 → failover pool) with stress-event simulations and a live six-worker IPv6 pool readout.
- **Model Catalog** — searchable / filterable table of Mode 1 free unlimited models and Mode 2 OpenRouter models, each with a copyable launch command.
- **Quick Install & Docs** — installer `curl`, launch flags, `opencode-proxy` daemon control, `config.json` / `opencode.jsonc` tabs, installed layout tree, and the Bionic linker `v2.x` advisory.

## Live replies: local gateway or cloud key

The terminal ships with a simulated reply engine so the page works with zero
setup. Press **connect** in the terminal (or type `/connect` inside OpenCode) to
stream real output instead.

### Local gateway (recommended on Termux)

The relay accepts **loopback and private-network endpoints only** — `127.0.0.1`,
`localhost`, `10.x`, `172.16-31.x`, `192.168.x`, `169.254.x`, `*.local`. Public
hosts are rejected, so the relay can never be used as an open proxy.

```bash
# 1. terminal A — the gateway (Termux)
opencode-proxy start                       # binds 127.0.0.1:8080

# 2. terminal B — this site, relay pointed at the gateway
OPENCODE_LOCAL_BASE=http://127.0.0.1:8080/v1 npm run dev     # site on :5173

# production instead
npm run build
OPENCODE_LOCAL_BASE=http://127.0.0.1:8080/v1 PORT=3000 npm start
```

> `npm start` deliberately defaults to `:3000`, not `:8080` — `opencode2api`
> already owns 8080 on a Termux device.

In the terminal: **connect → Local endpoint → detect → Connect**. Detect calls
`GET <base>/models` through the relay and lists the gateway's models, so the
model field fills itself. With `OPENCODE_LOCAL_BASE` set, the base URL is
prefilled and the panel notes the relay default.

A hosted copy of this site cannot reach your phone's `127.0.0.1` — the *relay*
is what must see the gateway. For a LAN device use its private address
(`http://192.168.1.42:8080/v1`), and only if the gateway binds beyond loopback.

### Cloud providers (OpenRouter / OpenAI)

1. **Per visitor** — paste a key into the connect panel. It stays in
   `localStorage` and is sent only to this site's `/api/chat` relay.
2. **Per server** — give the relay the key so visitors never need one:

```bash
OPENROUTER_API_KEY=sk-or-... npm run dev
# or
OPENROUTER_API_KEY=sk-or-... npm start
# or, loading a .env file (Node 22+):
node --env-file=.env server/index.mjs
```

### Relay reference

| Route | Purpose |
| --- | --- |
| `GET /api/status` | Provider list, which ones have server keys, relay default local base |
| `POST /api/local/probe` | Validates a base URL and lists its models via `GET /models` |
| `POST /api/chat` | Validates, rate-limits, and streams `text/event-stream` |

- Cloud bases are fixed (`openrouter.ai`, `api.openai.com`); local bases must be private.
- 40 chat requests/minute per IP, 20 probes/minute, 1 MB bodies, last 40 messages, 4 s probe timeout.
- Keys are held in memory for one request — never logged, never written.
- Errors (401 no key, 400 invalid base, 429 rate limit, 502 unreachable) surface in the terminal. If a *cloud* provider is unreachable, the UI says so and falls back to the simulation instead of faking output.

### Environment variables

| Variable | Effect |
| --- | --- |
| `OPENCODE_LOCAL_BASE` | Default local base URL (`http://127.0.0.1:8080/v1`) |
| `OPENCODE_LOCAL_KEY` | Optional bearer token for the local gateway |
| `OPENROUTER_API_KEY` / `OPENAI_API_KEY` | Cloud provider keys |
| `OPENCODE_API_KEY` | Fallback key for any provider |
| `OPENCODE_API_BASE` | Legacy alias for `OPENCODE_LOCAL_BASE` |
| `PORT` | `npm start` port (default `3000`) |

See `.env.example` for the same list with comments.

## Development

```bash
npm install
npm run dev     # http://0.0.0.0:5173
npm run build   # type-check + production bundle into dist/
npm run preview # static preview of dist/ (no relay)
npm start       # dist/ + /api relay on :3000 (production)
```

All runtime content (commands, model IDs, ports, config examples) lives in
`src/data/runtimeData.ts` so copy can be updated without touching components.

## Credits

Upstream project by `leangtg123-art` and `leanianstudio`, MIT License.
This repository is an unofficial documentation site.
