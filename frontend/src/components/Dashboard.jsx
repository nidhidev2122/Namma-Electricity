import { useApp } from '../ctx.jsx';
import { Card, AreaPicker, RiskBadge, useArea } from './Common.jsx';
import { computeBill, inr, nextTuesday, monthlyUnits } from '../utils.js';

export default function Dashboard({ go }) {
  const { settings, unitsSoFar, appliances, alerts } = useApp();
  const area = useArea();
  const units = Math.max(unitsSoFar, monthlyUnits(appliances));
  const bill = computeBill({ units, sanctionedKw: settings.sanctionedKw, gruhaJyothi: settings.gruhaJyothi });

  return (
    <div className="stack">
      <AreaPicker />
      <Card title="Your area">
        <RiskBadge level={area.outage_risk_level} />
        <p>{area.division_name}: about {area.avg_weekly_outage_hours} h of cuts a week. Next planned maintenance is {nextTuesday().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}.</p>
        <button className="link" onClick={() => go('map')}>See the map</button>
      </Card>
      <Card title="This month">
        <p><b>{Math.round(units)}</b> units, estimated bill <b>{inr(bill.payable)}</b>{bill.waived && ' (Gruha Jyothi)'}.</p>
        <button className="link" onClick={() => go('bills')}>Open bill estimator</button>
      </Card>
      <Card title="Alerts">
        <p>{alerts.length ? alerts[0].title : 'No alerts. Add your appliances to get warned before big loads pile up.'}</p>
        <button className="link" onClick={() => go('appliances')}>Manage appliances</button>
      </Card>
    </div>
  );
}
