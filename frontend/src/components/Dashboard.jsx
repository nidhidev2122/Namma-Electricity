import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../ctx.jsx';
import { useArea, RiskBadge } from './Common.jsx';
import { computeBill, inr, monthlyUnits } from '../utils.js';

function LiveSignal() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  return <div className="live-signal"><motion.i animate={{ opacity: [.35, 1, .35], scale: [.88, 1.12, .88 ] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} /><span>LIVE GRID SIGNAL</span><b>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</b></div>;
}

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  return <motion.span key={String(value)} initial={{ opacity: .2, y: 8, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: .45, ease: [.22, 1, .36, 1] }}>{prefix}{value}{suffix}</motion.span>;
}

function EnergyWave() {
  return <div className="energy-wave" aria-hidden="true"><svg viewBox="0 0 620 210" preserveAspectRatio="none"><motion.path d="M0 145 C70 145 70 48 145 48 S205 169 282 169 S360 24 430 45 S505 153 620 74" /><motion.path className="wave-ghost" d="M0 164 C70 164 70 67 145 67 S205 188 282 188 S360 43 430 64 S505 172 620 93" /></svg><span className="wave-node node-1" /><span className="wave-node node-2" /><span className="wave-node node-3" /></div>;
}

export default function Dashboard({ go }) {
  const { settings, unitsSoFar, appliances, user, budget } = useApp();
  const area = useArea();
  const units = Math.max(unitsSoFar, monthlyUnits(appliances));
  const bill = computeBill({ units, sanctionedKw: settings.sanctionedKw, gruhaJyothi: settings.gruhaJyothi, entitlementUnits: settings.entitlementUnits || null });
  const budgetValue = Number(budget) || 1000;
  const budgetPct = Math.min(100, Math.round((bill.payable / budgetValue) * 100));
  const displayName = user?.display_name?.split(' ')[0];

  return <div className="consumer-home">
    <section className="consumer-hero live-hero"><div className="hero-grid" /><EnergyWave /><div className="consumer-hero-copy"><LiveSignal /><h1>{displayName ? `Namaskara, ${displayName}.` : 'A clearer view of your energy.'}</h1><p>See what your home is using, what your bill may look like, and where a small change could help.</p></div><motion.div className="consumer-spark" animate={{ rotate: [-10, -7, -10], scale: [1, 1.035, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}><span>THIS MONTH</span><strong><AnimatedNumber value={Math.round(units)} /></strong><small>units used</small><i /><i /><i /></motion.div></section>
    <section className="consumer-summary live-summary"><div><span className="eyebrow">ESTIMATED ELECTRICITY BILL</span><strong><AnimatedNumber prefix="₹" value={bill.payable} /></strong><p>Working estimate for this month · {Math.round(units)} units</p></div><div className="summary-progress"><div><span>Budget used</span><b><AnimatedNumber value={budgetPct} suffix="%" /></b></div><div className="budget-track"><motion.span initial={{ width: 0 }} animate={{ width: `${budgetPct}%` }} transition={{ duration: 1.1, delay: .15, ease: [.22, 1, .36, 1] }} /></div><button className="link" onClick={() => go('calc')}>Change my budget <span>→</span></button></div></section>
    <section className="consumer-context"><div><span className="eyebrow">YOUR LOCAL POWER VIEW</span><h2>{area.division_name}</h2><p>Tariffs, subsidies and local reliability information are available for your area.</p></div><RiskBadge level={area.outage_risk_level} /><button className="link" onClick={() => go('pulse')}>View local power information <span>→</span></button></section>
    <section className="consumer-actions"><div className="section-heading"><div><span className="eyebrow">WHAT WOULD YOU LIKE TO DO?</span><h2>Make a smarter choice.</h2></div></div><div className="consumer-action-grid"><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('calc')}><span className="action-icon">₹</span><strong>Estimate my bill</strong><p>Use your units to understand what you may pay.</p><b>→</b></motion.button><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('usage')}><span className="action-icon teal">↗</span><strong>Understand my usage</strong><p>See which appliances shape your monthly energy.</p><b>→</b></motion.button><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('bill')}><span className="action-icon">🔍</span><strong>Check my bill</strong><p>Spot errors and surprises in a bill you received.</p><b>→</b></motion.button><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('gj')}><span className="action-icon">🏠</span><strong>Gruha Jyothi</strong><p>See how the free-units scheme affects your bill.</p><b>→</b></motion.button><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('coach')}><span className="action-icon">💡</span><strong>Savings coach</strong><p>Get a simple plan to cut your monthly cost.</p><b>→</b></motion.button><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('ask')}><span className="action-icon">💬</span><strong>Ask Namma</strong><p>Ask plain-language questions about your electricity.</p><b>→</b></motion.button><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('timers')}><span className="action-icon">⏱</span><strong>Appliance timers</strong><p>Track running appliances and get long-use alerts.</p><b>→</b></motion.button><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('analytics')}><span className="action-icon">📊</span><strong>Analytics</strong><p>Usage, bill and peak draw at a glance.</p><b>→</b></motion.button><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('rent')}><span className="action-icon">🔑</span><strong>Rent or buy</strong><p>Check an area’s power before renting or buying a home.</p><b>→</b></motion.button><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('pulse')}><span className="action-icon">⚡</span><strong>Power status</strong><p>Official notices and what neighbours report.</p><b>→</b></motion.button><motion.button whileHover={{ y: -5 }} whileTap={{ scale: .98 }} onClick={() => go('complaints')}><span className="action-icon">📝</span><strong>Complaints</strong><p>Report a problem with your supply or service.</p><b>→</b></motion.button></div></section>
    <section className="consumer-note"><span>⌁</span><p><strong>Private by design.</strong> Your calculations can stay on this device. Sign in only when you want to save a personal workspace.</p><button className="link" onClick={() => go('settings')}>Learn more <span>→</span></button></section>
  </div>;
}
