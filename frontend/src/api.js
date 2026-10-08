import { SUBDIVISIONS } from './data.js';

const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'np.auth.token';

// Random per-browser id. It is the only identity the backend ever sees.
export function deviceId() {
  let id = localStorage.getItem('np.device');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('np.device', id);
  }
  return id;
}

async function call(path, opts = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(BASE + path, {
    ...opts,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId(), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) }
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

async function authCall(path, payload) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  localStorage.removeItem(TOKEN_KEY);
  return body;
}

export function hasApi() {
  return !!BASE || typeof window !== 'undefined';
}

export async function login(email, password) {
  return authCall('/api/auth/login', { email, password });
}

export async function register(email, password) {
  return authCall('/api/auth/register', { email, password });
}

export async function currentUser() {
  if (!BASE && typeof window === 'undefined') return null;
  return (await call('/api/auth/me')).user;
}

export async function logout() {
  try {
    if (BASE && localStorage.getItem(TOKEN_KEY)) await call('/api/auth/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function updateProfile(displayName, profilePhoto = '') {
  return call('/api/auth/profile', { method: 'PATCH', body: JSON.stringify({ displayName, profilePhoto }) });
}

export const getAdminOverview = () => call('/api/admin/overview');
export const getAdminUsers = () => call('/api/admin/users');

export async function getSubdivisions() {
  try {
    const rows = await call('/api/subdivisions');
    return rows.map(r => ({
      ...r,
      avg_weekly_outage_hours: Number(r.avg_weekly_outage_hours)
    }));
  } catch {
    return SUBDIVISIONS;
  }
}

const localReports = () => JSON.parse(localStorage.getItem('np.reports') || '[]');

export async function getReports(code) {
  try {
    return await call(`/api/reports/${code}`);
  } catch {
    const dayAgo = Date.now() - 864e5;
    return localReports().filter(r => r.subdivision_id === code && r.ts > dayAgo)
      .map(r => ({ id: r.ts, kind: r.kind, note: r.note, created_at: new Date(r.ts).toISOString() }));
  }
}

// Client-side throttle mirrors the server limit (5 per hour) and adds a 2 minute cool-down.
export function reportThrottle() {
  const now = Date.now();
  const mine = JSON.parse(localStorage.getItem('np.mine') || '[]').filter(t => now - t < 36e5);
  if (mine.length >= 5) return 'You have reached 5 reports this hour. Please try again later.';
  if (mine.length && now - mine[mine.length - 1] < 12e4) return 'Please wait two minutes between reports.';
  return null;
}

export async function submitReport({ subdivisionId, kind, note }) {
  const blocked = reportThrottle();
  if (blocked) throw new Error(blocked);
  const stamp = Date.now();
  try {
    await call('/api/reports', { method: 'POST', body: JSON.stringify({ subdivisionId, kind, note }) });
  } catch (err) {
    if (BASE) throw err;
    localStorage.setItem('np.reports', JSON.stringify([...localReports(), { subdivision_id: subdivisionId, kind, note, ts: stamp }]));
  }
  const mine = JSON.parse(localStorage.getItem('np.mine') || '[]');
  localStorage.setItem('np.mine', JSON.stringify([...mine, stamp]));
}

// Fire and forget: alerts still show locally if the API is unreachable
export function syncAlert(alertType, estCostImpactInr) {
  call('/api/alerts', { method: 'POST', body: JSON.stringify({ alertType, estCostImpactInr }) }).catch(() => {});
}
