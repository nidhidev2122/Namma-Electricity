// Server-side tariff maths, kept self-contained so the backend deploys on its own.
// Working rates, not a verified copy of the KERC order. Confirm with BESCOM / the official order.
// NOTE: this follows the rules in tests/tariff.test.js (Gruha Jyothi waives the whole bill at or
// under the cap, and negative units are rejected). shared/engine/tariff.js is intentionally
// different (entitlement treated as unconfirmed). Reconcile the two before relying on either.
export const TARIFF = {
  energy: 5.8, fixedPerKw: 150, pgSurcharge: 0.35, fppca: 0.38, dutyRate: 0.09,
  gruhaJyothiCap: 200, dgMin: 18, dgMax: 25
};

const r2 = n => Math.round(n * 100) / 100;

export function computeBill({ units, sanctionedKw = 1, gruhaJyothi = false, tariff = TARIFF }) {
  const u = Number(units);
  if (!Number.isFinite(u) || u < 0) throw new RangeError('units must be a non-negative number');
  const energy = r2(u * tariff.energy);
  const fixed = r2(sanctionedKw * tariff.fixedPerKw);
  const pg = r2(u * tariff.pgSurcharge);
  const fppca = r2(u * tariff.fppca);
  const duty = r2((energy + fixed + pg + fppca) * tariff.dutyRate);
  const gross = r2(energy + fixed + pg + fppca + duty);
  const waived = Boolean(gruhaJyothi && u <= tariff.gruhaJyothiCap);
  return { units: u, energy, fixed, pg, fppca, duty, gross, waived, payable: waived ? 0 : gross };
}

export function dgVsGrid({ units, dgRate, sanctionedKw = 1 }) {
  const grid = computeBill({ units, sanctionedKw }).gross;
  const dg = r2(units * dgRate);
  return { grid, dg, extraOnDg: r2(dg - grid), gridPerUnit: units ? r2(grid / units) : 0 };
}
