import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'api-serverless-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlStr = req.originalUrl || req.url;
        if (!urlStr || !urlStr.startsWith('/api/')) return next();

        try {
          const parsedUrl = new URL(urlStr, 'http://localhost');
          if (parsedUrl.pathname === '/api/health') {
            const { default: handler } = await import('./api/health.js');
            await handler(req, res);
            return;
          }
          if (parsedUrl.pathname === '/api/hdb') {
            const { default: handler } = await import('./api/hdb.js');
            await handler(req, res);
            return;
          }
        } catch (err) {
          console.error('API middleware error:', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(err) }));
          }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
