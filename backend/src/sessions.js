import crypto from 'node:crypto';
import { query } from './db.js';
import { config } from './config.js';
import { SESSION_COOKIE, bearerToken } from './auth.js';

const hash = token => crypto.createHash('sha256').update(token).digest('hex');

export const PUBLIC_USER = 'id, email, display_name, profile_photo, role, created_at';

// The raw token only ever lives in the user's cookie. The database keeps a hash,
// so a leaked database can't be used to hijack sessions.
export async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const maxAge = config.sessionDays * 864e5;
  await query('insert into sessions (user_id, token_hash, expires_at) values ($1, $2, now() + ($3 || \' days\')::interval)', [userId, hash(token), String(config.sessionDays)]);
  res.cookie(SESSION_COOKIE, token, cookieOptions(maxAge));
}

export async function destroySession(req, res) {
  const token = bearerToken(req);
  if (token) await query('delete from sessions where token_hash = $1', [hash(token)]);
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

export function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: config.isProd || config.sameSite === 'none',
    sameSite: config.sameSite,
    path: '/',
    ...(maxAge ? { maxAge } : {})
  };
}

// Attaches req.user when a valid session exists. Never fails the request by itself.
export async function loadUser(req, _res, next) {
  try {
    const token = bearerToken(req);
    if (token) {
      const { rows } = await query(
        `select u.id, u.email, u.display_name, u.profile_photo, u.role, u.created_at
           from sessions s join users u on u.id = s.user_id
          where s.token_hash = $1 and s.expires_at > now()`, [hash(token)]);
      req.user = rows[0] || null;
    }
    next();
  } catch (err) { next(err); }
}
