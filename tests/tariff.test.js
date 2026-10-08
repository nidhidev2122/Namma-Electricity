import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBill, dgVsGrid } from '../src/tariff.js';

test('100 units, 1 kW sanction', () => {
  const b = computeBill({ units: 100, sanctionedKw: 1 });
  assert.equal(b.energy, 580);
  assert.equal(b.fixed, 150);
  assert.equal(b.pg, 35);
  assert.equal(b.fppca, 38);
  assert.equal(b.duty, 72.27);
  assert.equal(b.gross, 875.27);
});

test('Gruha Jyothi zeroes the bill at or under 200 units', () => {
  assert.equal(computeBill({ units: 200, gruhaJyothi: true }).payable, 0);
  assert.equal(computeBill({ units: 120, gruhaJyothi: true }).waived, true);
});

test('crossing 200 units means paying the full bill, not just the extra', () => {
  const b = computeBill({ units: 201, gruhaJyothi: true });
  assert.equal(b.waived, false);
  assert.equal(b.payable, b.gross);
  assert.ok(b.payable > 1000);
});

test('without the scheme nothing is waived', () => {
  assert.equal(computeBill({ units: 50 }).waived, false);
});

test('rejects negative units', () => {
  assert.throws(() => computeBill({ units: -5 }));
});

test('DG costs more than grid at 20 Rs/kWh', () => {
  const r = dgVsGrid({ units: 100, dgRate: 20 });
  assert.equal(r.dg, 2000);
  assert.ok(r.extraOnDg > 1000);
});
