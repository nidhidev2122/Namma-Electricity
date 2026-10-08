import { useApp } from '../ctx.jsx';
import { Card, AreaPicker, useArea } from './Common.jsx';
import { computeBill, inr, monthlyUnits } from '../utils.js';

function Bar({label, value, max, color = '#2563EB'}) {
  const width = `${Math.max(4, Math.min(100, (value / Math.max(max, 1)) * 100))}%`;
  return <div className="analytics-bar-row"><span>{label}</span><div className="analytics-bar-track"><div className="analytics-bar" style={{width, backgroundColor: color}} /></div><b>{value}</b></div>;
}

export default function Analytics() {
  const {settings, unitsSoFar, appliances, intervals, alerts} = useApp();
  const area = useArea();
  const applianceUnits = monthlyUnits(appliances);
  const units = Math.max(Number(unitsSoFar) || 0, applianceUnits);
  const bill = computeBill({units, sanctionedKw: settings.sanctionedKw, gruhaJyothi: settings.gruhaJyothi});
  const largest = [...appliances].sort((a, b) => b.watts * b.hoursPerDay - a.watts * a.hoursPerDay)[0];
  return <div className="stack">
    <AreaPicker />
    <div className="grid3">
      <Card title="Monthly usage"><strong className="metric">{Math.round(units)} units</strong><small>Meter and appliance estimate</small></Card>
      <Card title="Estimated bill"><strong className="metric">{inr(bill.payable)}</strong><small>{bill.waived ? 'Gruha Jyothi applied' : 'Payable estimate'}</small></Card>
      <Card title="Peak draw"><strong className="metric">{intervals.peakKw || 0} kW</strong><small>{intervals.count || 0} meter readings</small></Card>
    </div>
    <Card title="Usage breakdown">
      <Bar label="Meter usage" value={Math.round(Number(unitsSoFar) || 0)} max={Math.max(units, 1)} />
      <Bar label="Appliance plan" value={Math.round(applianceUnits)} max={Math.max(units, 1)} color="#10B981" />
      <Bar label="Subsidy ceiling" value={Math.min(units, 200)} max={200} color="#F59E0B" />
      <p className="muted">The 200-unit Gruha Jyothi ceiling is shown as a reference, not an official tariff confirmation.</p>
    </Card>
    <Card title="Area signal">
      <div className="row"><span>Reliability score</span><b>{area.reliability_score}/100</b></div>
      <div className="row"><span>Average outage</span><b>{area.avg_weekly_outage_hours} h/week</b></div>
      <div className="row"><span>Recent alerts</span><b>{alerts.length}</b></div>
    </Card>
    <Card title="Largest planned load">
      {largest ? <p><b>{largest.name}</b> contributes about {Math.round((largest.watts * largest.hoursPerDay * 30) / 1000)} units/month at the current plan.</p> : <p className="muted">Add appliances to see load insights.</p>}
    </Card>
  </div>;
}
