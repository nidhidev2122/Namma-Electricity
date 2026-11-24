export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(_req, res) { res.status(404).json({ error: 'Not found' }); }

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That upload is too large' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on our side' : err.message });
}

// Anonymous identity: the random per-browser id the frontend sends, falling back to the IP.
export function actor(req) {
  const id = String(req.get('x-device-id') || '').slice(0, 64);
  return /^[\w-]{8,64}$/.test(id) ? id : `ip:${req.ip}`;
}
