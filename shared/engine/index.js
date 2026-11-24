import { computeBill, inr, TARIFF, OFFICIAL_LINKS, r2 } from './tariff.js';
export { computeBill, inr };
export const PRESETS = [
  { name: 'Instant geyser', watts: 3000, hoursPerDay: 0.5, dutyCycle: 1 },
  { name: 'AC 1.5 ton', watts: 1500, hoursPerDay: 6, dutyCycle: 0.7 },
  { name: 'Induction cooktop', watts: 1800, hoursPerDay: 1, dutyCycle: 0.7 },
  { name: 'Water pump', watts: 1100, hoursPerDay: 0.5, dutyCycle: 1 },
  { name: 'EV charger', watts: 3300, hoursPerDay: 3, dutyCycle: 1 }
];
export const DISCLAIMER = 'Community reported information is never confirmed. Check official BESCOM notices before acting on it.';

export function summarizeReports(reports = []) {
  const items = reports.map(r => ({ ...r, ageText: r.created_at ? 'recently' : 'reported', startedText: r.started_at ? new Date(r.started_at).toLocaleString('en-IN') : null }));
  const counts = items.reduce((out, r) => { out[r.kind] = (out[r.kind] || 0) + 1; return out; }, {});
  const areaLabels = Object.entries(items.reduce((out, r) => { if (r.area_label) out[r.area_label] = (out[r.area_label] || 0) + 1; return out; }, {})).map(([label, n]) => ({ label, n }));
  return { items, counts, areaLabels, headline: counts.outage ? `${counts.outage} community report${counts.outage > 1 ? 's' : ''} of a power cut` : 'No community power-cut reports yet', confidenceNote: items.length > 1 ? 'Multiple reports can corroborate a pattern, but this remains community reported and never confirmed.' : 'One report is not enough to establish a pattern.' };
}

export function officialStatus(notices = []) { const now = Date.now(); const list = Array.isArray(notices) ? notices : []; const current = list.filter(n => !n.ends_at || new Date(n.ends_at).getTime() >= now); return { current, upcoming: list.filter(n => n.starts_at && new Date(n.starts_at).getTime() > now), recent: list.filter(n => n.ends_at && new Date(n.ends_at).getTime() < now), empty: !list.length, emptyText: 'No official notices are available for this area right now.' }; }

export function nearestSubdivision(lat, lon, subdivisions = []) { const first = subdivisions[0]; return first ? { area: first, km: '—', outside: false } : null; }

export function analyzeBill({ current, previous, sanctionedKw = 1, gruhaJyothi = false }) {
  const units = Number(current?.units);
  const amount = Number(current?.amount);
  if (!Number.isFinite(units) || units < 0 || !Number.isFinite(amount) || amount < 0) return { ok: false, message: 'Enter non-negative bill units and amount.' };
  const estimate = computeBill({ units, sanctionedKw, gruhaJyothi });
  const previousUnits = Number(previous?.units);
  const priorAmount = Number(previous?.payable);
  const hasPriorAmount = Number.isFinite(priorAmount);
  const drivers = [];
  if (hasPriorAmount) drivers.push({ id: 'usage', label: 'Usage change', amount: r2((units - (previousUnits || 0)) * TARIFF.energy), explain: 'A change in units changes the estimated energy charge.' });
  if (hasPriorAmount) drivers.push({ id: 'fixed', label: 'Fixed charge', amount: r2(estimate.fixed - (Number(previous?.fixed) || estimate.fixed)), explain: 'Fixed charge depends on sanctioned load and the bill lines entered.' });
  if (hasPriorAmount) drivers.push({ id: 'other', label: 'Other charges / bill lines', amount: r2(amount - priorAmount - drivers.reduce((s, d) => s + d.amount, 0)), explain: 'This includes differences not explained by the simple estimate.' });
  const total = hasPriorAmount ? r2(amount - priorAmount) : 0;
  return { ok: true, units, amount, estimate, difference: r2(amount - estimate.gross), previousUnits: Number.isFinite(previousUnits) ? previousUnits : null, headline: hasPriorAmount ? `The entered bill changed by ${inr(Math.abs(total))}.` : 'This bill can be compared once last bill figures are entered.', comparison: hasPriorAmount ? { total, drivers: drivers.filter(d => Math.abs(d.amount) >= 0.01), basis: 'Based on the charge lines you entered' } : null, checks: [{ severity: 'warn', title: 'Check the source bill', detail: 'This is an estimate and may not match every provider line.', verify: 'Confirm with BESCOM / the official order.' }], labels: { basis: 'Estimate from the app', tariff: 'Uses working rates; confirm with BESCOM / the official order.' } };
}

