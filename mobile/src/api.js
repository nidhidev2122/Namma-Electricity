// mobile/src/api.js
import { SUBDIVISIONS } from './data';
import { getDeviceId, getJSON, setJSON } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_API_URL || '';
const TOKEN_KEY = 'np.auth.token';

async function call(path, opts = {}) {
  if (!BASE) throw new Error('offline');
  const token = await getJSON(TOKEN_KEY, '');
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': await getDeviceId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

async function authCall(path, payload) {
  if (!BASE) throw new Error('offline');
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  await setJSON(TOKEN_KEY, body.token);
  return body;
}

export const hasApi = () => !!BASE;
export const login = (email, password) => authCall('/api/auth/login', { email, password });
export const register = (email, password) => authCall('/api/auth/register', { email, password });

export async function currentUser() {
  if (!BASE || !(await getJSON(TOKEN_KEY, ''))) return null;
  return (await call('/api/auth/me')).user;
}

export async function logout() {
  try {
    if (BASE && await getJSON(TOKEN_KEY, '')) await call('/api/auth/logout', { method: 'POST' });
  } finally {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

// ======================== ADDED: updateProfile ========================
// Matches the backend route: PATCH /api/auth/profile
// Sends { displayName, profilePhoto } which the backend expects.
export async function updateProfile(displayName, profilePhoto = '') {
  return call('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ displayName, profilePhoto })
  });
}
// =====================================================================

export async function getSubdivisions() {
  try {
    const rows = await call('/api/subdivisions');
    return rows.map(r => ({ ...r, avg_weekly_outage_hours: Number(r.avg_weekly_outage_hours) }));
  } catch {
    return SUBDIVISIONS;
  }
}

export async function getReports(code) {
  try {
    return await call(`/api/reports/${code}`);
  } catch {
    const local = await getJSON('np.reports', []);
    const dayAgo = Date.now() - 864e5;
    return local
      .filter(r => r.subdivision_id === code && r.ts > dayAgo)
      .map(r => ({ id: r.ts, kind: r.kind, note: r.note, created_at: new Date(r.ts).toISOString() }));
  }
}

export async function submitReport({ subdivisionId, kind, note }) {
  const mine = await getJSON('np.mine', []);
  const now = Date.now();
  const recent = mine.filter(t => now - t < 36e5);
  if (recent.length >= 5) throw new Error('You have reached 5 reports this hour. Please try again later.');
  if (recent.length && now - recent[recent.length - 1] < 12e4) throw new Error('Please wait two minutes between reports.');

  try {
    await call('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ subdivisionId, kind, note })
    });
  } catch (err) {
    if (BASE) throw err;
    const reports = await getJSON('np.reports', []);
    await setJSON('np.reports', [...reports, { subdivision_id: subdivisionId, kind, note, ts: now }]);
  }
  await setJSON('np.mine', [...recent, now]);
}

export function syncAlert(alertType, estCostImpactInr) {
  call('/api/alerts', {
    method: 'POST',
    body: JSON.stringify({ alertType, estCostImpactInr })
  }).catch(() => {});
}

export async function getAppliances() {
  return call('/api/appliances');
}
export async function createAppliance(appliance) {
  return call('/api/appliances', { method: 'POST', body: JSON.stringify(appliance) });
}
export async function deleteAppliance(id) {
  return call(`/api/appliances/${id}`, { method: 'DELETE' });
}
export async function saveBill(payload) {
  return call('/api/bills', { method: 'PUT', body: JSON.stringify(payload) });
}
export async function getBills() {
  return call('/api/bills');
}