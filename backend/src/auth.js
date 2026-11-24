// Pure helpers and middleware. No database access here so they stay easy to unit test.
export const SESSION_COOKIE = 'np_session';

export const normalizeEmail = value => (typeof value === 'string' ? value.trim().toLowerCase() : '');

export const validEmail = value =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// `source` is anything with a get(headerName) method: an Express request or a Headers object.
export function bearerToken(source) {
  const header = source.get('authorization') || '';
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  if (bearer) return bearer[1].trim();
  for (const part of (source.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === SESSION_COOKIE) {
      try { return decodeURIComponent(part.slice(i + 1).trim()); } catch { return ''; }
    }
  }
  return '';
}

export function needAuth(req, res, next) {
  if (req.user) return next();
  return res.status(401).json({ error: 'Please log in' });
}

export function needAdmin(req, res, next) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
}
