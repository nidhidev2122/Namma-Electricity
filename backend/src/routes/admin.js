import { Router } from 'express';
import { query } from '../db.js';
import { needAuth, needAdmin } from '../auth.js';
import { HttpError, wrap } from '../http.js';

const router = Router();
router.use(needAuth, needAdmin);

router.get('/overview', wrap(async (_req, res) => {
  const [{ rows: [u] }, { rows: [r] }, { rows: [s] }] = await Promise.all([
    query('select count(*)::int as n from users'),
    query("select count(*)::int as n from community_reports where created_at > now() - interval '24 hours'"),
    query('select count(*)::int as n from sessions where expires_at > now()')
  ]);
  res.json({ users: u.n, reportsLast24Hours: r.n, activeSessions: s.n });
}));

router.get('/users', wrap(async (_req, res) => {
  const { rows } = await query('select id, email, display_name, role, created_at from users order by created_at desc limit 500');
  res.json(rows);
}));

// Official notices are only ever entered by an admin, with a source link. Nothing is auto-generated.
router.post('/notices', wrap(async (req, res) => {
  const { subdivisionId, kind, description, startsAt, endsAt, sourceName, sourceUrl } = req.body || {};
  if (!['planned', 'unplanned', 'advisory'].includes(kind)) throw new HttpError(400, 'kind must be planned, unplanned or advisory');
  if (!description || String(description).length > 500) throw new HttpError(400, 'A description of up to 500 characters is required');
  if (!sourceName || !/^https?:\/\//i.test(String(sourceUrl || ''))) throw new HttpError(400, 'sourceName and an http(s) sourceUrl are required');
  const { rows } = await query(
    `insert into official_notices (subdivision_id, kind, description, starts_at, ends_at, source_name, source_url)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [subdivisionId, kind, String(description), startsAt || null, endsAt || null, String(sourceName), String(sourceUrl)]);
  res.status(201).json(rows[0]);
}));

export default router;
