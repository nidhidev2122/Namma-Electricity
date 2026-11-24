import { useMemo, useState } from 'react';
import { analyzeGruhaJyothi, whatIf, inr } from '@engine/index.js';
import { useApp } from '../ctx.jsx';
import { Card, NumField, Ring, OfficialLinks, EstimateTag } from './Common.jsx';

export default function GruhaJyothi() {
  const { settings, setSettings, unitsSoFar, meterUnits, setMeterUnits } = useApp();
  const [delta, setDelta] = useState(-20);
  const units = Number(meterUnits) || unitsSoFar || 0;
  const input = { units, sanctionedKw: settings.sanctionedKw, enrolled: settings.gruhaJyothi, entitlementUnits: settings.entitlementUnits || null, avgPastUnits: settings.avgPastUnits || null };
  const g = useMemo(() => analyzeGruhaJyothi(input), [units, settings]);
  const w = useMemo(() => whatIf(input, delta), [units, settings, delta]);
  const b = g.bill;
  const range = b.status === 'over' || b.status === 'entitlement_unknown';
  const set = (k, v) => setSettings({ ...settings, [k]: v === '' ? null : Number(v) });

  return (
    <div className="stack">
      <div className="cols">
        <Card title="Your entitlement">
          <label className="check"><input type="checkbox" checked={settings.gruhaJyothi} onChange={e => setSettings({ ...settings, gruhaJyothi: e.target.checked })} /> My household is registered for Gruha Jyothi</label>
          <NumField label="Units used or expected this month" value={meterUnits} onChange={setMeterUnits} hint="Meter reading so far, or your best estimate" />
          <NumField label="Your official free-unit entitlement" value={settings.entitlementUnits ?? ''} onChange={v => set('entitlementUnits', v)} placeholder="If you know it" hint="From your registration or records. Capped at 200." />
          <NumField label="Or: average monthly units over the past year" value={settings.avgPastUnits ?? ''} onChange={v => set('avgPastUnits', v)} placeholder="Used only if no official figure" hint="We estimate entitlement from this, and label it as an estimate." />
          <NumField label="Sanctioned load (kW)" value={settings.sanctionedKw} min={0.5} step={0.5} onChange={v => setSettings({ ...settings, sanctionedKw: Number(v) || 1 })} />
          <div className="alert blue"><b>Under 200 units is not a guarantee.</b> What counts is your own entitlement and eligibility. Entitlement rules are reported differently across sources, so verify yours on the official portal.</div>
        </Card>

        <Card title="Where you stand" right={g.entitlement !== null && g.entitlementSource === 'estimated' ? <EstimateTag>Estimated entitlement</EstimateTag> : null}>
          <div style={{ display: 'grid', placeItems: 'center', gap: 8 }}>
            {g.entitlement !== null
              ? <Ring value={units} max={g.entitlement} label={`${Math.round(units)} / ${g.entitlement}`} sub="units vs entitlement" />
              : <Ring value={units} max={200} label={`${Math.round(units)}`} sub="units (no entitlement set)" tone="var(--fil)" />}
          </div>
          {g.messages.map(m => <p key={m}>{m}</p>)}
          <table className="table"><tbody>
            <tr><td>Bill before any scheme benefit</td><td>{inr(b.gross)}</td></tr>
            {range
              ? <><tr><td>Best case you pay</td><td>{inr(b.payableLow)}</td></tr><tr className="total"><td>Worst case you pay</td><td>{inr(b.payable)}</td></tr></>
              : <tr className="total"><td>You pay (projected)</td><td>{inr(b.payable)}</td></tr>}
          </tbody></table>
          {b.status === 'over' && <small>Best case assumes only units beyond your entitlement are charged. Worst case assumes the whole bill. Your bill will show which applies.</small>}
          {b.status === 'entitlement_unknown' && <small>Best case assumes you are fully covered. Add your entitlement to narrow this.</small>}
        </Card>
      </div>

      <Card title="What if I use fewer (or more) units?">
        <div className="row-actions" style={{ flexWrap: 'nowrap' }}>
          <input type="range" min={-80} max={80} step={5} value={delta} onChange={e => setDelta(Number(e.target.value))} aria-label="Change in units" />
          <b style={{ minWidth: 110 }}>{delta > 0 ? '+' : ''}{delta} units</b>
        </div>
        <div className="chips">{[-40, -20, -10, 10, 20].map(d => <button key={d} className={`chip ${d === delta ? 'on' : ''}`} onClick={() => setDelta(d)}>{d > 0 ? '+' : ''}{d} units</button>)}</div>
        <div className="stat-row">
          <div className="stat"><small>Units</small><b>{Math.round(w.to.units)}</b></div>
          <div className="stat"><small>Worst-case payable</small><b>{inr(w.to.bill.payable)}</b><small className={w.payableChange <= 0 ? 'good' : 'bad'}>{w.payableChange === 0 ? 'no change' : `${w.payableChange < 0 ? '−' : '+'}${inr(Math.abs(w.payableChange))}`}</small></div>
          <div className="stat"><small>Status</small><b style={{ fontSize: 18 }}>{{ within: 'Within entitlement', over: 'Over entitlement', entitlement_unknown: 'Entitlement unknown', not_enrolled: 'Not registered' }[w.to.bill.status]}</b></div>
        </div>
        <small>Each extra unit is worth about {inr(w.perUnit)} on the bill at working rates (estimate), while the fixed charge stays put.</small>
      </Card>

      <Card title="Check your registration and entitlement">
        <p className="muted">We cannot confirm enrolment or eligibility. Use the official sources, and keep your electricity account (RR) number ready.</p>
        <OfficialLinks ids={['sevasindhu', 'bescom']} />
      </Card>
    </div>
  );
}
