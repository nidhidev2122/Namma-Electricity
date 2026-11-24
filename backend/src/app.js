import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { query } from './db.js';
import { loadUser } from './sessions.js';
import { errorHandler, notFound, wrap } from './http.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import subdivisionRoutes from './routes/subdivisions.js';
import { reportsRouter, pulseRouter, alertsRouter } from './routes/community.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Render, Railway, Fly and friends sit behind one proxy
  // CSP is off because the frontend loads map tiles and inline styles; everything else in helmet stays on.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  if (config.corsOrigins.length) app.use('/api', cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '600kb' }));

  app.get('/api/health', wrap(async (_req, res) => { await query('select 1'); res.json({ ok: true }); }));

  app.use('/api', rateLimit({ windowMs: 15 * 6e4, limit: 600, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please slow down.' } }));
  app.use('/api/auth/login', rateLimit({ windowMs: 15 * 6e4, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts. Try again in a few minutes.' } }));
  app.use('/api/auth/register', rateLimit({ windowMs: 60 * 6e4, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many sign-ups from this network. Try again later.' } }));
  app.use('/api', loadUser);

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/subdivisions', subdivisionRoutes);
  app.use('/api/reports', reportsRouter);
  app.use('/api/pulse', pulseRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api', notFound);

  // One free host can serve the built frontend too, which keeps cookies same-origin.
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', config.staticDir);
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist, { maxAge: '1h', index: 'index.html' }));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
