import subdivisions from './subdivisions.json';

// Illustrative figures, not official BESCOM statistics. Replace via the API/database as real data arrives.
export const SUBDIVISIONS = subdivisions;

export const RISK_LABEL = { high: 'High outage', medium: 'Medium outage', low: 'Low outage' };

export const APPLIANCE_PRESETS = [
  { name: 'Instant geyser', watts: 3000, hoursPerDay: 0.5 },
  { name: 'AC 1.5 ton', watts: 1500, hoursPerDay: 6 },
  { name: 'Induction cooktop', watts: 1800, hoursPerDay: 1 },
  { name: 'Water pump', watts: 1100, hoursPerDay: 0.5 },
  { name: 'EV charger', watts: 3300, hoursPerDay: 3, ev: true }
];

// Loads people usually keep on the inverter (watts are typical, not measured)
export const BACKUP_LOADS = [
  { id: 'fan', name: 'Ceiling fan', watts: 75 },
  { id: 'led', name: 'LED lights (5)', watts: 50 },
  { id: 'wifi', name: 'Wi-Fi router', watts: 15 },
  { id: 'fridge', name: 'Refrigerator', watts: 150 },
  { id: 'tv', name: 'TV', watts: 100 },
  { id: 'laptop', name: 'Laptop', watts: 65 }
];

export const COMPLAINT_TYPES = [
  {
    id: 'meter',
    label: 'Meter reader did not come',
    text: 'Hello BESCOM, the meter reader has not visited my premises in {area} sub-division ({code}) for this billing cycle. Please arrange a reading and correct the bill. Consumer account: {account}.'
  },
  {
    id: 'average',
    label: 'Average billing dispute',
    text: 'Hello BESCOM, I have been billed on an average reading in {area} sub-division ({code}) although the meter is working. Please send the actual reading and revise the bill. Consumer account: {account}.'
  },
  {
    id: 'voltage',
    label: 'Voltage fluctuation',
    text: 'Hello BESCOM, we are seeing repeated low/high voltage in {area} ({code}), which is damaging appliances. Please inspect the transformer and feeder. Consumer account: {account}.'
  },
  {
    id: 'neutral',
    label: 'Neutral line break (rain)',
    text: 'Hello BESCOM, there is a suspected neutral line break in {area} ({code}) after rain. Live parts are a safety risk. Please send a lineman urgently. Consumer account: {account}.'
  }
];

export const TENANT_STEPS = [
  'Ask the landlord for the electricity account (RR) number of the house and check the meter is in the landlord\u2019s name.',
  'Keep your own Aadhaar and the rental agreement ready. Enter them only on the official Seva Sindhu site, never in this app.',
  'On Seva Sindhu, apply for Gruha Jyothi for the rented house and choose the tenant option.',
  'Ask the landlord to confirm on the portal if it is asked for, then note the application number for follow-up.',
  'Check your next bill: usage up to 200 units should show a zero payable amount.'
];

export const COACH_TIPS = {
  high: [
    'Run the geyser and pump before 8 AM or after 9 PM so they are not caught mid-cycle in a trip.',
    'Fit a surge protector on the fridge and TV; monsoon voltage swings are common here.',
    'Keep the inverter battery water topped up every two months.'
  ],
  medium: [
    'Charge phones, power banks and the inverter the evening before a Tuesday shutdown.',
    'Shift washing and pumping out of the late-evening peak to ease feeder load.'
  ],
  low: [
    'A full inverter is optional here; a small UPS for the router covers most short trips.',
    'Focus on cutting AC hours to stay under the 200-unit subsidy line.'
  ]
};
