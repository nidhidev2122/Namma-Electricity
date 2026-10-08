import { useApp } from '../ctx.jsx';
import { COACH_TIPS } from '../data.js';
import { Card, AreaPicker, RiskBadge, useArea } from './Common.jsx';
import { nextTuesday, computeBill, inr, monthlyUnits } from '../utils.js';

export default function Coach() {
  const { appliances, settings } = useApp();
  const area = useArea();
  const tue = nextTuesday();
  const est = monthlyUnits(appliances);
  const heavy = [...appliances].sort((a, b) => b.watts * b.hoursPerDay - a.watts * a.hoursPerDay)[0];
  const tips = COACH_TIPS[area.outage_risk_level];

  return (
    <div className="stack">
      <AreaPicker />
      <Card title="Tuesday maintenance">
        <RiskBadge level={area.outage_risk_level} />
        <p>
          Next planned window for {area.division_name}: <b>{tue.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</b>,
          usually 10:00 to 17:00. Circulars change, so treat this as a heads-up rather than a schedule.
        </p>
        <p className="muted">Charge devices and the inverter on Monday night, and run the pump and geyser early.</p>
      </Card>
      <Card title="For your area">
        <ul>{tips.map(t => <li key={t}>{t}</li>)}</ul>
      </Card>
      {heavy && (
        <Card title="Your biggest load">
          <p>
            <b>{heavy.name}</b> uses about {Math.round((heavy.watts * heavy.hoursPerDay * 30) / 1000)} units a month.
            {est > 200 && settings.gruhaJyothi &&
              ` Your appliances total ${est} units, over the 200-unit limit. Cutting it by an hour a day is worth up to ${inr(computeBill({ units: est, sanctionedKw: settings.sanctionedKw }).gross)} a month.`}
          </p>
        </Card>
      )}
    </div>
  );
}
