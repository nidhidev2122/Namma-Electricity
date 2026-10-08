import { useEffect, useState } from 'react';
import { useApp } from '../ctx.jsx';
import { APPLIANCE_PRESETS } from '../data.js';
import { Card } from './Common.jsx';
import { TARIFF, computeBill, inr, isOffPeak, hoursUntilOffPeak, monthlyUnits, parseIntervals, runtimeMinutes } from '../utils.js';

export default function Appliances() {
  const {
    appliances, setAppliances, settings, unitsSoFar, meterUnits, setMeterUnits,
    setIntervals, monthKey, alerts, setAlerts, notifPerm, askNotifications
  } = useApp();
  const [, tick] = useState(0);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');

  // Re-render every 20 s so the running timers stay current
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 20000);
    return () => clearInterval(id);
  }, []);

  const add = p => setAppliances(list => [...list, { ...p, id: crypto.randomUUID(), startedAt: null, alerted: false, alertAfter: 35 }]);
  const patch = (id, change) => setAppliances(list => list.map(a => (a.id === id ? { ...a, ...change } : a)));
  const remove = id => setAppliances(list => list.filter(a => a.id !== id));
  const toggle = a => patch(a.id, a.startedAt ? { startedAt: null, alerted: false } : { startedAt: Date.now(), alerted: false });

  const estimate = monthlyUnits(appliances);
  const projected = Math.max(unitsSoFar, estimate);
  const bill = computeBill({ units: projected, sanctionedKw: settings.sanctionedKw, gruhaJyothi: settings.gruhaJyothi });
  const hasEv = appliances.some(a => a.ev);
  const offPeak = isOffPeak();

  function ingest() {
    const r = parseIntervals(paste);
    if (!r.count) return setMsg('No 15-minute readings found. Use one "timestamp,kWh" line per reading.');
    setIntervals({ ...r, month: monthKey() });
    setMsg(`Loaded ${r.count} readings, ${r.total} kWh, peak draw about ${r.peakKw} kW.`);
    setPaste('');
  }

  function readFile(e) {
    const f = e.target.files?.[0];
    if (f) f.text().then(setPaste);
  }

  return (
    <div className="stack">
      <Card title="Month so far">
        <label className="field">
          <span>Units on your meter this month</span>
          <input type="number" min="0" value={meterUnits} onChange={e => setMeterUnits(e.target.value)} />
        </label>
        <p>
          Using <b>{Math.round(unitsSoFar)}</b> units; the appliances below add up to about <b>{estimate}</b> units a month.
          Projected bill: <b>{inr(bill.payable)}</b>
          {bill.waived && ' (Gruha Jyothi zero bill)'}.
        </p>
        {settings.gruhaJyothi && (
          <div className="bar"><div style={{ width: `${Math.min(100, (projected / TARIFF.gruhaJyothiCap) * 100)}%` }}
            className={projected >= TARIFF.gruhaJyothiWarn ? 'bar-hot' : ''} /></div>
        )}
        {settings.gruhaJyothi && <small>Alert fires at {TARIFF.gruhaJyothiWarn} units; the subsidy ends after {TARIFF.gruhaJyothiCap}.</small>}
        {notifPerm === 'default' && <button className="btn" onClick={askNotifications}>Turn on alerts</button>}
        {notifPerm === 'denied' && <small>Notifications are blocked in the browser; alerts will still appear below.</small>}
      </Card>

      <Card title="High-draw appliances">
        <div className="chips">
          {APPLIANCE_PRESETS.map(p => <button key={p.name} className="chip" onClick={() => add(p)}>+ {p.name} ({p.watts} W)</button>)}
        </div>
        {!appliances.length && <p className="muted">Add an appliance, then tap Start when you switch it on.</p>}
        {appliances.map(a => (
          <div key={a.id} className="row">
            <div>
              <b>{a.name}</b> <small>{a.watts} W</small>
              <div className="muted">
                {a.startedAt ? `Running ${runtimeMinutes(a)} min` : 'Off'} · {a.hoursPerDay} h/day
              </div>
            </div>
            <div className="row-actions">
              <input type="number" min="0" step="0.5" value={a.hoursPerDay} aria-label="hours per day"
                onChange={e => patch(a.id, { hoursPerDay: Number(e.target.value) })} />
              <button className={a.startedAt ? 'btn btn-stop' : 'btn'} onClick={() => toggle(a)}>{a.startedAt ? 'Stop' : 'Start'}</button>
              <button className="link" onClick={() => remove(a.id)}>Remove</button>
            </div>
          </div>
        ))}
      </Card>

      {hasEv && (
        <Card title="EV charging window">
          <p>
            {offPeak
              ? 'It is off-peak now (10 PM to 6 AM). Good time to charge.'
              : `Peak hours. Off-peak starts in about ${hoursUntilOffPeak()} h, at 10 PM.`}
          </p>
          <small>A full 3.3 kW hour costs about {inr(((3.3) * (TARIFF.energy + TARIFF.pgSurcharge + TARIFF.fppca) * (1 + TARIFF.dutyRate)).toFixed(2))} at the flat rate. Check your ToD rebate on the BESCOM tariff order.</small>
        </Card>
      )}

      <Card title="Smart meter readings (15 min)">
        <textarea rows="4" value={paste} onChange={e => setPaste(e.target.value)}
          placeholder={'2026-09-01 00:00,0.20\n2026-09-01 00:15,0.55'} />
        <div className="row-actions">
          <input type="file" accept=".csv,text/csv,text/plain" onChange={readFile} />
          <button className="btn" onClick={ingest} disabled={!paste.trim()}>Load readings</button>
        </div>
        {msg && <p>{msg}</p>}
      </Card>

      <Card title="Recent alerts">
        {!alerts.length && <p className="muted">Nothing yet.</p>}
        {alerts.map(a => (
          <div key={a.id} className="alert">
            <b>{a.title}</b>
            <div>{a.body}</div>
            <small>{new Date(a.at).toLocaleString('en-IN')}</small>
          </div>
        ))}
        {!!alerts.length && <button className="link" onClick={() => setAlerts([])}>Clear</button>}
      </Card>
    </div>
  );
}
