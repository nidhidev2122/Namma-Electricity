import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import BillDetective from './components/BillDetective.jsx';
import GruhaJyothi from './components/GruhaJyothi.jsx';
import Usage from './components/Usage.jsx';
import Pulse from './components/Pulse.jsx';
import SavingsCoach from './components/SavingsCoach.jsx';
import Ask from './components/Ask.jsx';
import Appliances from './components/Appliances.jsx';
import Bills from './components/Bills.jsx';
import RentBuy from './components/RentBuy.jsx';
import Complaints from './components/Complaints.jsx';
import Settings from './components/Settings.jsx';
import Analytics from './components/Analytics.jsx';
import Admin from './components/Admin.jsx';
import { Disclaimer } from './components/Common.jsx';
import Auth from './components/Auth.jsx';
import Welcome from './components/Welcome.jsx';
import Explore from './components/Explore.jsx';
import { useApp } from './ctx.jsx';

const HOME_LINKS = [
  ['home', 'Home'],
  ['explore', 'Explore'],
  ['calc', 'Bill Estimator'],
  ['about', 'About']
];
// Location mode is the map experience only; everything else lives in home mode.
const LOCATION_LINKS = [
  ['home', 'Map'],
  ['explore', 'Explore'],
  ['about', 'About']
];

function About() {
  return <section className="about-page"><span className="welcome-kicker"><i /> A CLEARER WAY TO USE ELECTRICITY</span><h2>Energy intelligence for<br /><em>real homes.</em></h2><p>Namma Electricity helps you understand your bill, your neighbourhood and the everyday choices that shape your energy use. It is designed to be useful before it asks you to sign in.</p><div className="about-points"><span><b>01</b><strong>Private first</strong><small>Your calculations can stay on this device.</small></span><span><b>02</b><strong>Plain language</strong><small>No tariff jargon or unnecessary charts.</small></span><span><b>03</b><strong>Actionable</strong><small>Every insight points to a next step.</small></span></div></section>;
}

export default function App() {
  const { user, setUser, authLoading, profilePhoto, settings } = useApp();
  const [tab, setTab] = useState(() => location.hash.slice(1) || 'home');
  const [offline, setOffline] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState('home');
  useEffect(() => { const t = setTimeout(() => setShowIntro(false), 1000); return () => clearTimeout(t); }, []);
  useEffect(() => { history.replaceState(null, '', '#' + tab); window.scrollTo(0, 0); }, [tab]);
  useEffect(() => { document.documentElement.dataset.theme = settings.theme || 'black'; }, [settings.theme]);

  if (showIntro) return <div className="power-intro" aria-label="Loading Namma Power"><div className="intro-grid" /><div className="intro-orbit intro-orbit-one" /><div className="intro-orbit intro-orbit-two" /><img className="intro-bolt" src="/namma-electricity-logo.png" alt="" /><strong>Namma Power</strong><span>See the energy behind your bill.</span></div>;
  if (authLoading) return <main className="auth-page"><p className="muted">Loading your workspace...</p></main>;
  if (!user && !offline && showAuth) return <Auth onAuthenticated={setUser} onOffline={() => { setShowAuth(false); setOffline(true); }} onBack={() => setShowAuth(false)} />;
  if (!user && !offline && showWelcome) return <Welcome onLogin={() => setShowAuth(true)} onEnter={next => { setMode(next === 'location' ? 'location' : 'home'); setTab('home'); setShowWelcome(false); setOffline(true); }} />;

  const locationMode = !user && mode === 'location';
  const TOP_LINKS = locationMode ? LOCATION_LINKS : HOME_LINKS;
  const navigate = (id) => { setShowWelcome(false); setShowAuth(false); setOffline(true); setMode('home'); setTab(id); };
  const homeView = locationMode ? <Pulse mode="location" /> : <Dashboard go={navigate} />;
  const view = locationMode ? ({ about: <About />, explore: <Explore /> }[tab] || homeView) : {
    home: <Dashboard go={navigate} />, bill: <BillDetective go={navigate} />, gj: <GruhaJyothi />, gruha: <GruhaJyothi />, usage: <Usage />,
    pulse: <Pulse mode="home" />, power: <Pulse mode="home" />, status: <Pulse mode="home" />, coach: <SavingsCoach />, ask: <Ask />, calc: <Bills />, timers: <Appliances />,
    analytics: <Analytics />, rent: <RentBuy />, complaints: <Complaints />, settings: <Settings />, admin: <Admin />, about: <About />, explore: <Explore />
  }[tab] || homeView;
  const openLink = (id) => {
    if (id === 'explore' && !user) { setShowWelcome(false); setShowAuth(false); setOffline(true); setMode('home'); setTab('explore'); return; }
    setTab(id);
  };

  return <div className="app-shell consumer-shell">
    <section className="app-main">
      <header className="simple-topbar">
        <button className="simple-brand" onClick={() => setTab('home')} aria-label="Go to home"><img src="/namma-electricity-logo.png" alt="" /><span><strong>Namma Electricity</strong><small>Energy, made clear.</small></span></button>
        <nav className="simple-nav" aria-label="Primary navigation">{TOP_LINKS.map(([id, label]) => <button key={id} className={tab === id || (id === 'home' && tab === 'home') ? 'active' : ''} onClick={() => openLink(id)}>{label}</button>)}</nav>
        <div className="simple-actions">{user ? <button className="simple-account" onClick={() => setTab('settings')}>{profilePhoto ? <img src={profilePhoto} alt="Profile" /> : <span>{(user.email || 'O').slice(0, 1).toUpperCase()}</span>} Account</button> : <button className="simple-login" onClick={() => setShowAuth(true)}>Log in <span>↗</span></button>}</div>
      </header>
      <main className="content">{view}</main>
      <Disclaimer />
    </section>
  </div>;
}
