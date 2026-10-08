import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBill, sizeUps, parseIntervals, nextTuesday, isOffPeak, hoursUntilOffPeak, riskFromHours, fillTemplate } from '../src/utils.js';

test('bill matches the backend engine', () => {
  assert.equal(computeBill({ units: 100, sanctionedKw: 1 }).gross, 875.27);
});

test('subsidy applies at 200 and not at 201', () => {
  assert.equal(computeBill({ units: 200, gruhaJyothi: true }).payable, 0);
  assert.ok(computeBill({ units: 201, gruhaJyothi: true }).payable > 0);
});

test('ups sizing for 400 W and 3 h', () => {
  const s = sizeUps({ watts: 400, backupHours: 3 });
  assert.equal(s.va, 650);
  assert.equal(s.systemV, 12);
  assert.equal(s.ah, 197);
  assert.equal(s.batteries, 2);
});

test('interval parser skips headers and totals kWh', () => {
  const r = parseIntervals('time,kwh\n2026-09-01 00:00,0.20\n2026-09-01 00:15,0.55\nbad line\n');
  assert.equal(r.count, 2);
  assert.equal(r.total, 0.75);
  assert.equal(r.peakKw, 2.2);
});

test('next tuesday is always a future Tuesday', () => {
  const t = nextTuesday(new Date('2026-09-29T10:00:00'));
  assert.equal(t.getDay(), 2);
  assert.equal(t.getDate(), 6);
});

test('off-peak window', () => {
  assert.equal(isOffPeak(new Date('2026-09-30T23:00:00')), true);
  assert.equal(isOffPeak(new Date('2026-09-30T05:59:00')), true);
  assert.equal(isOffPeak(new Date('2026-09-30T12:00:00')), false);
  assert.equal(hoursUntilOffPeak(new Date('2026-09-30T20:00:00')), 2);
});

test('risk bands', () => {
  assert.equal(riskFromHours(6), 'high');
  assert.equal(riskFromHours(2), 'medium');
  assert.equal(riskFromHours(1.9), 'low');
});

test('template fills known keys and flags missing ones', () => {
  assert.equal(fillTemplate('Hi {area} {x}', { area: 'HSR' }), 'Hi HSR [x]');
});
