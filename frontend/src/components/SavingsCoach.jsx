import { useMemo, useState } from 'react';
import { buildPlan, trackSavings, inr } from '@engine/index.js';
import { useApp } from '../ctx.jsx';
import { Card, NumField, Ring, Sparkline, EstimateTag } from './Common.jsx';

const STATUS = {
  on_track: ['green', 'On track', 'Your current pace fits your budget.'],
  watch: ['', 'Close to the line', 'Your pace is slightly above your target. Small changes can fix it.'],
  over: ['red', 'Trending above target', 'At this pace the month ends over your budget.']
};

export default function SavingsCoach() {
  const { budget, setBudget, meterUnits, setMeterUnits, unitsSoFar, settings, appliances, coachHistory, setCoachHistory, monthKey } = useApp();
  const now = new Date();
  const [day, setDay] = useState(now.getDate());
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const units = Number(meterUnits) || unitsSoFar || 0;
  const plan = useMemo(() => buildPlan({ budget: Number(budget) || 0, unitsSoFar: units, dayOfMonth: Number(day) || 1, daysInMonth: dim, sanctionedKw: settings.sanctionedKw, gruhaJyothi: settings.gruhaJyothi, entitlementUnits: settings.entitlementUnits || null, appliances }), [budget, units, day, dim, settings, appliances]);
  const track = useMemo(() => trackSavings(coachHistory.map(h => ({ month: h.month, units: h.units }))), [coachHistory]);
  const [tone, label, text] = STATUS[plan.status];
  const saveSnapshot = () => setCoachHistory(h => [...h.filter(x => x.month !== monthKey()), { month: monthKey(), units: Math.round(plan.projectedUnits), budget: Number(budget), bill: plan.projectedBill.payable }].sort((a, b) => a.month.localeCompare(b.month)).slice(-12));
  const top = plan.suggestions[0];

  return (
    <div className="stack">
      <div className="cols">
        <Card title="Your month">
          <NumField label="Monthly electricity budget (₹)" value={budget} onChange={setBudget} hint="What you want to spend on this bill" />
          <NumField label="Units on your meter so far" value={meterUnits} onChange={setMeterUnits} />
          <label className="field"><span>Day of the month: {day} of {dim}</span><input type="range" min={1} max={dim} value={day} onChange={e => setDay(Number(e.target.value))} /></label>
          <small>Projection = units so far ÷ days gone × days in month. {plan.note || 'It gets more reliable after the first two weeks.'}</small>
        </Card>
        <Card title="Month-end projection" right={<EstimateTag />}>
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <Ring value={plan.projectedUnits} max={Math.max(plan.targetUnits, 1)} label={`${Math.round(plan.projectedUnits)}`} sub={`units · target ${plan.targetUnits}`} />
          </div>
          <div className={`alert ${tone}`} style={{ marginTop: 10 }}><b>{label}.</b> {text}</div>
          <table className="table"><tbody>
            <tr><td>Projected bill (worst case)</td><td>{inr(plan.projectedBill.payable)}</td></tr>
            {plan.projectedBill.payableLow !== plan.projectedBill.payable && <tr><td>Projected bill (best case)</td><td>{inr(plan.projectedBill.payableLow)}</td></tr>}
            <tr><td>Your budget</td><td>{inr(Number(budget) || 0)}</td></tr>
            <tr className="total"><td>Daily allowance for the rest of the month</td><td>{plan.dailyAllowance} units</td></tr>
          </tbody></table>
          <small>Bill figures use working rates (not verified){settings.gruhaJyothi ? ' and your Gruha Jyothi settings' : ''}.</small>
        </Card>
      </div>

      <Card title="Your plan">
        {plan.status !== 'on_track' && top ? (
          <p>Your current usage is trending {plan.gap > 0 ? `${Math.round(plan.gap)} units above` : 'near'} your target. Reducing <b>{top.appliance}</b> by {top.minutesPerDay} minutes daily could save approximately <b>{top.units} units</b> ({inr(top.cost)}) over the rest of this month.</p>
        ) : plan.status === 'on_track' ? <p>You are on track. Keep your pace near {plan.perDay} units a day.</p> : <p className="muted">Add appliances in "Where it goes" to get specific actions based on your own usage.</p>}
        {plan.suggestions.map((s, i) => (
          <div className="row" key={i}>
            <div><b>{s.appliance}: {s.minutesPerDay} min less a day</b><br /><small>Assumptions: {s.assumption}</small></div>
            <div style={{ textAlign: 'right' }}><b className="good">{inr(s.cost)}</b><br /><small>≈ {s.units} units</small></div>
          </div>
        ))}
      </Card>

      <Card title="Track savings over time" right={<button className="btn btn-alt" onClick={saveSnapshot}>Save this month</button>}>
        {coachHistory.length ? (
          <>
            <Sparkline values={coachHistory.map(h => h.units)} />
            {track.rows.map(r => <div className="row" key={r.month}><span>{r.month} · {r.units} units</span><b className={r.savedCost ? 'good' : ''}>{r.savedCost ? `saved ≈ ${inr(r.savedCost)}` : '—'}</b></div>)}
            <p><b>Estimated total saved: {inr(track.totalSaved)}</b></p>
            <small>{track.label}</small>
          </>
        ) : <p className="muted">Save a snapshot each month. We compare projected usage month to month and estimate what you saved.</p>}
      </Card>
    </div>
  );
}
