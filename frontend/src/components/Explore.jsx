import { useMemo, useState } from 'react';
import { Card } from './Common.jsx';
import { APPLIANCE_PRESETS } from '../data.js';
import { computeBill, inr, monthlyUnits } from '../utils.js';
import { OFFICIAL_LINKS, TARIFF } from '@engine/tariff.js';

const GUIDES = [
  ['bill', 'How your bill is built', 'See the parts behind an estimate: fixed charge, energy, duty, other charges and any subsidy credit.'],
  ['units', 'Where your units go', 'Toggle typical appliances and change their hours to understand an estimated monthly share.'],
  ['gj', 'Reading a Gruha Jyothi status', 'Understand what entitlement means and why an over-entitlement bill needs checking.'],
  ['pulse', 'Power cuts and what the data means', 'Separate official notices from community reported signals and corroboration levels.'],
  ['habits', 'Small changes that add up', 'Try habit what-ifs. These are estimates, not promises about a future bill.'],
  ['words', 'Bill words, explained', 'A short glossary for the words you may see on a BESCOM bill.']
];

function SourceNote({ href = OFFICIAL_LINKS.bescom }) {
  return <p className="explore-source"><strong>Check this yourself:</strong> <a href={href} target="_blank" rel="noreferrer">official BESCOM / Seva Sindhu source</a>. Rates are working rates, not a verified copy of the KERC order. Confirm with BESCOM / the official order.</p>;
}

function Guide({ id }) {
  const [units, setUnits] = useState(120);
  const [selected, setSelected] = useState(() => new Set([APPLIANCE_PRESETS[0].name]));
  const [hours, setHours] = useState({ [APPLIANCE_PRESETS[0].name]: APPLIANCE_PRESETS[0].hoursPerDay });
  const bill = computeBill({ units, sanctionedKw: 1, gruhaJyothi: false });
  const applianceUnits = useMemo(() => monthlyUnits(APPLIANCE_PRESETS.filter(a => selected.has(a.name)).map(a => ({ ...a, hoursPerDay: hours[a.name] ?? a.hoursPerDay }))), [selected, hours]);

  if (id === 'bill') return <Card title="Move the units slider"><label className="field"><span>Monthly use: <b>{units} units</b></span><input aria-label="Monthly units" type="range" min="0" max="500" value={units} onChange={e => setUnits(Number(e.target.value))} /></label><div className="explore-breakdown">{[['Energy charge', bill.energy], ['Fixed charge', bill.fixed], ['Duty', bill.duty], ['Other charges', bill.pg + bill.fppca]].map(([label, value]) => <div key={label}><span>{label}</span><b>{inr(value)}</b></div>)}<div className="total"><span>Estimate before subsidy</span><b>{inr(bill.gross)}</b></div></div><p className="muted">Subsidy credit depends on your actual entitlement; under 200 units is never shown here as automatically free.</p><SourceNote /></Card>;
  if (id === 'units') return <Card title="Toggle appliances and hours"><p className="muted">Estimated monthly total: <b>{applianceUnits} units</b>. Typical appliance figures are estimates.</p>{APPLIANCE_PRESETS.map(a => <div className="explore-appliance" key={a.name}><label className="check"><input type="checkbox" checked={selected.has(a.name)} onChange={() => setSelected(prev => { const next = new Set(prev); next.has(a.name) ? next.delete(a.name) : next.add(a.name); return next; })} /><span>{a.name}</span></label><input aria-label={`${a.name} hours per day`} type="number" min="0" max="24" step="0.5" value={hours[a.name] ?? a.hoursPerDay} onChange={e => setHours(prev => ({ ...prev, [a.name]: Number(e.target.value) || 0 }))} /><small>h/day</small></div>)}<SourceNote /></Card>;
  if (id === 'gj') return <Card title="Entitlement is not the same as a guarantee"><p>An entitlement is the household-specific figure used to assess a subsidy. If your use goes over it, the billing treatment needs checking against the official order and your bill.</p><p className="alert">Every Gruha Jyothi rule shown here is <strong>to verify against the official order</strong>. Never treat an app estimate as confirmation.</p><p><a href={OFFICIAL_LINKS.sevaSindhu} target="_blank" rel="noreferrer">Open Seva Sindhu</a> · <a href={OFFICIAL_LINKS.bescom} target="_blank" rel="noreferrer">Open BESCOM</a></p><SourceNote href={OFFICIAL_LINKS.sevaSindhu} /></Card>;
  if (id === 'pulse') return <Card title="Two kinds of signal"><div className="explore-signal official"><b>Official notice</b><span>Published by an authority with a source. Check the source and date.</span></div><div className="explore-signal community"><b>Community reported</b><span>A resident signal that may help corroborate a pattern; it is never confirmed by this app.</span></div><p>Corroboration means multiple reports agree in time or area. It does not tell you restoration time, safety, or the cause.</p><SourceNote /></Card>;
  if (id === 'habits') return <Card title="Try a small change"><Habit label="Fan: reduce by" base={75} hours={8} /><Habit label="Water heater: reduce by" base={3000} hours={0.5} /><SourceNote /></Card>;
  return <Card title="Glossary"><dl className="explore-glossary"><dt>Energy charge</dt><dd>Charge linked to units used, often shown by slab. Check your bill; wording varies.</dd><dt>Fixed charge</dt><dd>A charge linked to sanctioned load. Check your bill; wording varies.</dd><dt>Duty</dt><dd>A statutory charge included in the estimate. Check your bill; wording varies.</dd><dt>Subsidy credit</dt><dd>A credit or waiver shown by the provider when applicable. Check your bill; wording varies.</dd></dl><SourceNote /></Card>;
}

function Habit({ label, base, hours }) {
  const [reduction, setReduction] = useState(1);
  const units = Math.round((base * Math.max(0, hours - reduction) * 30 / 1000) * 100) / 100;
  return <div className="explore-habit"><label className="field"><span>{label} <b>{reduction} hour/day</b></span><input type="range" min="0" max={hours} step="0.5" value={reduction} onChange={e => setReduction(Number(e.target.value))} /></label><p><strong>Estimate:</strong> about {units} fewer units/month at this load.</p></div>;
}

export default function Explore({ initialGuide = null }) {
  const [guide, setGuide] = useState(initialGuide);
  if (guide) return <section className="explore-page"><button className="link explore-back" onClick={() => setGuide(null)}>← Back to Explore</button><span className="welcome-kicker"><i /> PLAIN-LANGUAGE GUIDE</span><h1>{GUIDES.find(g => g[0] === guide)?.[1]}</h1><p className="explore-lede">{GUIDES.find(g => g[0] === guide)?.[2]}</p><Guide id={guide} /></section>;
  return <section className="explore-page"><span className="welcome-kicker"><i /> UNDERSTAND YOUR ENERGY</span><h1>Explore</h1><p className="explore-lede">Short guides, one useful interaction at a time. Every number is an estimate unless the source says otherwise.</p><div className="explore-guide-grid">{GUIDES.map(([id, title, copy]) => <button key={id} className="explore-guide-card" onClick={() => setGuide(id)}><strong>{title}</strong><span>{copy}</span><b>Read guide →</b></button>)}</div></section>;
}
