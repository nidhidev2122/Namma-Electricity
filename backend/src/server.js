import { createApp } from './app.js';
import { config } from './config.js';
import { closePool } from './db.js';

if (!config.databaseUrl) { console.error('DATABASE_URL is not set. See backend/.env.example'); process.exit(1); }

const server = createApp().listen(config.port, '0.0.0.0', () => console.log(`NammaPower API listening on :${config.port}`));
const stop = () => server.close(async () => { await closePool(); process.exit(0); });
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
