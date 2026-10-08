// KERC LT-1 domestic bill maths. Rates live in one object so they can be swapped
// for the row in bescom_tariff_rates when a new tariff order lands.
export const TARIFF = {
  energy: 5.8,          // Rs/kWh
  fixedPerKw: 150,      // Rs per sanctioned kW per month
  pgSurcharge: 0.35,    // Rs/kWh
  fppca: 0.38,          // Rs/kWh fuel and power purchase adjustment
  dutyRate: 0.09,       // state electricity duty on the whole subtotal
  gruhaJyothiCap: 200,  // units/month; above this the scheme gives nothing
  dgMin: 18,
  dgMax: 25
};

const r2 = n => Math.round(n * 100) / 100;

export function computeBill({ units, sanctionedKw = 1, gruhaJyothi = false, tariff = TARIFF }) {
  if (!(units >= 0)) throw new Error('units must be a non-negative number');
  const energy = r2(units * tariff.energy);
  const fixed = r2(sanctionedKw * tariff.fixedPerKw);
  const pg = r2(units * tariff.pgSurcharge);
  const fppca = r2(units * tariff.fppca);
  const duty = r2((energy + fixed + pg + fppca) * tariff.dutyRate);
  const gross = r2(energy + fixed + pg + fppca + duty);
  const waived = gruhaJyothi && units <= tariff.gruhaJyothiCap;
  return { units, energy, fixed, pg, fppca, duty, gross, waived, payable: waived ? 0 : gross };
}

// Apartment view: BESCOM bill spread over the units vs the same units on the RWA diesel set.
export function dgVsGrid({ units, dgRate, sanctionedKw = 1, tariff = TARIFF }) {
  const grid = computeBill({ units, sanctionedKw, tariff }).gross;
  const dg = r2(units * dgRate);
  return { grid, dg, gridPerUnit: units ? r2(grid / units) : 0, extraOnDg: r2(dg - grid) };
}
