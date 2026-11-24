// Restored from the supplied archive's mobile/src/utils.js because shared/engine was absent.
// Calculation lock status: UNVERIFIABLE until the original v2.1 reference archive is supplied.
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
export { r2 };
export const inr = n => '\u20B9' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export function computeBill({ units, sanctionedKw = 1, gruhaJyothi = false, entitlementUnits = null, tariff = TARIFF }) {
  const u = Math.max(0, Number(units) || 0);
  const energy = r2(u * tariff.energy);
  const fixed = r2(sanctionedKw * tariff.fixedPerKw);
  const pg = r2(u * tariff.pgSurcharge);
  const fppca = r2(u * tariff.fppca);
  const duty = r2((energy + fixed + pg + fppca) * tariff.dutyRate);
  const gross = r2(energy + fixed + pg + fppca + duty);
  const limit = entitlementUnits == null ? tariff.gruhaJyothiCap : Number(entitlementUnits);
  const waived = Boolean(gruhaJyothi && entitlementUnits != null && u <= limit);
  return { units: u, energy, fixed, pg, fppca, duty, gross, waived, payable: waived ? 0 : gross, status: gruhaJyothi && entitlementUnits == null ? 'entitlement_unknown' : 'calculated' };
}

export function dgVsGrid({ units, dgRate, sanctionedKw = 1 }) {
  const grid = computeBill({ units, sanctionedKw }).gross;
  const dg = r2(units * dgRate);
  return { grid, dg, extraOnDg: r2(dg - grid), gridPerUnit: units ? r2(grid / units) : 0 };
}

export const TARIFF_META = { verified: false, note: 'These are working rates, not a verified copy of the KERC order. Confirm with BESCOM / the official order.' };
export const OFFICIAL_LINKS = { bescom: 'https://bescom.karnataka.gov.in/', sevaSindhu: 'https://sevasindhu.karnataka.gov.in/' };
