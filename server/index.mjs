/**
 * Production server: serves the built site from dist/ and mounts the model
 * relay so live inference works outside the Vite dev server.
 *
 *   npm run build && npm start
 *   OPENROUTER_API_KEY=sk-or-... PORT=3000 npm start
 *   OPENCODE_LOCAL_BASE=http://127.0.0.1:8080/v1 npm start
 */
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './api.mjs';

const root = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith('/api/')) {
    try {
      await handleApi(req, res, pathname);
    } catch {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify({ error: 'relay_failure' }));
    }
    return;
  }

  if (!existsSync(root)) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('dist/ not found — run `npm run build` first.\n');
    return;
  }

  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, safePath);
  if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, 'index.html');
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[extname(filePath)] || 'application/octet-stream');
  res.setHeader('Cache-Control', filePath.endsWith('index.html') ? 'no-store' : 'public, max-age=86400');
  createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  const live = Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENCODE_API_KEY);
  console.log(`site      http://${host}:${port}`);
  console.log(`relay     /api/chat  ${live ? '(server key detected)' : '(browser-supplied keys only)'}`);
});
