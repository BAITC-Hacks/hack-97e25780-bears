import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { app as api, port } from './src/server.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

// Preserve API paths and JSON 404s. The API app must not consume frontend routes.
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/api' || req.path.startsWith('/api/')) {
    return api(req, res, next);
  }
  next();
});

if (production) {
  const entry = path.join(root, 'dist', 'index.html');
  if (!existsSync(entry)) {
    throw new Error('Frontend build is missing. Run npm run build before npm start.');
  }
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(entry));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`Challenge Hub UI + API: http://localhost:${port}`);
});
