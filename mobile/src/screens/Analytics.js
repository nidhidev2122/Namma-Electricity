import React from 'react';
import {Text, View} from 'react-native';
import {useApp} from '../AppContext';
import {Card, AreaPicker, Stat, s, useArea} from '../components';
import {computeBill, inr, monthlyUnits} from '../utils';

function Bar({label, value, max, color}) {
  return <View style={{marginVertical: 7}}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={s.muted}>{label}</Text><Text style={s.muted}>{value}</Text></View><View style={s.analyticsTrack}><View style={[s.analyticsBar,{width:`${Math.max(4, Math.min(100, value / Math.max(max, 1) * 100))}%`,backgroundColor:color}]}/></View></View>;
}

export default function Analytics() {
  const {settings, unitsSoFar, appliances, intervals, alerts} = useApp();
  const area = useArea();
  const applianceUnits = monthlyUnits(appliances);
  const units = Math.max(Number(unitsSoFar) || 0, applianceUnits);
  const bill = computeBill({units, sanctionedKw: settings.sanctionedKw, gruhaJyothi: settings.gruhaJyothi});
  const largest = [...appliances].sort((a, b) => b.watts * b.hoursPerDay - a.watts * a.hoursPerDay)[0];
  return <><AreaPicker/><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Stat label="Monthly units" value={Math.round(units)}/><Stat label="Estimated bill" value={inr(bill.payable)}/><Stat label="Peak draw" value={`${intervals.peakKw || 0} kW`}/></View><Card title="Usage breakdown"><Bar label="Meter usage" value={Math.round(Number(unitsSoFar) || 0)} max={Math.max(units, 1)} color="#1D4ED8"/><Bar label="Appliance plan" value={Math.round(applianceUnits)} max={Math.max(units, 1)} color="#10B981"/><Bar label="Subsidy ceiling" value={Math.min(units, 200)} max={200} color="#F59E0B"/><Text style={s.muted}>The 200-unit ceiling is a reference for planning.</Text></Card><Card title="Area signal"><View style={s.tableRow}><Text style={s.text}>Reliability score</Text><Text style={s.text}>{area.reliability_score}/100</Text></View><View style={s.tableRow}><Text style={s.text}>Average outage</Text><Text style={s.text}>{area.avg_weekly_outage_hours} h/week</Text></View><View style={s.tableRow}><Text style={s.text}>Recent alerts</Text><Text style={s.text}>{alerts.length}</Text></View></Card><Card title="Largest planned load">{largest?<Text style={s.text}><Text style={{fontWeight:'800'}}>{largest.name}</Text> contributes about {Math.round(largest.watts*largest.hoursPerDay*30/1000)} units/month.</Text>:<Text style={s.muted}>Add appliances to see load insights.</Text>}</Card></>;
}
