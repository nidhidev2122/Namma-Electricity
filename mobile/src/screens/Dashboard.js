// mobile/src/screens/Dashboard.jsx
import React from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../AppContext';
import { Card, AreaPicker, RiskBadge, Button, Stat, s, useArea } from '../components';
import { computeBill, inr, nextTuesday, monthlyUnits } from '../utils';

export default function Dashboard({ go }) {
  const { settings, unitsSoFar, appliances, alerts, intervals } = useApp();
  const area = useArea();
  const units = Math.max(unitsSoFar, monthlyUnits(appliances));
  const bill = computeBill({
    units,
    sanctionedKw: settings.sanctionedKw,
    gruhaJyothi: settings.gruhaJyothi
  });

  const usageBars = [
    Math.min(100, units / 2),
    Math.min(100, monthlyUnits(appliances) / 2),
    Math.min(100, (intervals.peakKw || 0) / 3)
  ];

  return (
    <>
      <AreaPicker />

      {/* Stats Row - matching web layout */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <Stat label="Monthly units" value={Math.round(units)} />
        <Stat label="Estimated bill" value={inr(bill.payable)} />
        <Stat label="Area reliability" value={`${area.reliability_score}/100`} />
      </View>

      {/* Your Area Card */}
      <Card title="Your area">
        <RiskBadge level={area.outage_risk_level} />
        <Text style={s.text}>
          {area.division_name}: about {area.avg_weekly_outage_hours} h of cuts a week. Next planned maintenance is{' '}
          {nextTuesday().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}.
        </Text>
        <Button title="See the outage map" secondary onPress={() => go('map')} />
      </Card>

      {/* This Month Card */}
      <Card title="This month">
        <Text style={s.text}>
          <Text style={{ fontWeight: '800' }}>{Math.round(units)}</Text> units, estimated bill{' '}
          <Text style={{ fontWeight: '800' }}>{inr(bill.payable)}</Text>
          {bill.waived ? ' (Gruha Jyothi)' : ''}.
        </Text>
        <Button title="Open bill estimator" secondary onPress={() => go('bills')} />
      </Card>

      {/* Usage Snapshot Card */}
      <Card title="Usage snapshot">
        <View style={s.chart}>
          {usageBars.map((height, index) => (
            <View key={index} style={s.chartColumn}>
              <View
                style={[
                  s.chartBar,
                  {
                    height: Math.max(8, height * 1.1),
                    backgroundColor: index === 2 ? '#F59E0B' : '#1D4ED8'
                  }
                ]}
              />
              <Text style={s.muted}>{['Used', 'Plan', 'Peak'][index]}</Text>
            </View>
          ))}
        </View>
        <Text style={s.muted}>Based on local meter data and appliance estimates.</Text>
      </Card>

      {/* Quick Actions Card */}
      <Card title="Quick actions">
        <View style={s.quickActions}>
          <Button title="Report outage" onPress={() => go('report')} />
          <Button title="Add appliance" secondary onPress={() => go('appliances')} />
          <Button title="Get advice" secondary onPress={() => go('coach')} />
        </View>
      </Card>

      {/* Alerts Card - matching web empty state */}
      <Card title="Alerts">
        <Text style={s.text}>
          {alerts.length
            ? alerts[0].title
            : 'No alerts. Add your appliances to get warned before big loads pile up.'}
        </Text>
        <Button title="Manage appliances" secondary onPress={() => go('appliances')} />
      </Card>
    </>
  );
}