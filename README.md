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

## Live model replies (bring your own key)

The terminal ships with a simulated reply engine so the page works with zero
setup. Press **connect** in the terminal (or type `/connect` inside OpenCode) to
stream real output instead.

There are two ways to supply a key:

**1. Per visitor, from the browser.** Paste an OpenRouter or OpenAI key into the
connect panel. It is kept in `localStorage` on that device and sent only to this
site's own `/api/chat` relay, which forwards it to the provider for that single
request. Nothing is logged or written server-side.

**2. Per server, from the environment.** Useful for a public deployment where
visitors should not need their own key:

```bash
# dev server (Vite)
OPENROUTER_API_KEY=sk-or-... npm run dev

# production build + static server with the relay mounted
npm run build
OPENROUTER_API_KEY=sk-or-... npm start   # http://0.0.0.0:8080
# or, loading a .env file (Node 22+):
node --env-file=.env server/index.mjs
```

`OPENAI_API_KEY` selects OpenAI, `OPENCODE_API_KEY` works for either.
See `.env.example` for the full list, including `OPENCODE_API_BASE` for
self-hosted OpenAI-compatible endpoints.

**Relay behaviour**

| Route | Purpose |
| --- | --- |
| `GET /api/status` | Which providers have a server-side key (never returns keys) |
| `POST /api/chat` | Validates, rate-limits, and streams `text/event-stream` from the provider |

- Provider URLs are fixed (`openrouter.ai`, `api.openai.com`) — the browser cannot point the relay anywhere else.
- Requests are capped at 40/minute per IP, 1 MB per body, last 40 messages.
- Upstream errors are passed back as JSON and rendered in the terminal.
- If the server itself cannot reach the provider, the UI says so and falls back to the simulation rather than pretending.

## Development

```bash
npm install
npm run dev     # http://0.0.0.0:5173
npm run build   # type-check + production bundle into dist/
npm run preview # static preview of dist/ (no relay)
npm start       # dist/ + /api relay on :8080 (production)
```

All runtime content (commands, model IDs, ports, config examples) lives in
`src/data/runtimeData.ts` so copy can be updated without touching components.

## Credits

Upstream project by `leangtg123-art` and `leanianstudio`, MIT License.
This repository is an unofficial documentation site.
