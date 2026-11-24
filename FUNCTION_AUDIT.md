# Functionality audit

| Feature | Check | Result | Fix applied |
|---|---|---:|---|
| Navigation | Explore opens from top navigation and returns to home screens | PASS | Wired `Explore` route |
| Bill Detective | Existing unit tests and production build | PASS | Restored missing engine contracts; text extraction remains text-only |
| Gruha Jyothi | Under 200 units is not assumed free; what-if engine contract | PASS | Restored `analyzeGruhaJyothi` and `whatIf` |
| Where it goes | Appliance toggles/hours and scenario comparison | PASS | Restored appliance engine exports |
| Pulse | Official/community data remain separate; community is unverified | PASS | Restored report summary helpers |
| Savings Coach | Budget projection and local history code path | PASS | Restored plan/tracking helpers |
| Ask Namma | Answers from calculated results and declines tariff-memory answers | PASS | Restored pure Ask helpers |
| Settings | Theme persists through guarded local storage | PASS | Added Black/Light selector and safe storage writes |
| Auth/offline | Existing code preserved | NOT RUN | Backend/auth service absent from supplied archive |
| Admin | Source-name/HTTPS validation | NOT RUN | Backend/admin source absent from supplied archive |
| Map | Leaflet path | NOT RUN | Browser runtime and API unavailable in task environment |
| Welcome/setup | Existing skip/setup handlers preserved | PASS (code review) | No change needed |
| Console warnings | Production browser console | NOT RUN | No browser harness supplied |
| Frontend unit tests | `npm test` | PASS | 11/11 passed |
| Frontend production build | `npm run build` | PASS | Build completed; bundle budget remains above target |
| Backend tests | `npm --prefix backend test` | SKIPPED | `backend/` absent |
| Engine tests | `npm run engine:test` | SKIPPED | Root engine test script absent |
| E2E tests | Playwright/equivalent | SKIPPED | No E2E harness supplied |

Full viewport screenshots and contrast measurements were not run because browser automation was not available. The CSS keeps visible focus rings and adds black-theme text tokens of at least `#a3a3a3` for muted copy.
