import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail, validEmail, bearerToken, needAdmin } from '../src/auth.js';

test('normalizes account emails', () => {
  assert.equal(normalizeEmail('  ADMIN@GMAIL.COM '), 'admin@gmail.com');
  assert.equal(normalizeEmail(null), '');
});

test('validates account email shape', () => {
  assert.equal(validEmail('admin@gmail.com'), true);
  assert.equal(validEmail('not-an-email'), false);
});

test('reads bearer and cookie session tokens', () => {
  const bearer = { get: name => name === 'authorization' ? 'Bearer abc123' : '' };
  const cookie = { get: name => name === 'cookie' ? 'np_session=cookie123' : '' };
  assert.equal(bearerToken(bearer), 'abc123');
  assert.equal(bearerToken(cookie), 'cookie123');
});

test('blocks non-admin users from protected operations', () => {
  let status;
  let body;
  needAdmin({ user: { role: 'user' } }, { status: code => { status = code; return { json: value => { body = value; } }; } }, () => {});
  assert.equal(status, 403);
  assert.equal(body.error, 'Admin access required');
});
