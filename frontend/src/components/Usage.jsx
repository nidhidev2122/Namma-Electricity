import { useMemo, useState } from 'react';
import { applianceBreakdown, compareScenarios, savingsIdeas, PRESETS, inr } from '@engine/index.js';
import { useApp } from '../ctx.jsx';
import { Card, NumField, EstimateTag } from './Common.jsx';

const PALETTE = ['#5b3fd6', '#ffb020', '#0f9d7a', '#8f7af0', '#e04a56', '#2f7fd1', '#c9a227', '#6b5b95'];

export default function Usage() {
  const { appliances, setAppliances } = useApp();
  const [sc, setSc] = useState({});
  const [form, setForm] = useState({ name: '', watts: '', hoursPerDay: '' });
  const hoursOf = a => sc[a.id] ?? a.hoursPerDay;

  const base = useMemo(() => applianceBreakdown(appliances), [appliances]);
  const scenario = useMemo(() => compareScenarios(appliances, [{ name: 'What if', hours: sc }])[1], [appliances, sc]);
  const ideas = useMemo(() => savingsIdeas(appliances), [appliances]);
  const colorOf = Object.fromEntries(base.items.map((i, n) => [i.id, PALETTE[n % PALETTE.length]]));
  const max = Math.max(...base.items.map(i => i.units), 1);
  const changed = Object.keys(sc).length > 0;

  const add = p => setAppliances(l => [...l, { id: crypto.randomUUID(), startedAt: null, alerted: false, alertAfter: 35, dutyCycle: 1, ...p }]);
  const remove = id => { setAppliances(l => l.filter(a => a.id !== id)); setSc(({ [id]: _, ...r }) => r); };
  const quick = mins => { const next = {}; base.items.slice(0, 3).forEach(i => { next[i.id] = Math.max(0, i.hoursPerDay - mins / 60); }); setSc(next); };

  return (
    <div className="stack">
      <Card title="Add what you run at home" right={<EstimateTag>Estimates, not meter readings</EstimateTag>}>
        <div className="chips">{PRESETS.map(p => <button key={p.name} className="chip" onClick={() => add(p)}>+ {p.name}</button>)}</div>
        <div className="grid3">
          <label className="field"><span>Appliance</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mixer grinder" /></label>
          <NumField label="Watts" value={form.watts} onChange={v => setForm({ ...form, watts: v })} placeholder="from the label" />
          <NumField label="Hours per day" value={form.hoursPerDay} onChange={v => setForm({ ...form, hoursPerDay: v })} />
        </div>
        <button className="btn" disabled={!form.name || !(Number(form.watts) > 0) || form.hoursPerDay === ''} onClick={() => { add({ name: form.name.trim(), watts: Number(form.watts), hoursPerDay: Number(form.hoursPerDay) }); setForm({ name: '', watts: '', hoursPerDay: '' }); }}>Add appliance</button>
        <small style={{ display: 'block', marginTop: 8 }}>Preset wattages are typical figures, not measurements. Use the wattage on your appliance's label where you can. Appliances that cycle (AC, fridge) use a duty-cycle assumption shown per item.</small>
      </Card>

      {!appliances.length ? (
        <Card><p className="muted" style={{ margin: 0 }}>Add a few appliances to see which ones drive your bill.</p></Card>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat"><small>Estimated units / month</small><b>{base.totalUnits}</b></div>
            <div className="stat"><small>Estimated running cost</small><b>{inr(base.totalCost)}</b><small>at ≈ {inr(base.rate)} per unit</small></div>
            <div className="stat"><small>Biggest contributor</small><b style={{ fontSize: 20 }}>{base.items[0].name}</b><small>{base.items[0].share}% of what you entered</small></div>
          </div>

          <Card title="Where it goes" right={<EstimateTag />}>
            {base.items.map(i => (
              <div className="hbar" key={i.id}>
                <span>{i.name}</span>
                <div className="track"><div className="fill" style={{ width: `${(i.units / max) * 100}%`, background: colorOf[i.id] }} /></div>
                <b>{inr(i.cost)}</b>
              </div>
            ))}
            <small>{base.label} Cost uses working tariff rates (not verified).</small>
          </Card>

          <Card title="Try different habits" right={changed ? <button className="link" onClick={() => setSc({})}>Reset</button> : null}>
            <div className="chips">
              <button className="chip" onClick={() => quick(30)}>Top 3 appliances: 30 min less</button>
              <button className="chip" onClick={() => quick(60)}>Top 3 appliances: 1 h less</button>
            </div>
            {base.items.map(i => {
              const a = appliances.find(x => x.id === i.id);
              const h = hoursOf(a);
              return (
                <div className="app-row" key={i.id}>
                  <div className="app-head">
                    <span><b>{a.name}</b> <small>{a.watts} W · {Math.round((a.dutyCycle ?? 1) * 100)}% duty</small></span>
                    <span><b>{h.toFixed(1)}</b> h/day <button className="link" onClick={() => remove(i.id)} aria-label={`Remove ${a.name}`}>Remove</button></span>
                  </div>
                  <input type="range" min={0} max={24} step={0.25} value={h} onChange={e => setSc({ ...sc, [a.id]: Number(e.target.value) })} aria-label={`${a.name} hours per day`} />
                </div>
              );
            })}
            {scenario && (
              <div className="alert green" style={{ marginTop: 12 }}>
                <b>Current → What if:</b> {base.totalUnits} → {scenario.totalUnits} units, {inr(base.totalCost)} → {inr(scenario.totalCost)}.{' '}
                {scenario.savedUnits !== 0 && <span className={`delta-pill ${scenario.savedUnits < 0 ? 'up' : ''}`}>{scenario.savedUnits > 0 ? 'saves' : 'adds'} {Math.abs(scenario.savedUnits)} units · {inr(Math.abs(scenario.savedCost))}/month</span>}
                <div><small>Estimate. Real savings depend on how the appliance actually runs.</small></div>
                {changed && <button className="btn btn-alt" style={{ marginTop: 8 }} onClick={() => { setAppliances(l => l.map(a => ({ ...a, hoursPerDay: sc[a.id] ?? a.hoursPerDay }))); setSc({}); }}>Use these hours as my usage</button>}
              </div>
            )}
          </Card>

          {ideas.length > 0 && (
            <Card title="Habit changes ranked by savings">
              {ideas.map((i, n) => (
                <div className="row" key={n}>
                  <div><b>{i.appliance}: {i.minutesPerDay} min less a day</b><br /><small>{i.assumption}</small></div>
                  <div style={{ textAlign: 'right' }}><b className="good">{inr(i.cost)}</b><br /><small>≈ {i.units} units</small></div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
