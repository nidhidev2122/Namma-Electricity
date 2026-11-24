import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { query } from '../db.js';
import { HttpError, wrap, actor } from '../http.js';

const KINDS = ['outage', 'voltage', 'restored'];
const PER_HOUR = 5;

// Shared by /api/reports and /api/pulse/reports. Community reports are always labelled
// community-reported and are never mixed with official notices.
async function createReport(req) {
  const { subdivisionId, kind, areaLabel } = req.body || {};
  const note = String(req.body?.note ?? '').trim();
  if (!KINDS.includes(kind)) throw new HttpError(400, 'kind must be outage, voltage or restored');
  if (note.length > 280) throw new HttpError(400, 'Note must be 280 characters or fewer');
  const area = String(areaLabel ?? '').trim().slice(0, 80);
  let startedAt = null;
  if (req.body?.startedAt) {
    const t = new Date(req.body.startedAt);
    if (Number.isNaN(t.getTime())) throw new HttpError(400, 'startedAt is not a valid date');
    if (t.getTime() > Date.now() + 5 * 6e4) throw new HttpError(400, 'startedAt cannot be in the future');
    startedAt = t.toISOString();
  }
  const who = actor(req);
  const { rows: [{ n }] } = await query(
    "select count(*)::int as n from community_reports where device_id = $1 and created_at > now() - interval '1 hour'", [who]);
  if (n >= PER_HOUR) throw new HttpError(429, `You have reached ${PER_HOUR} reports this hour. Please try again later.`);
  const { rows: sub } = await query('select 1 from bescom_subdivisions where id = $1', [String(subdivisionId || '')]);
  if (!sub.length) throw new HttpError(400, 'Unknown area');
  await query(
    `insert into community_reports (subdivision_id, kind, note, area_label, started_at, device_id, user_id)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [subdivisionId, kind, note || null, area || null, startedAt, who, req.user?.id || null]);
}

const recent = (code, limit = 100) => query(
  `select id, kind, note, area_label, started_at, created_at from community_reports
    where subdivision_id = $1 and created_at > now() - interval '24 hours'
    order by created_at desc limit ${limit}`, [code]);

const writeLimit = rateLimit({ windowMs: 60 * 6e4, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } });

export const reportsRouter = Router();
reportsRouter.get('/:code', wrap(async (req, res) => res.json((await recent(req.params.code)).rows)));
reportsRouter.post('/', writeLimit, wrap(async (req, res) => { await createReport(req); res.status(201).json({ ok: true }); }));

export const pulseRouter = Router();
pulseRouter.get('/:code', wrap(async (req, res) => {
  const [{ rows: official }, { rows: reports }] = await Promise.all([
    query(
      `select id, kind, description, starts_at, ends_at, source_name, source_url, published_at from official_notices
        where subdivision_id = $1 and (ends_at is null or ends_at > now() - interval '24 hours')
        order by published_at desc limit 50`, [req.params.code]),
    recent(req.params.code)
  ]);
  res.json({ official, reports: reports.map(r => ({ ...r, rk: 'community' })) });
}));
pulseRouter.post('/reports', writeLimit, wrap(async (req, res) => { await createReport(req); res.status(201).json({ ok: true }); }));

export const alertsRouter = Router();
alertsRouter.post('/', writeLimit, wrap(async (req, res) => {
  const type = String(req.body?.alertType || '').slice(0, 40);
  if (!type) throw new HttpError(400, 'alertType is required');
  const cost = req.body?.estCostImpactInr;
  const impact = cost === null || cost === undefined || !Number.isFinite(Number(cost)) ? null : Number(cost);
  await query('insert into alerts (device_id, user_id, alert_type, est_cost_impact_inr) values ($1, $2, $3, $4)',
    [actor(req), req.user?.id || null, type, impact]);
  res.status(204).end();
}));
