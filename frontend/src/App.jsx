import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import MapView from './components/MapView.jsx';
import Appliances from './components/Appliances.jsx';
import Bills from './components/Bills.jsx';
import Coach from './components/Coach.jsx';
import RentBuy from './components/RentBuy.jsx';
import Complaints from './components/Complaints.jsx';
import Report from './components/Report.jsx';
import Settings from './components/Settings.jsx';
import Analytics from './components/Analytics.jsx';
import Admin from './components/Admin.jsx';
import { Disclaimer } from './components/Common.jsx';
import Auth from './components/Auth.jsx';
import { useApp } from './ctx.jsx';

const TABS = [
  ['home', '⌂', 'Home'], ['map', '⌖', 'Outage map'], ['appliances', '⚡', 'Appliances'], ['bills', '₹', 'Bills'],
  ['analytics', '▥', 'Analytics'], ['coach', '✦', 'Coach'], ['report', '!', 'Report'], ['rent', '⌂', 'Rent / Buy'], ['complaints', '✓', 'Complaints'], ['settings', '⚙', 'Settings']
];

export default function App() {
  const { user, setUser, authLoading, profilePhoto } = useApp();
  const [tab, setTab] = useState('home');
  const [offline, setOffline] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const tabs = user?.role === 'admin' ? [...TABS, ['admin', '◆', 'Admin']] : TABS;
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 1600);
    return () => clearTimeout(timer);
  }, []);
  if (showIntro) return <div className="power-intro" aria-label="Loading NammaPower">
    <div className="intro-orbit intro-orbit-one" />
    <div className="intro-orbit intro-orbit-two" />
    <div className="intro-sparks" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => <span key={index} />)}
    </div>
    <img className="intro-bolt" src="/nammapower-lightning.svg" alt="" />
    <strong>NammaPower</strong>
    <span>Powering clearer decisions</span>
  </div>;
  if (authLoading) return <main className="auth-page"><p className="muted">Loading your workspace...</p></main>;
  if (!user && !offline) return <Auth onAuthenticated={setUser} onOffline={() => setOffline(true)} />;
  const view = {
    home: <Dashboard go={setTab} />,
    map: <MapView />,
    appliances: <Appliances />,
    bills: <Bills />,
    coach: <Coach />,
    report: <Report />,
    rent: <RentBuy />,
    complaints: <Complaints />,
    settings: <Settings />
    ,analytics: <Analytics />,
    admin: <Admin />
  }[tab];
  const active = tabs.find(t => t[0] === tab);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img className="brand-mark" src="/nammapower-lightning.svg" alt="" /><div><strong>NammaPower</strong><small>Energy OS · Bengaluru</small></div></div>
        <nav className="side-nav" aria-label="Primary navigation">
          {tabs.map(([id, icon, label]) => <button key={id} className={id === tab ? 'active' : ''} onClick={() => setTab(id)}><span>{icon}</span>{label}</button>)}
        </nav>
        <div className="side-note"><b>Private by design</b><span>No Aadhaar, phone, name or consumer ID is stored.</span></div>
      </aside>
      <section className="app-main">
        <header className="topbar">
          <div><span className="eyebrow">NammaPower workspace</span><h1>{active?.[2]}</h1></div>
          <div className="topbar-actions">
            <button className="account-link" onClick={() => setTab('settings')} aria-label="Open account settings">
              {profilePhoto ? <img className="account-avatar" src={profilePhoto} alt="Profile" /> : <span className="account-avatar">{(user?.email || 'O').slice(0, 1).toUpperCase()}</span>}
              <span>{user?.display_name || user?.email || 'Offline demo'}</span>
            </button>
            <div className="status-pill"><i /> Offline-first · API optional</div>
          </div>
        </header>
        <main className="content">{view}</main>
        <Disclaimer />
      </section>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {TABS.slice(0, 5).map(([id, icon, label]) => <button key={id} className={id === tab ? 'active' : ''} onClick={() => setTab(id)}><span>{icon}</span><small>{label}</small></button>)}
      </nav>
    </div>
  );
}