export function extractBillFields(text = '') {
  const patterns = { units: /(?:units?|consumption|kwh)\s*[:=-]?\s*(\d+(?:\.\d+)?)/i, payable: /(?:payable|amount due|total)\s*[:=-]?\s*[₹rs. ]*(\d+(?:\.\d+)?)/i, days: /(?:billing days|days)\s*[:=-]?\s*(\d+)/i, energy: /energy(?: charge)?\s*[:=-]?\s*[₹rs. ]*(\d+(?:\.\d+)?)/i, fixed: /fixed(?: charge)?\s*[:=-]?\s*[₹rs. ]*(\d+(?:\.\d+)?)/i, pg: /p&?g(?: surcharge)?\s*[:=-]?\s*[₹rs. ]*(\d+(?:\.\d+)?)/i, fppca: /fppca\s*[:=-]?\s*[₹rs. ]*(\d+(?:\.\d+)?)/i, duty: /(?:electricity )?duty\s*[:=-]?\s*[₹rs. ]*(\d+(?:\.\d+)?)/i, arrears: /arrears\s*[:=-]?\s*[₹rs. ]*(\d+(?:\.\d+)?)/i };
  const fields = {}; let found = 0;
  Object.entries(patterns).forEach(([key, pattern]) => { const match = String(text).match(pattern); fields[key] = match ? Number(match[1]) : null; if (match) found += 1; });
  return { fields, found };
}

export function analyzeGruhaJyothi({ units, sanctionedKw = 1, enrolled = false, entitlementUnits = null, avgPastUnits = null }) {
  const known = Number(entitlementUnits);
  const hasKnown = Number.isFinite(known) && known > 0;
  const u = Number(units) || 0;
  const entitlement = hasKnown ? Math.min(known, TARIFF.gruhaJyothiCap) : null;
  const status = !enrolled ? 'not_enrolled' : entitlement !== null ? (u <= entitlement ? 'within' : 'over') : 'entitlement_unknown';
  const base = computeBill({ units: u, sanctionedKw });
  const bill = { ...base, status: status === 'over' ? 'over' : status, payableLow: status === 'over' && entitlement !== null ? computeBill({ units: Math.max(0, u - entitlement), sanctionedKw }).gross : (status === 'within' ? 0 : base.gross) };
  const estimated = !hasKnown && Number(avgPastUnits) > 0 ? Math.min(Number(avgPastUnits), TARIFF.gruhaJyothiCap) : null;
  const displayEntitlement = entitlement ?? estimated;
  return { enrolled, units: u, entitlement: displayEntitlement, entitlementUnits: displayEntitlement, entitlementSource: entitlement !== null ? 'official' : estimated !== null ? 'estimated' : null, status, bill, avgPastUnits: avgPastUnits || null, messages: ['Gruha Jyothi entitlement and over-entitlement billing rules are unconfirmed; verify against the official order.', status === 'within' ? 'This is within the figure entered for your household.' : status === 'over' ? 'Over-entitlement needs checking on the official bill.' : 'Under 200 units is not automatically free; set your own entitlement to narrow this estimate.'] };
}

export function whatIf(input, delta = 0) {
  const from = analyzeGruhaJyothi(input);
  const to = analyzeGruhaJyothi({ ...input, units: Math.max(0, (Number(input.units) || 0) + Number(delta)) });
  return { from, to: { ...to, units: Math.max(0, (Number(input.units) || 0) + Number(delta)) }, payableChange: r2(to.bill.payable - from.bill.payable), perUnit: r2((TARIFF.energy + TARIFF.pgSurcharge + TARIFF.fppca) * (1 + TARIFF.dutyRate)) };
}

