import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from './db.js';

const scrypt = promisify(crypto.scrypt);
const SESSION_DAYS = 30;

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, expectedHex] = String(stored).split(':');
  if (!salt || !expectedHex) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function sessionHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createUser(email, password) {
  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    'insert into users (email, password_hash) values ($1, $2) returning id, email, display_name, profile_photo, role, created_at',
    [email, passwordHash]
  );
  return rows[0];
}

export async function authenticateUser(email, password) {
  const { rows } = await pool.query('select * from users where email = $1', [email]);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) return null;
  return { id: user.id, email: user.email, display_name: user.display_name, profile_photo: user.profile_photo, role: user.role, created_at: user.created_at };
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await pool.query(
    'insert into sessions (token_hash, user_id, expires_at) values ($1, $2, now() + $3::interval)',
    [sessionHash(token), userId, `${SESSION_DAYS} days`]
  );
  return token;
}

export async function getUserForToken(token) {
  if (!token) return null;
  const { rows } = await pool.query(
    `select u.id, u.email, u.display_name, u.profile_photo, u.role, u.created_at
     from sessions s join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [sessionHash(token)]
  );
  return rows[0] || null;
}

export async function deleteSession(token) {
  if (token) await pool.query('delete from sessions where token_hash = $1', [sessionHash(token)]);
}

export function bearerToken(req) {
  const header = req.get('authorization') || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  const cookies = req.get('cookie') || '';
  const match = cookies.split(';').map(value => value.trim()).find(value => value.startsWith('np_session='));
  return match ? decodeURIComponent(match.slice('np_session='.length)) : '';
}

export async function authUser(req, _res, next) {
  try {
    req.user = await getUserForToken(bearerToken(req));
    next();
  } catch (error) {
    next(error);
  }
}

export function needAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Login required' });
  next();
}

export function needAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Login required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}
