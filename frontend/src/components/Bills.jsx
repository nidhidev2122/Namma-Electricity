import { useEffect, useState } from 'react';
import { useApp } from '../ctx.jsx';
import { Card } from './Common.jsx';
import { TARIFF, computeBill, dgVsGrid, inr } from '../utils.js';

export default function Bills() {
  const { settings, setSettings, unitsSoFar } = useApp();
  const [units, setUnits] = useState(unitsSoFar || 150);
  const [dgRate, setDgRate] = useState(20);
  const [aptUnits, setAptUnits] = useState(250);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('np.billHistory') || '[]'); } catch { return []; }
  });

  const bill = computeBill({ units: Number(units), sanctionedKw: settings.sanctionedKw, gruhaJyothi: settings.gruhaJyothi });
  const dg = dgVsGrid({ units: Number(aptUnits), dgRate: Number(dgRate), sanctionedKw: settings.sanctionedKw });
  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    const next = [...history.filter(item => item.month !== month), { month, units: Number(units) || 0, payable: bill.payable }].slice(-6);
    setHistory(next);
    localStorage.setItem('np.billHistory', JSON.stringify(next));
  }, [units, bill.payable]);
  const lines = [
    [`Energy (${TARIFF.energy}/kWh)`, bill.energy],
    [`Fixed (${TARIFF.fixedPerKw}/kW x ${settings.sanctionedKw} kW)`, bill.fixed],
    [`P&G surcharge (${TARIFF.pgSurcharge}/kWh)`, bill.pg],
    [`FPPCA (${TARIFF.fppca}/kWh)`, bill.fppca],
    [`Electricity duty (${TARIFF.dutyRate * 100}%)`, bill.duty]
  ];

  return (
    <div className="stack">
      <Card title="Bill estimator (LT-1 domestic)">
        <div className="grid2">
          <label className="field"><span>Units</span>
            <input type="number" min="0" value={units} onChange={e => setUnits(e.target.value)} /></label>
          <label className="field"><span>Sanctioned load (kW)</span>
            <input type="number" min="1" step="0.5" value={settings.sanctionedKw}
              onChange={e => setSettings({ ...settings, sanctionedKw: Number(e.target.value) || 1 })} /></label>
        </div>
        <label className="check">
          <input type="checkbox" checked={settings.gruhaJyothi}
            onChange={e => setSettings({ ...settings, gruhaJyothi: e.target.checked })} />
          I am enrolled in Gruha Jyothi
        </label>
        <table className="table">
          <tbody>
            {lines.map(([k, v]) => <tr key={k}><td>{k}</td><td>{inr(v)}</td></tr>)}
            <tr><td>Bill before subsidy</td><td>{inr(bill.gross)}</td></tr>
            <tr className="total"><td>You pay</td><td>{inr(bill.payable)}</td></tr>
          </tbody>
        </table>
        {bill.waived && <p className="good">Gruha Jyothi covers this bill in full.</p>}
        {settings.gruhaJyothi && !bill.waived && (
          <p className="warn">Over {TARIFF.gruhaJyothiCap} units the subsidy does not apply, and the whole bill is payable.</p>
        )}
        <small>Rates are editable placeholders based on the 2026-27 LT-1 figures you supplied; confirm them with the current KERC order.</small>
      </Card>

      <Card title="Bill history">
        {history.slice().reverse().map(item => <div className="row" key={item.month}><span>{item.month} · {Math.round(item.units)} units</span><b>{inr(item.payable)}</b></div>)}
        {!history.length && <p className="muted">Your recent estimates will appear here.</p>}
      </Card>

      <Card title="Apartment: grid vs diesel generator">
        <div className="grid2">
          <label className="field"><span>Units in a month</span>
            <input type="number" min="0" value={aptUnits} onChange={e => setAptUnits(e.target.value)} /></label>
          <label className="field"><span>DG rate (₹/kWh)</span>
            <input type="number" min={TARIFF.dgMin} max={TARIFF.dgMax} value={dgRate} onChange={e => setDgRate(e.target.value)} /></label>
        </div>
        <table className="table">
          <tbody>
            <tr><td>BESCOM grid</td><td>{inr(dg.grid)} ({inr(dg.gridPerUnit)}/unit)</td></tr>
            <tr><td>RWA diesel generator</td><td>{inr(dg.dg)}</td></tr>
            <tr className="total"><td>Extra if run on DG</td><td>{inr(dg.extraOnDg)}</td></tr>
          </tbody>
        </table>
        <small>DG typically runs {TARIFF.dgMin} to {TARIFF.dgMax} per kWh. Ask your RWA which rate they bill.</small>
      </Card>
    </div>
  );
}
