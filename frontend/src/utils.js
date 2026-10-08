// Pure helpers: no DOM, no React, so they're easy to test.
export const TARIFF = {
  energy: 5.8,
  fixedPerKw: 150,
  pgSurcharge: 0.35,
  fppca: 0.38,
  dutyRate: 0.09,
  gruhaJyothiCap: 200,
  gruhaJyothiWarn: 180,
  dgMin: 18,
  dgMax: 25
};

const r2 = n => Math.round(n * 100) / 100;
export const inr = n => '\u20B9' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export function computeBill({ units, sanctionedKw = 1, gruhaJyothi = false, tariff = TARIFF }) {
  const u = Math.max(0, Number(units) || 0);
  const energy = r2(u * tariff.energy);
  const fixed = r2(sanctionedKw * tariff.fixedPerKw);
  const pg = r2(u * tariff.pgSurcharge);
  const fppca = r2(u * tariff.fppca);
  const duty = r2((energy + fixed + pg + fppca) * tariff.dutyRate);
  const gross = r2(energy + fixed + pg + fppca + duty);
  const waived = gruhaJyothi && u <= tariff.gruhaJyothiCap;
  return { units: u, energy, fixed, pg, fppca, duty, gross, waived, payable: waived ? 0 : gross };
}

export function dgVsGrid({ units, dgRate, sanctionedKw = 1 }) {
  const grid = computeBill({ units, sanctionedKw }).gross;
  const dg = r2(units * dgRate);
  return { grid, dg, extraOnDg: r2(dg - grid), gridPerUnit: units ? r2(grid / units) : 0 };
}

// Inverter: load / 0.8 power factor gives VA, plus 25% headroom for motor start-up surges.
// Battery: Ah = (W x hours) / (V x usable depth x inverter efficiency).
export function sizeUps({ watts, backupHours }) {
  const va = Math.ceil((watts / 0.8) * 1.25 / 50) * 50;
  const systemV = va <= 900 ? 12 : va <= 1800 ? 24 : 48;
  const ah = (watts * backupHours) / (systemV * 0.6 * 0.85);
  const series = systemV / 12;
  const parallel = Math.max(1, Math.ceil(ah / 150));
  return { va, systemV, ah: Math.ceil(ah), batteries: series * parallel, series, parallel };
}

export function riskFromHours(h) {
  return h > 5 ? 'high' : h >= 2 ? 'medium' : 'low';
}

export function monthlyUnits(appliances) {
  return r2(appliances.reduce((s, a) => s + (a.watts * a.hoursPerDay * 30) / 1000, 0));
}

export function runtimeMinutes(app, now = Date.now()) {
  return app.startedAt ? Math.floor((now - app.startedAt) / 60000) : 0;
}

// 22:00 to 06:00 counts as off-peak for EV charging
export function isOffPeak(date = new Date()) {
  const h = date.getHours();
  return h >= 22 || h < 6;
}

export function hoursUntilOffPeak(date = new Date()) {
  if (isOffPeak(date)) return 0;
  const target = new Date(date);
  target.setHours(22, 0, 0, 0);
  return Math.round(((target - date) / 3600000) * 10) / 10;
}

// Smart-meter export: one "timestamp,kWh" row per 15 minutes. Header rows and junk lines are skipped.
export function parseIntervals(text) {
  let total = 0;
  let count = 0;
  let peakKwh = 0;
  for (const line of text.split(/\r?\n/)) {
    const parts = line.split(',');
    if (parts.length < 2) continue;
    const kwh = parseFloat(parts[parts.length - 1]);
    if (!Number.isFinite(kwh) || kwh < 0) continue;
    total += kwh;
    count += 1;
    if (kwh > peakKwh) peakKwh = kwh;
  }
  return { total: r2(total), count, peakKw: r2(peakKwh * 4) };
}

export function nextTuesday(from = new Date()) {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const add = (2 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d;
}

export function fillTemplate(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] || `[${k}]`);
}

export function whatsappLink(number, text) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
