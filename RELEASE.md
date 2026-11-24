# Release notes

## Run

From `frontend/`, install dependencies with `npm install`, start development with `npm run dev`, or build with `npm run build` and serve the generated `dist/` with `npm run preview`. The React Native app is under `mobile/`; use its Expo README and package scripts for native development.

## Verified in this pass

The frontend test suite passes 11/11 and the Vite production build completes. The black/light theme selector, Explore guide route, engine-backed Explore interactions, mobile Explore entry, install manifest, and guarded offline local storage are present in source. The supplied frontend contains no service worker.

## Not verified

The original v2.1 reference archive was not supplied, so calculation-lock byte identity cannot be confirmed. The uploaded project did not contain `backend/`, `sql/`, or the shared engine even though the frontend imports it; engine files were restored from the supplied mobile copy only to make the frontend build. Backend tests, root engine tests, authenticated workflows, live API behavior, Leaflet runtime, E2E tests, and requested screenshot matrices were not run.

## Open items that must not be resolved in this pass

Tariff rates in `tariff.js` are working rates, not a verified copy of the KERC order. Gruha Jyothi entitlement and over-entitlement billing rules are unconfirmed. Kannada translations need native-speaker review. Outage figures in `subdivisions.json` are illustrative, not BESCOM statistics. The Explore guides' official links must be checked before release. The entry bundle is above the requested 120 KB gzipped budget and should be code-split in a separate performance pass.

## Backend added

`backend/` (Express + Postgres) now exists, with schema, seed, auth, reports, Pulse and admin routes, and 15 passing tests including an end-to-end API suite. See `DEPLOY.md`. `backend/src/tariff.js` follows the rules in `backend/tests/tariff.test.js` and differs from `shared/engine/tariff.js` on Gruha Jyothi entitlement and negative units; the two need reconciling before release. Tariff rates, Gruha Jyothi rules and outage figures remain unverified, as listed above.