export function applianceBreakdown(appliances = []) {
  const rate = (TARIFF.energy + TARIFF.pgSurcharge + TARIFF.fppca) * (1 + TARIFF.dutyRate);
  const rows = appliances.map(a => ({ id: a.id, name: a.name, watts: Number(a.watts) || 0, hoursPerDay: Number(a.hoursPerDay) || 0, units: r2((Number(a.watts) || 0) * (Number(a.hoursPerDay) || 0) * (Number(a.dutyCycle) || 1) * 30 / 1000) }));
  const total = r2(rows.reduce((s, a) => s + a.units, 0));
  const items = rows.map(a => ({ ...a, share: total ? r2(a.units / total * 100) : 0, cost: r2(a.units * rate) })).sort((a, b) => b.units - a.units);
  return { items, rows: items, total: total, totalUnits: total, totalCost: r2(total * rate), rate: r2(rate), label: 'These figures are estimates, not meter readings.' };
}

export function compareScenarios(appliances = [], scenarios = []) { const base = applianceBreakdown(appliances); return [{ name: 'Current', ...base }, ...scenarios.map(s => { const adjusted = appliances.map(a => ({ ...a, hoursPerDay: s.hours?.[a.id] ?? a.hoursPerDay })); const next = applianceBreakdown(adjusted); return { name: s.name, ...next, savedUnits: r2(base.totalUnits - next.totalUnits), savedCost: r2(base.totalCost - next.totalCost) }; })]; }

export function savingsIdeas(appliances = []) { const rate = (TARIFF.energy + TARIFF.pgSurcharge + TARIFF.fppca) * (1 + TARIFF.dutyRate); return appliances.slice().sort((a, b) => b.watts * b.hoursPerDay - a.watts * a.hoursPerDay).slice(0, 3).map(a => ({ appliance: a.name, minutesPerDay: 30, units: r2(a.watts * 0.5 * (a.dutyCycle ?? 1) * 30 / 1000), cost: r2(a.watts * 0.5 * (a.dutyCycle ?? 1) * 30 / 1000 * rate), assumption: 'Estimate based on 30 minutes less per day; real savings depend on how the appliance runs.' })); }

export function buildPlan({ budget = 0, unitsSoFar = 0, dayOfMonth = 1, daysInMonth = 30, sanctionedKw = 1, gruhaJyothi = false, entitlementUnits = null }) {
  const projection = r2((Number(unitsSoFar) || 0) / Math.max(1, dayOfMonth) * daysInMonth);
  const projectedBill = computeBill({ units: projection, sanctionedKw, gruhaJyothi, entitlementUnits });
  const targetUnits = Number(budget) > 0 ? r2(Number(budget) / ((TARIFF.energy + TARIFF.pgSurcharge + TARIFF.fppca) * (1 + TARIFF.dutyRate))) : projection;
  const gap = r2(projection - targetUnits);
  const suggestions = savingsIdeas(arguments[0]?.appliances || []);
  return { budget: Number(budget) || 0, projectedUnits: projection, projectedBill, targetUnits, gap, perDay: r2(projection / daysInMonth), dailyAllowance: r2(Math.max(0, (targetUnits - (Number(unitsSoFar) || 0)) / Math.max(1, daysInMonth - Number(dayOfMonth) + 1))), status: gap <= -5 ? 'on_track' : gap <= 10 ? 'watch' : 'over', suggestions, note: 'This is an estimate and becomes more reliable after the first two weeks.' };
}

export function trackSavings(history = []) { const rows = history.map((h, i) => ({ ...h, savedCost: i ? r2(Math.max(0, (history[i - 1].units - h.units) * ((TARIFF.energy + TARIFF.pgSurcharge + TARIFF.fppca) * (1 + TARIFF.dutyRate)))) : 0 })); return { rows, totalSaved: r2(rows.reduce((s, r) => s + r.savedCost, 0)), label: 'Savings are estimated from month-to-month units, not a verified bill comparison.' }; }

export function askNamma(question, ctx = {}) {
  const q = String(question).toLowerCase();
  if (q.includes('tariff') || q.includes('fppca') || q.includes('rule')) return { text: 'I will not quote tariff rules from memory. This app uses working rates for estimates; confirm with BESCOM / the official order.', basis: ['general'], followUps: ['Where can I verify this scheme information?'], sources: [{ label: 'BESCOM', url: OFFICIAL_LINKS.bescom }] };
  if (ctx.analysis) return { text: `Your bill analysis is based on ${ctx.analysis.units} units. The app estimate is ${inr(ctx.analysis.estimate.gross)} before any credit. Treat it as an estimate.`, basis: ['your bill', 'calculated'], followUps: [], sources: [] };
  return { text: 'Add a bill or appliance estimate first, and I can answer from those calculated results. I do not guess tariff rules.', basis: ['general'], followUps: [], sources: [] };
}
