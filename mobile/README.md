# Namma Power — Expo React Native

Mobile conversion of the original Namma Power React + Express application.

## Features
- Home dashboard
- Bengaluru sub-division outage map
- Appliance runtime / energy alerts
- KERC-style bill estimator
- Area maintenance coach
- Community outage reports
- Rent/buy area comparison
- Inverter/UPS sizing
- Gruha Jyothi tenant checklist
- BESCOM complaint message generator
- Offline-first local storage
- Optional Express backend integration

## Run
```bash
npm install
npx expo start
```

Android:
```bash
npx expo start --android
```

Set `EXPO_PUBLIC_API_URL` to the backend base URL if you want server-backed reports/subdivision data:
```bash
EXPO_PUBLIC_API_URL=http://YOUR-LAN-IP:4000
```

The app falls back to local demo data when the API is unavailable.

## Important
The original project's tariff and outage numbers are illustrative. Verify current BESCOM/KERC information before publishing.

The ZIP intentionally excludes `node_modules` and `.env` secrets. Run `npm install` inside `mobile/` before starting Expo.
