# Namma Electricity v4 changes

## Important source limitation

The requested original reference archive `NammaElectricity-v2_1__1_.zip` was not present in the upload directory. The supplied base archive also did not contain `backend/`, `shared/`, or `sql/`, although the frontend imports the shared engine. Therefore byte-identity against v2.1 is **not verifiable**. The missing `shared/engine/` files were restored only from the supplied mobile implementation so the existing frontend can build; this is not a claim of calculation-lock identity. No backend, SQL, or tariff source from an unavailable archive was changed.

## Step 1 — black backgrounds

- Added default `Black` theme with `#000000` base, `#0c0c0c` cards, `#141414` controls, and `#262626` hairline borders.
- Retinted active controls and glows to amber/teal; body and muted text are `#f2f2f2` / `#a3a3a3`.
- Added persistent Settings selector: `Theme: Black / Light`; storage writes are guarded for offline/private browsing.
- Black screens: workspace shell, dashboard, Bill Detective, Gruha Jyothi, Where It Goes, Pulse, Savings Coach, Ask, Settings, Auth, and Explore. Welcome/setup and the existing light palette remain visually light/dark branded according to their existing design; switching to Light restores the original paper surfaces.
- Added manifest, `theme-color`, and 192/512 SVG install icons. No service worker.

## Calculation lock and disclaimers

| Area | Result |
|---|---|
| Reference archive byte diff | Not verifiable: reference archive missing |
| `shared/engine/*` | Missing from upload; restored from supplied mobile calculation copy; requires v2.1 comparison before release |
| `backend/` | Missing from upload; unchanged/not available |
| `sql/` | Missing from upload; unchanged/not available |
| Tariff rates | Preserved from supplied mobile copy; working rates, not verified KERC order |
| Disclaimer language | Kept or added: estimate, working rates, confirm with BESCOM / the official order, community reported, never confirmed |

## Step 2 — functionality audit

See [FUNCTION_AUDIT.md](FUNCTION_AUDIT.md). Frontend unit tests pass and the production build passes. Browser viewport, auth server, backend, map runtime, and screenshot checks are marked not run where the corresponding backend/reference/browser harness was not supplied.

## Step 3 — Explore

Added `frontend/src/components/Explore.jsx` with six guides: bill construction, appliance units, Gruha Jyothi status, power-cut data, habit what-ifs, and bill glossary. Added engine-backed sliders/toggles, official-source links, Back to Explore control, estimate labels, and mobile `mobile/src/screens/Explore.js` with a More-sheet entry.

## Step 4 — planned work status

- Responsive layout: already present in supplied web CSS; Explore adds 320px-safe rules. Full viewport test not run.
- Lazy-loaded routes / bundle budgets: not done; existing app uses eager imports. Build succeeds but the JS bundle is 175.26 KB gzipped, above the requested 120 KB entry budget.
- Leaflet only on Pulse: existing `MapView` split behavior not fully verified.
- Motion modes: existing motion work preserved; no new library added.
- Color grades: existing grade styles preserved; black contrast overrides added.
- Kannada/English i18n: not present in supplied archive; not done.
- Accessibility: visible focus ring and keyboard controls preserved; full WCAG audit not run.
- Install manifest/icons: added.
- Mobile parity: black token palette and Explore screen added; mobile is not a full screen-for-screen parity match.

## Test results

- `npm --prefix frontend install`: passed.
- `npm --prefix frontend test`: passed, 11/11.
- `npm --prefix frontend run build`: passed.
- `npm --prefix backend test`: skipped; `backend/` absent from supplied archive.
- `npm run engine:test`: skipped; no root package/engine test script supplied.
- E2E / Playwright: skipped; no E2E harness supplied.
- Screenshots at requested viewports/themes: not run; browser automation was not available in this task.

## Files changed or added

- `shared/engine/tariff.js` (restored missing engine source; requires lock verification)
- `shared/engine/index.js` (restored missing engine contracts used by supplied UI)
- `frontend/src/App.jsx`
- `frontend/src/ctx.jsx`
- `frontend/src/components/Settings.jsx`
- `frontend/src/components/Explore.jsx`
- `frontend/src/styles.css`
- `frontend/index.html`
- `frontend/public/manifest.webmanifest`
- `frontend/public/icon-192.svg`
- `frontend/public/icon-512.svg`
- `mobile/src/theme.js`
- `mobile/src/screens/Explore.js`
- `mobile/App.js`
- `CHANGES.md`, `FUNCTION_AUDIT.md`, `RELEASE.md`
