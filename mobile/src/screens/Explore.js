import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { Card, Button, s } from '../components';
import { computeBill } from '../utils';

const guides = ['How your bill is built', 'Where your units go', 'Reading a Gruha Jyothi status', 'Power cuts and what the data means', 'Small changes that add up', 'Bill words, explained'];
export default function Explore() {
  const [guide, setGuide] = useState(null); const [units, setUnits] = useState(120);
  if (!guide) return <><Card title="Explore"><Text style={s.muted}>Plain-language guides. Numbers are estimates unless a source says otherwise.</Text>{guides.map(g => <Pressable key={g} onPress={() => setGuide(g)} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#262626' }}><Text style={s.text}>{g} →</Text></Pressable>)}</Card></>;
  const bill = computeBill({ units, sanctionedKw: 1 });
  return <><Button title="← Back to Explore" secondary onPress={() => setGuide(null)} /><Card title={guide}><Text style={s.text}>This short guide is for understanding, not a tariff ruling. Confirm with BESCOM / the official order.</Text>{guide === guides[0] && <><Text style={s.text}>Units: {units}</Text><View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Button title="−10" secondary onPress={() => setUnits(Math.max(0, units - 10))} /><Button title="+10" secondary onPress={() => setUnits(units + 10)} /></View><Text style={s.text}>Estimated energy and other charges: ₹{bill.gross}</Text></>}{guide === guides[2] && <Text style={s.text}>Entitlement is household-specific. Under 200 units is not automatically free. Verify against the official order.</Text>}{guide === guides[3] && <Text style={s.text}>Official notices and community reported signals are different. Community reported information is never confirmed.</Text>}{guide !== guides[0] && guide !== guides[2] && guide !== guides[3] && <Text style={s.text}>Check your bill; wording varies. Use the official source before acting.</Text>}</Card></>;
}
