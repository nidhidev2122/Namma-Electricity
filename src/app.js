import express from 'express';
//import profileRouter from './profile.js';
import crypto from 'node:crypto';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pool, withDevice } from './db.js';
import { computeBill, dgVsGrid } from './tariff.js';
import { authUser, authenticateUser, bearerToken, createSession, createUser, deleteSession, normalizeEmail, needAdmin, needAuth, validEmail } from './auth.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = ['outage', 'voltage', 'restored'];
const ALERTS = ['long_runtime', 'gruha_jyothi_ceiling', 'slab_warning'];

function needDevice(req, res, next) {
  const id = req.get('x-device-id');
  if (!id || !UUID.test(id)) return res.status(400).json({ error: 'x-device-id header (uuid) required' });
  req.deviceId = id.toLowerCase();
  next();
}

const wrap = fn => (req, res, next) => fn(req, res).catch(next);

export function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true, credentials: true }));
  app.use(express.json({ limit: '600kb' }));
  app.use(authUser);
  app.use((req, res, next) => { const id = req.get('x-request-id') || crypto.randomUUID(); res.set('x-request-id', id); req.requestId=id; next(); });

  // 5 crowd reports an hour per device, so one person can't paint a whole area red
  const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    keyGenerator: req => req.get('x-device-id') || req.ip,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many reports, try again later' }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, try again later' }
  });

  const setSessionCookie = (res, token) => res.set('Set-Cookie', `np_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

  app.post('/api/auth/register', authLimiter, wrap(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!validEmail(email) || typeof password !== 'string' || password.length < 8 || password.length > 200) {
      return res.status(400).json({ error: 'A valid email and password of at least 8 characters are required' });
    }
    try {
      const user = await createUser(email, password);
      const token = await createSession(user.id);
      setSessionCookie(res, token);
      res.status(201).json({ user, token });
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'An account with that email already exists' });
      throw error;
    }
  }));

  app.post('/api/auth/login', authLimiter, wrap(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const user = validEmail(email) && typeof password === 'string' ? await authenticateUser(email, password) : null;
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const token = await createSession(user.id);
    setSessionCookie(res, token);
    res.json({ user, token });
  }));

  app.get('/api/auth/me', needAuth, (req, res) => res.json({ user: req.user }));

  app.patch('/api/auth/profile', needAuth, wrap(async (req, res) => {
    const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : '';
    const profilePhoto = typeof req.body?.profilePhoto === 'string' ? req.body.profilePhoto : null;
    if (displayName.length > 80) return res.status(400).json({ error: 'Display name must be 80 characters or fewer' });
    if (profilePhoto && (!profilePhoto.startsWith('data:image/') || profilePhoto.length > 500000)) return res.status(400).json({ error: 'Profile photo must be a valid image under 500 KB' });
    const { rows } = await pool.query(
      'update users set display_name = $1, profile_photo = $2 where id = $3 returning id, email, display_name, profile_photo, role, created_at',
      [displayName || null, profilePhoto, req.user.id]
    );
    res.json({ user: rows[0] });
  }));

  app.post('/api/auth/logout', wrap(async (req, res) => {
    await deleteSession(bearerToken(req));
    res.set('Set-Cookie', 'np_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    res.status(204).end();
  }));

  app.get('/api/admin/overview', needAdmin, wrap(async (_req, res) => {
    const [{ rows: users }, { rows: reports }, { rows: sessions }] = await Promise.all([
      pool.query('select count(*)::int as count from users'),
      pool.query('select count(*)::int as count from outage_reports where created_at > now() - interval \'24 hours\''),
      pool.query('select count(*)::int as count from sessions where expires_at > now()')
    ]);
    res.json({ users: users[0].count, reportsLast24Hours: reports[0].count, activeSessions: sessions[0].count });
  }));

  app.get('/api/admin/users', needAdmin, wrap(async (_req, res) => {
    const { rows } = await pool.query('select id, email, display_name, role, created_at from users order by created_at desc');
    res.json(rows);
  }));

  app.get('/api/health', wrap(async (_req, res) => { await pool.query('select 1'); res.json({ ok: true, service: 'nammapower-api', version: '2.0.0' }); }));

  app.get('/api/subdivisions', wrap(async (_req, res) => {
    const { rows } = await pool.query('select * from bescom_subdivisions order by division_name');
    res.json(rows);
  }));

  app.get('/api/tariff', wrap(async (_req, res) => {
    const { rows } = await pool.query('select * from bescom_tariff_rates order by effective_from desc limit 1');
    res.json(rows[0] || null);
  }));

  app.get('/api/maintenance/:code', wrap(async (req, res) => {
    const { rows } = await pool.query(
      `select m.weekday, m.window_start, m.window_end, m.note from maintenance_notices m
       where m.subdivision_id = $1`, [req.params.code]);
    res.json(rows);
  }));

  // Stateless helpers, no device id needed
  app.post('/api/bills/calculate', (req, res) => {
    const { units, sanctionedKw, gruhaJyothi } = req.body || {};
    if (typeof units !== 'number' || !Number.isFinite(units) || units < 0 || units > 5000)
      return res.status(400).json({ error: 'units out of range' });
    if (sanctionedKw !== undefined && (!Number.isFinite(Number(sanctionedKw)) || Number(sanctionedKw) <= 0 || Number(sanctionedKw) > 50))
      return res.status(400).json({ error: 'sanctionedKw out of range' });
    res.json(computeBill({ units, sanctionedKw: Number(sanctionedKw) || 1, gruhaJyothi: !!gruhaJyothi }));
  });

  app.post('/api/bills/dg', (req, res) => {
    const { units, dgRate } = req.body || {};
    if (typeof units !== 'number' || typeof dgRate !== 'number' || units < 0 || dgRate < 0) {
      return res.status(400).json({ error: 'units and dgRate required' });
    }
    res.json(dgVsGrid({ units, dgRate }));
  });

  app.get('/api/reports/:code', wrap(async (req, res) => {
    const { rows } = await pool.query(
      `select id, kind, note, created_at from outage_reports
       where subdivision_id = $1 and created_at > now() - interval '24 hours'
       order by created_at desc limit 50`, [req.params.code]);
    res.json(rows);
  }));

  app.post('/api/reports', needAuth, needDevice, reportLimiter, wrap(async (req, res) => {
    const { subdivisionId, kind, note } = req.body || {};
    if (!KINDS.includes(kind)) return res.status(400).json({ error: 'bad kind' });
    if (typeof subdivisionId !== 'string' || subdivisionId.length > 80) return res.status(400).json({ error: 'subdivisionId required' });
    const clean = typeof note === 'string' ? note.trim().slice(0, 200) : null;
    const row = await withDevice(req.deviceId, async c => {
      const { rows } = await c.query(
        `insert into outage_reports (subdivision_id, device_id, kind, note) values ($1, $2, $3, $4)
         returning id, kind, note, created_at`, [subdivisionId, req.deviceId, kind, clean || null]);
      return rows[0];
    });
    res.status(201).json(row);
  }));

  app.get('/api/appliances', needAuth, needDevice, wrap(async (req, res) => {
    const rows = await withDevice(req.deviceId, async c =>
      (await c.query('select id, name, watts, daily_runtime_hours, alert_after_minutes from user_appliances order by created_at')).rows);
    res.json(rows);
  }));

  app.post('/api/appliances', needAuth, needDevice, wrap(async (req, res) => {
    const { name, watts, dailyRuntimeHours = 1, alertAfterMinutes = 35 } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || !(watts > 0 && watts <= 10000) || !Number.isFinite(Number(dailyRuntimeHours)) || Number(dailyRuntimeHours) < 0 || Number(dailyRuntimeHours) > 24 || !Number.isInteger(Number(alertAfterMinutes)) || Number(alertAfterMinutes) < 1 || Number(alertAfterMinutes) > 1440) {
      return res.status(400).json({ error: 'name and watts (1-10000) required' });
    }
    const row = await withDevice(req.deviceId, async c =>
      (await c.query(
        `insert into user_appliances (device_id, name, watts, daily_runtime_hours, alert_after_minutes)
         values ($1, $2, $3, $4, $5) returning *`,
        [req.deviceId, name.trim().slice(0, 60), Math.round(watts), dailyRuntimeHours, alertAfterMinutes])).rows[0]);
    res.status(201).json(row);
  }));

  app.delete('/api/appliances/:id', needAuth, needDevice, wrap(async (req, res) => {
    if (!UUID.test(req.params.id)) return res.status(400).json({ error: 'bad id' });
    await withDevice(req.deviceId, c => c.query('delete from user_appliances where id = $1', [req.params.id]));
    res.status(204).end();
  }));

  app.post('/api/alerts', needAuth, needDevice, wrap(async (req, res) => {
    const { applianceId = null, alertType, estCostImpactInr = null } = req.body || {};
    if (!ALERTS.includes(alertType)) return res.status(400).json({ error: 'bad alertType' });
    if (applianceId && !UUID.test(applianceId)) return res.status(400).json({ error: 'bad applianceId' });
    if (estCostImpactInr !== null && (!Number.isFinite(Number(estCostImpactInr)) || Number(estCostImpactInr) < 0 || Number(estCostImpactInr) > 100000)) return res.status(400).json({ error: 'bad cost impact' });
    const row = await withDevice(req.deviceId, async c =>
      (await c.query(
        `insert into appliance_consumption_alerts (device_id, appliance_id, alert_type, est_cost_impact_inr)
         values ($1, $2, $3, $4) returning *`, [req.deviceId, applianceId, alertType, estCostImpactInr])).rows[0]);
    res.status(201).json(row);
  }));

  app.get('/api/alerts', needAuth, needDevice, wrap(async (req, res) => {
    const rows = await withDevice(req.deviceId, async c =>
      (await c.query('select * from appliance_consumption_alerts order by triggered_at desc limit 50')).rows);
    res.json(rows);
  }));

  app.put('/api/bills', needAuth, needDevice, wrap(async (req, res) => {
    const { month, units, sanctionedKw = 1, gruhaJyothi = true } = req.body || {};
    if (!/^\d{4}-\d{2}$/.test(month || '') || typeof units !== 'number' || !Number.isFinite(units) || units < 0 || units > 5000 || !Number.isFinite(Number(sanctionedKw)) || Number(sanctionedKw) <= 0 || Number(sanctionedKw) > 50) {
      return res.status(400).json({ error: 'month (YYYY-MM) and units required' });
    }
    const bill = computeBill({ units, sanctionedKw, gruhaJyothi });
    const row = await withDevice(req.deviceId, async c =>
      (await c.query(
        `insert into user_consumption_and_bills (device_id, month, units, sanctioned_kw, gruha_jyothi, gross_inr, payable_inr)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (device_id, month) do update set units = excluded.units, sanctioned_kw = excluded.sanctioned_kw,
           gruha_jyothi = excluded.gruha_jyothi, gross_inr = excluded.gross_inr, payable_inr = excluded.payable_inr
         returning *`,
        [req.deviceId, `${month}-01`, units, sanctionedKw, gruhaJyothi, bill.gross, bill.payable])).rows[0]);
    res.json(row);
  }));

  app.get('/api/bills', needAuth, needDevice, wrap(async (req, res) => {
    const rows = await withDevice(req.deviceId, async c =>
      (await c.query('select * from user_consumption_and_bills order by month desc limit 12')).rows);
    res.json(rows);
  }));

  app.use((err, _req, res, _next) => {
    console.error(err);
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Profile photo is too large. Choose a smaller image.' });
    if (['28P01', '3D000', 'ECONNREFUSED', 'ENOTFOUND'].includes(err.code)) {
      return res.status(503).json({ error: 'Database unavailable. Check backend/.env, PostgreSQL, and run the migration.' });
    }
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}
