import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBill, whatIf, applianceBreakdown } from '../../shared/engine/index.js';

test('Explore bill guide uses the calculation engine output', () => {
  const bill = computeBill({ units: 120, sanctionedKw: 1 });
  assert.equal(bill.gross, 1017.62);
  assert.equal(bill.payable, bill.gross);
});

test('Explore appliance guide uses appliance hours and watts', () => {
  const result = applianceBreakdown([{ id: 'fan', name: 'Fan', watts: 75, hoursPerDay: 8 }]);
  assert.equal(result.totalUnits, 18);
  assert.equal(result.items[0].units, 18);
});

test('Explore Gruha Jyothi what-if changes units through the engine', () => {
  const result = whatIf({ units: 120, sanctionedKw: 1, enrolled: true, entitlementUnits: 150 }, -20);
  assert.equal(result.to.units, 100);
  assert.ok(result.payableChange <= 0);
});
