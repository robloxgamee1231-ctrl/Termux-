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

## Development

```bash
npm install
npm run dev     # http://0.0.0.0:5173
npm run build   # type-check + production bundle into dist/
npm run preview
```

All runtime content (commands, model IDs, ports, config examples) lives in
`src/data/runtimeData.ts` so copy can be updated without touching components.

## Credits

Upstream project by `leangtg123-art` and `leanianstudio`, MIT License.
This repository is an unofficial documentation site.
