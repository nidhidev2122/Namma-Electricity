// End-to-end API test. Needs a migrated database (npm run migrate); skipped without DATABASE_URL.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const run = !!process.env.DATABASE_URL;
const stamp = Date.now();
const adminEmail = `admin-${stamp}@example.com`;
const userEmail = `user-${stamp}@example.com`;
process.env.ADMIN_EMAILS = adminEmail;
process.env.NODE_ENV = 'test';

let server, base, closePool;
const device = () => crypto.randomUUID();

async function api(path, { method = 'GET', body, cookie, dev = device() } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-device-id': dev, ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  const setCookie = res.headers.get('set-cookie') || '';
  return { status: res.status, json: text ? JSON.parse(text) : null, setCookie, cookie: setCookie.split(';')[0] };
}

before(async () => {
  if (!run) return;
  const { createApp } = await import('../src/app.js');
  ({ closePool } = await import('../src/db.js'));
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) server.close(); if (closePool) await closePool(); });

test('health and subdivisions', { skip: !run }, async () => {
  assert.equal((await api('/api/health')).status, 200);
  const subs = await api('/api/subdivisions');
  assert.equal(subs.json.length, 12);
  assert.ok(Number.isFinite(Number(subs.json[0].avg_weekly_outage_hours)));
});

test('auth: register, session cookie, login, profile, logout', { skip: !run }, async () => {
  assert.equal((await api('/api/auth/me')).json.user, null);
  assert.equal((await api('/api/auth/register', { method: 'POST', body: { email: userEmail, password: 'short' } })).status, 400);
  assert.equal((await api('/api/auth/register', { method: 'POST', body: { email: 'nope', password: 'longenough1' } })).status, 400);

  const reg = await api('/api/auth/register', { method: 'POST', body: { email: userEmail.toUpperCase(), password: 'correct horse' } });
  assert.equal(reg.status, 201);
  assert.equal(reg.json.user.email, userEmail);
  assert.equal(reg.json.user.role, 'user');
  assert.equal(reg.json.user.password_hash, undefined);
  assert.match(reg.setCookie, /np_session=.+HttpOnly/i);

  assert.equal((await api('/api/auth/register', { method: 'POST', body: { email: userEmail, password: 'correct horse' } })).status, 409);
  assert.equal((await api('/api/auth/login', { method: 'POST', body: { email: userEmail, password: 'wrong password' } })).status, 401);
  assert.equal((await api('/api/auth/login', { method: 'POST', body: { email: 'ghost@example.com', password: 'wrong password' } })).status, 401);

  const login = await api('/api/auth/login', { method: 'POST', body: { email: userEmail, password: 'correct horse' } });
  assert.equal(login.status, 200);
  const cookie = login.cookie;
  assert.equal((await api('/api/auth/me', { cookie })).json.user.email, userEmail);

  assert.equal((await api('/api/auth/profile', { method: 'PATCH', body: { displayName: 'X' } })).status, 401);
  const prof = await api('/api/auth/profile', { method: 'PATCH', cookie, body: { displayName: ' Asha ', profilePhoto: '' } });
  assert.equal(prof.json.user.display_name, 'Asha');
  assert.equal((await api('/api/auth/profile', { method: 'PATCH', cookie, body: { displayName: 'A', profilePhoto: 'javascript:alert(1)' } })).status, 400);

  assert.equal((await api('/api/admin/overview', { cookie })).status, 403);
  assert.equal((await api('/api/admin/users')).status, 401);

  assert.equal((await api('/api/auth/logout', { method: 'POST', cookie })).status, 204);
  assert.equal((await api('/api/auth/me', { cookie })).json.user, null);
});

test('admin: overview, users, official notices appear in pulse', { skip: !run }, async () => {
  const reg = await api('/api/auth/register', { method: 'POST', body: { email: adminEmail, password: 'correct horse' } });
  assert.equal(reg.json.user.role, 'admin');
  const { cookie } = reg;
  const ov = (await api('/api/admin/overview', { cookie })).json;
  assert.ok(ov.users >= 1 && ov.activeSessions >= 1 && Number.isInteger(ov.reportsLast24Hours));
  assert.ok((await api('/api/admin/users', { cookie })).json.some(u => u.email === adminEmail));

  assert.equal((await api('/api/admin/notices', { method: 'POST', cookie, body: { subdivisionId: 'HSR-05', kind: 'planned', description: 'x' } })).status, 400);
  const made = await api('/api/admin/notices', { method: 'POST', cookie, body: { subdivisionId: 'HSR-05', kind: 'planned', description: 'Feeder maintenance', sourceName: 'BESCOM', sourceUrl: 'https://bescom.karnataka.gov.in/' } });
  assert.equal(made.status, 201);
  const pulse = (await api('/api/pulse/HSR-05')).json;
  assert.ok(pulse.official.some(n => n.description === 'Feeder maintenance' && n.source_name === 'BESCOM'));
  assert.deepEqual((await api('/api/pulse/IND-01')).json.official, []);
});

test('community reports: validation, listing, 5 per hour limit', { skip: !run }, async () => {
  const dev = device();
  const post = (body, path = '/api/reports') => api(path, { method: 'POST', dev, body });
  assert.equal((await post({ subdivisionId: 'KOR-02', kind: 'boom' })).status, 400);
  assert.equal((await post({ subdivisionId: 'NOPE', kind: 'outage' })).status, 400);
  assert.equal((await post({ subdivisionId: 'KOR-02', kind: 'outage', note: 'x'.repeat(281) })).status, 400);
  assert.equal((await post({ subdivisionId: 'KOR-02', kind: 'outage', startedAt: 'not a date' }, '/api/pulse/reports')).status, 400);

  assert.equal((await post({ subdivisionId: 'KOR-02', kind: 'outage', note: 'Power is out on 5th cross' })).status, 201);
  const list = (await api('/api/reports/KOR-02')).json;
  assert.ok(list.some(r => r.note === 'Power is out on 5th cross' && r.kind === 'outage'));

  const started = new Date(Date.now() - 36e5).toISOString().slice(0, 16);
  assert.equal((await post({ subdivisionId: 'KOR-02', kind: 'voltage', startedAt: started, areaLabel: '5th Block' }, '/api/pulse/reports')).status, 201);
  const pulse = (await api('/api/pulse/KOR-02')).json;
  const mine = pulse.reports.find(r => r.area_label === '5th Block');
  assert.ok(mine && mine.rk === 'community' && mine.started_at);

  for (let i = 0; i < 3; i++) assert.equal((await post({ subdivisionId: 'KOR-02', kind: 'restored' })).status, 201);
  const blocked = await post({ subdivisionId: 'KOR-02', kind: 'outage' });
  assert.equal(blocked.status, 429);
  assert.match(blocked.json.error, /5 reports this hour/);
});

test('alerts sync and unknown api routes', { skip: !run }, async () => {
  assert.equal((await api('/api/alerts', { method: 'POST', body: { alertType: 'gruha_jyothi_near', estCostImpactInr: 120.5 } })).status, 204);
  assert.equal((await api('/api/alerts', { method: 'POST', body: {} })).status, 400);
  assert.equal((await api('/api/nope')).status, 404);
});
