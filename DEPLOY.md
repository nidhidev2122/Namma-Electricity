# Deploying NammaPower for free

One free web service runs the API **and** serves the website, so there is no CORS or cross-site cookie trouble.

## 1. Database (Neon, free)
1. Sign up at neon.tech and create a project.
2. Copy the connection string (it ends in `?sslmode=require`). That is your `DATABASE_URL`.

## 2. Code on GitHub
Push this whole folder (not just `frontend/`) to a GitHub repo. `.gitignore` already excludes `node_modules`, `dist` and `.env`.

## 3. Web service (Render, free)
1. Render dashboard > New > Blueprint > pick the repo. `render.yaml` sets everything up.
2. When prompted, set `DATABASE_URL` (from Neon) and `ADMIN_EMAILS` (your email; whoever registers with it becomes admin).
3. Deploy. The start command runs `npm run migrate` first, which creates tables and loads the 12 areas. It is safe to re-run.

Your site is at `https://nammapower.onrender.com` (or the name Render gives you).

Free-tier notes: Render's free service sleeps after ~15 minutes idle, so the first visit afterwards takes about 30 seconds. Use Neon, not Render's own free Postgres, which expires after 30 days.

## Frontend elsewhere (Netlify, Vercel, Cloudflare Pages)
Possible, but cookies then cross domains. Deploy the API as above, then:
- API env: `CORS_ORIGIN=https://your-site.netlify.app` and `COOKIE_SAMESITE=none`
- Frontend build env: `VITE_API_URL=https://your-api.onrender.com`
Safari and some privacy browsers block cross-site cookies, so logins can fail there. Serving both from one domain avoids that, so it is the recommended setup.

## Local development
```
cd backend && cp .env.example .env     # set DATABASE_URL to a local Postgres
npm install && npm run migrate && npm run dev
cd ../frontend && npm install && npm run dev   # proxies /api to :4000
```
Tests: `cd backend && npm test` (API tests run when `DATABASE_URL` points at a migrated database).

## Official notices
The Power Pulse "official" section stays empty until an admin adds notices with a source link:
`POST /api/admin/notices` with `{ subdivisionId, kind: "planned|unplanned|advisory", description, startsAt, endsAt, sourceName, sourceUrl }`.
