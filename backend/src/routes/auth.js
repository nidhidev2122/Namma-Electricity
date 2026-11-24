import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { config } from '../config.js';
import { normalizeEmail, validEmail, needAuth } from '../auth.js';
import { createSession, destroySession, PUBLIC_USER } from '../sessions.js';
import { HttpError, wrap } from '../http.js';

const router = Router();
// Compared against when the email is unknown so a login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

function credentials(body) {
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!validEmail(email)) throw new HttpError(400, 'Enter a valid email address');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (password.length > 72) throw new HttpError(400, 'Password must be 72 characters or fewer');
  return { email, password };
}

router.post('/register', wrap(async (req, res) => {
  const { email, password } = credentials(req.body);
  const role = config.adminEmails.includes(email) ? 'admin' : 'user';
  const hashed = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `insert into users (email, password_hash, role) values ($1, $2, $3)
     on conflict (email) do nothing returning ${PUBLIC_USER}`, [email, hashed, role]);
  if (!rows[0]) throw new HttpError(409, 'An account with this email already exists');
  await createSession(res, rows[0].id);
  res.status(201).json({ user: rows[0] });
}));

router.post('/login', wrap(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const { rows } = await query(`select ${PUBLIC_USER}, password_hash from users where email = $1`, [email]);
  const found = rows[0];
  const ok = await bcrypt.compare(password.slice(0, 72), found?.password_hash || DUMMY_HASH);
  if (!found || !ok) throw new HttpError(401, 'Invalid email or password');
  const { password_hash, ...user } = found; // eslint-disable-line no-unused-vars
  await createSession(res, user.id);
  res.json({ user });
}));

// Logged-out is a normal state, so this answers 200 with user: null instead of 401.
router.get('/me', (req, res) => res.json({ user: req.user || null }));

router.post('/logout', wrap(async (req, res) => {
  await destroySession(req, res);
  res.status(204).end();
}));

router.patch('/profile', needAuth, wrap(async (req, res) => {
  const displayName = String(req.body?.displayName ?? '').trim();
  const photo = String(req.body?.profilePhoto ?? '');
  if (displayName.length > 80) throw new HttpError(400, 'Display name must be 80 characters or fewer');
  if (photo && !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(photo)) throw new HttpError(400, 'Profile photo must be a PNG, JPEG, WebP or GIF image');
  if (photo.length > 400000) throw new HttpError(400, 'Profile photo is too large. Try a smaller image.');
  const { rows } = await query(
    `update users set display_name = $1, profile_photo = $2 where id = $3 returning ${PUBLIC_USER}`,
    [displayName || null, photo || null, req.user.id]);
  res.json({ user: rows[0] });
}));

export default router;
