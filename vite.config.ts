import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleApi } from './server/api.mjs';

/**
 * Serves /api/status and /api/chat from the dev server so the in-browser
 * terminal can stream real model output without a separate process.
 */
function modelRelayPlugin(): Plugin {
  return {
    name: 'opencode-model-relay',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        if (!pathname.startsWith('/api/')) return next();
        handleApi(req, res, pathname).catch(() => {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
          }
          res.end(JSON.stringify({ error: 'relay_failure' }));
        });
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), modelRelayPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
});
