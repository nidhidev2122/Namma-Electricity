import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'sql');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

await client.connect();
for (const file of ['schema.sql', 'seed.sql']) {
  await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
  console.log('applied', file);
}
await client.end();
