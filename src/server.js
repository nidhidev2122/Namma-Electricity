import 'dotenv/config';
import { buildApp } from './app.js';
import { pool } from './db.js';

const port = Number(process.env.PORT || 4000);
const app = buildApp();
const server = app.listen(port, () => console.log(`NammaPower API on :${port}`));

const shutdown = async signal => {
  console.log(`${signal}: shutting down NammaPower API`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
