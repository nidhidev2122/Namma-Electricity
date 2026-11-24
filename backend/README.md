# NammaPower API

Express 5 + PostgreSQL. Sessions are random tokens in an HttpOnly `np_session` cookie (only a SHA-256 hash is stored), passwords use bcrypt, and `helmet`, rate limits and per-device report limits are on.

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/register`, `/login`, `/logout`; `GET /api/auth/me`; `PATCH /api/auth/profile` | Accounts |
| `GET /api/subdivisions` | The 12 BESCOM areas |
| `GET /api/reports/:code`, `POST /api/reports` | Community reports (last 24h, 5 per hour per device) |
| `GET /api/pulse/:code`, `POST /api/pulse/reports` | Official notices and community reports, kept separate |
| `POST /api/alerts` | Alert sync |
| `GET /api/admin/overview`, `/users`; `POST /api/admin/notices` | Admin only |
| `GET /api/health` | Health check |

Layout: `src/` code, `sql/schema.sql` + generated `sql/seed.sql` (from `scripts/gen-data.mjs` at the repo root), `scripts/migrate.js`, `tests/`.
See `../DEPLOY.md` for hosting. Config is in `.env.example`.
