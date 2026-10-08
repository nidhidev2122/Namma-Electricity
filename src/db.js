import pg from 'pg';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Runs fn inside a transaction with the caller's device id bound for RLS.
// set_config(..., true) scopes it to this transaction only, so pooled connections never leak identity.
export async function withDevice(deviceId, fn) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query("select set_config('app.device_id', $1, true)", [deviceId]);
    const out = await fn(client);
    await client.query('commit');
    return out;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}
