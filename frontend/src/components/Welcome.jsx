import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaPicker, useArea } from './Common.jsx';
import { useApp } from '../ctx.jsx';

const EASE = [0.22, 1, 0.36, 1];

function ExplorationCard({ icon, title, description, accent, features, onClick, delay }) {
  return <motion.button className={`explore-card ${accent}`} onClick={onClick} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay, ease: EASE }} whileHover={{ y: -8, scale: 1.015 }} whileTap={{ scale: .985 }}>
    <span className="explore-card-icon" aria-hidden="true">{icon}</span><span className="explore-card-arrow">↗</span>
    <span className="explore-card-title">{title}</span><span className="explore-card-copy">{description}</span>
    <span className="explore-card-features">{features.map(item => <span key={item}><i />{item}</span>)}</span>
    <span className="explore-card-cta">Start exploring <b>→</b></span>
  </motion.button>;
}

function WelcomeLanding({ onSelect, onLogin }) {
  return <main className="welcome-page">
    
    <header className="welcome-nav"><div className="welcome-brand"><img src="/namma-electricity-logo.png" alt="" /><span><strong>Namma Electricity</strong><small>Energy, made clear.</small></span></div><button className="welcome-login" onClick={onLogin}>Log in <span>↗</span></button></header>
    <div className="welcome-content">
      <motion.div className="welcome-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: EASE }}>
        <span className="welcome-kicker"><i /> YOUR PERSONAL ENERGY INTELLIGENCE</span>
        <h1>Understand Your Energy.<br /><em>Make Smarter Choices.</em></h1>
        <p>Make sense of electricity in the way that matters to you — your neighbourhood or your home. Clear answers, useful actions, no jargon.</p>
      </motion.div>
      <div className="welcome-prompt"><span>01</span><h2>How would you like to explore?</h2><small>Choose a starting point. You can change it anytime.</small></div>
      <div className="explore-grid">
        <ExplorationCard icon="⌖" title="Explore by Location" description="Discover tariffs, schemes and power insights based on where you live." accent="location-card" delay={.18} features={['City & area insights', 'Tariffs & subsidies', 'Power reliability']} onClick={() => onSelect('location')} />
        <ExplorationCard icon="⌂" title="Explore Your Home" description="Understand your household usage, estimate bills and find simple savings." accent="home-card" delay={.3} features={['Bill estimates', 'Appliance insights', 'Personal savings ideas']} onClick={() => onSelect('home')} />
      </div>
      <div className="welcome-foot"><span><i className="privacy-pip" /> Explore as a guest — no sign-in required</span><span>Built for Bengaluru households <b>•</b> Works offline</span></div>
    </div>
  </main>;
}

function SetupHeader({ mode, onBack }) {
  return <div className="setup-header"><button className="setup-back" onClick={onBack}>← <span>Back</span></button><span className="setup-step">{mode === 'location' ? 'LOCATION-WISE' : 'HOME-WISE'} <i /></span></div>;
}

function LocationSetup({ onEnter, onBack }) {
  const area = useArea();
  const [detected, setDetected] = useState(false);
  const [detecting, setDetecting] = useState(false);
  function detectLocation() {
    setDetecting(true);
    if (!navigator.geolocation) { setDetecting(false); return; }
    navigator.geolocation.getCurrentPosition(() => { setDetected(true); setDetecting(false); }, () => { setDetected(false); setDetecting(false); }, { timeout: 6000 });
  }
  return <main className="welcome-page setup-page"><div className="setup-wrap"><SetupHeader mode="location" onBack={onBack} /><motion.section className="setup-panel" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .55, ease: EASE }}>
    <div className="setup-visual location-visual"><span>⌖</span><div><i /><i /><i /></div></div><span className="welcome-kicker"><i /> LOCATION-WISE EXPLORATION</span><h1>Start with where<br /><em>you live.</em></h1><p className="setup-intro">We’ll tune tariffs, schemes and power signals to your neighbourhood. Select an area below — precise address details are never needed.</p>
    <div className="setup-form"><AreaPicker /><button className="detect-location" onClick={detectLocation}>{detecting ? 'Checking permission…' : detected ? 'Location permission granted' : 'Use my current location'} <span>⌖</span></button></div>
    <div className="selection-note"><span className="note-icon">⌁</span><span><b>{area.division_name}</b> · BESCOM area insights ready<br /><small>{detected ? 'Your browser location was shared for this session only.' : 'You can explore manually without sharing your location.'}</small></span></div>
    <button className="btn btn-yellow setup-continue" onClick={() => onEnter('location')}>Explore {area.division_name} <span>→</span></button><button className="skip-setup" onClick={() => onEnter('location')}>Skip setup for now</button>
  </motion.section></div></main>;
}

function HomeSetup({ onEnter, onBack }) {
  const { setSettings } = useApp();
  const [type, setType] = useState('Apartment');
  const [people, setPeople] = useState('');
  function continueHome() { setSettings(prev => ({ ...prev, householdType: type, householdPeople: people ? Number(people) : null })); onEnter('home'); }
  return <main className="welcome-page setup-page"><div className="setup-wrap"><SetupHeader mode="home" onBack={onBack} /><motion.section className="setup-panel" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .55, ease: EASE }}>
    <div className="setup-visual home-visual"><span>⌂</span><div className="home-sun" /></div><span className="welcome-kicker"><i /> HOME-WISE EXPLORATION</span><h1>Make your home<br /><em>work smarter.</em></h1><p className="setup-intro">A few optional details help us shape better estimates and recommendations. Nothing here is required.</p>
    <div className="home-type-grid"><button className={type === 'Apartment' ? 'selected' : ''} onClick={() => setType('Apartment')}><span>▦</span><b>Apartment</b><small>Shared connection</small></button><button className={type === 'Independent House' ? 'selected' : ''} onClick={() => setType('Independent House')}><span>⌂</span><b>Independent house</b><small>Your own connection</small></button></div>
    <label className="field setup-people"><span>How many people live at home? <small>Optional</small></span><input type="number" min="1" max="20" placeholder="e.g. 3" value={people} onChange={event => setPeople(event.target.value)} /></label>
    <button className="btn btn-yellow setup-continue" onClick={continueHome}>See my home energy view <span>→</span></button><button className="skip-setup" onClick={() => onEnter('home')}>Skip setup for now</button>
  </motion.section></div></main>;
}

export default function Welcome({ onEnter, onLogin }) {
  const [step, setStep] = useState('landing');
  const [mode, setMode] = useState(null);
  return <AnimatePresence mode="wait">{step === 'landing' && <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><WelcomeLanding onSelect={next => { setMode(next); setStep('setup'); }} onLogin={onLogin} /></motion.div>}{step === 'setup' && mode === 'location' && <motion.div key="location" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LocationSetup onEnter={onEnter} onBack={() => setStep('landing')} /></motion.div>}{step === 'setup' && mode === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><HomeSetup onEnter={onEnter} onBack={() => setStep('landing')} /></motion.div>}</AnimatePresence>;
}
