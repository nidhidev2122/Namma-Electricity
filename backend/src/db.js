import pg from 'pg';
import { config } from './config.js';

let pool;

// Created on first use so importing modules (e.g. in unit tests) never opens a connection.
export function getPool() {
  if (!pool) {
    if (!config.databaseUrl) throw new Error('DATABASE_URL is not set');
    pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10, idleTimeoutMillis: 30000 });
  }
  return pool;
}

export const query = (text, params) => getPool().query(text, params);
export const closePool = async () => { if (pool) { await pool.end(); pool = null; } };
