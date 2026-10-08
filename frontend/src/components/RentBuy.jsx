import { useState } from 'react';
import { useApp } from '../ctx.jsx';
import { SUBDIVISIONS, BACKUP_LOADS, TENANT_STEPS } from '../data.js';
import { Card, RiskBadge } from './Common.jsx';
import { sizeUps } from '../utils.js';

export default function RentBuy() {
  const { areaId } = useApp();
  const [compare, setCompare] = useState(areaId);
  const [picked, setPicked] = useState(['fan', 'led', 'wifi']);
  const [hours, setHours] = useState(3);
  const [done, setDone] = useState(() => JSON.parse(localStorage.getItem('np.tenant') || '[]'));

  const a = SUBDIVISIONS.find(s => s.id === compare);
  const watts = BACKUP_LOADS.filter(l => picked.includes(l.id)).reduce((s, l) => s + l.watts, 0);
  const ups = watts ? sizeUps({ watts, backupHours: Number(hours) || 1 }) : null;

  const toggleLoad = id => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  function toggleStep(i) {
    const next = done.includes(i) ? done.filter(x => x !== i) : [...done, i];
    setDone(next);
    localStorage.setItem('np.tenant', JSON.stringify(next));
  }

  return (
    <div className="stack">
      <Card title="Check an area before renting or buying">
        <label className="field"><span>Area</span>
          <select value={compare} onChange={e => setCompare(e.target.value)}>
            {SUBDIVISIONS.map(s => <option key={s.id} value={s.id}>{s.division_name}</option>)}
          </select>
        </label>
        {a && (
          <>
            <RiskBadge level={a.outage_risk_level} />
            <p>About {a.avg_weekly_outage_hours} hours of cuts a week, reliability {a.reliability_score}/100.</p>
            <p><b>Budget for backup:</b> {a.recommended_ups}</p>
            <p className="muted">{a.grid_triggers}</p>
          </>
        )}
      </Card>

      <Card title="Inverter / UPS sizing">
        <div className="chips">
          {BACKUP_LOADS.map(l => (
            <button key={l.id} className={`chip ${picked.includes(l.id) ? 'on' : ''}`} onClick={() => toggleLoad(l.id)}>
              {l.name} ({l.watts} W)
            </button>
          ))}
        </div>
        <label className="field"><span>Backup hours needed</span>
          <input type="number" min="1" max="12" value={hours} onChange={e => setHours(e.target.value)} /></label>
        {ups ? (
          <>
            <p>Load <b>{watts} W</b>. Choose an inverter of <b>{ups.va} VA or more</b> on a <b>{ups.systemV} V</b> system.</p>
            <p>Battery bank of about <b>{ups.ah} Ah at {ups.systemV} V</b>, roughly <b>{ups.batteries} x 12 V 150 Ah</b> batteries.</p>
          </>
        ) : <p className="muted">Pick at least one appliance.</p>}
        <small>Formula: VA = watts / 0.8 x 1.25 headroom. Ah = watts x hours / (volts x 0.6 usable depth x 0.85 efficiency).</small>
      </Card>

      <Card title="Tenant guide: Gruha Jyothi">
        <ol className="steps">
          {TENANT_STEPS.map((s, i) => (
            <li key={i}>
              <label className="check">
                <input type="checkbox" checked={done.includes(i)} onChange={() => toggleStep(i)} /> {s}
              </label>
            </li>
          ))}
        </ol>
        <small>This is a checklist only. Do your Aadhaar linking on the official Seva Sindhu portal; we never see or store it. Requirements change, so confirm the current steps there.</small>
      </Card>
    </div>
  );
}
