import { useCallback, useEffect, useState } from 'react';
import { summarizeReports, officialStatus, nearestSubdivision, DISCLAIMER } from '@engine/index.js';
import { getPulse, submitPulseReport } from '../api.js';
import { SUBDIVISIONS } from '../data.js';
import { useApp } from '../ctx.jsx';
import { Card, useArea, OfficialLinks } from './Common.jsx';
import MapView from './MapView.jsx';

const KINDS = [['outage', 'Power is out'], ['voltage', 'Voltage problem'], ['restored', 'Power is back']];
const nowLocal = () => { const d = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16); };
const fmt = iso => iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null;

export default function Pulse({ mode = 'home' }) {
  const { setAreaId, areaId } = useApp();
  const area = useArea();
  const [pulse, setPulse] = useState(null);
  const [geo, setGeo] = useState('');
  const [kind, setKind] = useState('outage');
  const [startedAt, setStartedAt] = useState(nowLocal());
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = useCallback(() => getPulse(area.id).then(data => { setPulse(data || { official: [], reports: [], offline: true }); setLoadError(''); }).catch(() => { setPulse({ official: [], reports: [], offline: true }); setLoadError('Live data is unavailable, so Power Status is showing local/offline data.'); }), [area.id]);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  const community = pulse ? summarizeReports(pulse.reports) : null;
  const official = pulse ? officialStatus(pulse.official) : null;

  function locate() {
    if (!navigator.geolocation) return setGeo('Location is not available in this browser. Pick your area from the list.');
    setGeo('Finding your area...');
    navigator.geolocation.getCurrentPosition(pos => {
      const n = nearestSubdivision(pos.coords.latitude, pos.coords.longitude, SUBDIVISIONS);
      if (!n || n.outside) return setGeo('You appear to be outside the areas covered here. Pick an area from the list.');
      setAreaId(n.area.id);
      setGeo(`Nearest covered area: ${n.area.division_name} (about ${n.km} km away). Your location was used on this device only and not saved or sent.`);
    }, () => setGeo('Location permission was not given. Pick your area from the list instead.'), { timeout: 10000, maximumAge: 300000 });
  }

  async function send() {
    try {
      await submitPulseReport({ subdivisionId: area.id, kind, note, areaLabel: label, startedAt: kind === 'restored' ? null : new Date(startedAt).toISOString() });
      setNote(''); setLabel(''); setStatus('Thanks. Your report is added as an unverified community report.'); load();
    } catch (e) { setStatus(e.message); }
  }

  return (
    <div className="stack">
      <Card title="Your area">
        <div className="grid2" style={{ alignItems: 'end' }}>
          <label className="field"><span>Bengaluru area</span>
            <select value={areaId} onChange={e => setAreaId(e.target.value)}>{SUBDIVISIONS.map(s => <option key={s.id} value={s.id}>{s.division_name} ({s.subdivision_code})</option>)}</select></label>
          <div><button className="btn btn-alt" onClick={locate}>Use my location (optional)</button></div>
        </div>
        {geo && <p className="muted" style={{ margin: '6px 0 0' }}>{geo}</p>}
        {loadError && <p className="muted" role="status" style={{ margin: '6px 0 0' }}>{loadError}</p>}
      </Card>

      {mode === 'location' && <MapView />}

      {mode !== 'location' && (
        <>
          <div className="cols">
            <Card title="Official information" right={<span className="tag official">Official</span>}>
              {!pulse ? <p className="muted">Loading...</p> : official.empty ? (
                <><p>{official.emptyText}</p><OfficialLinks ids={['bescom']} /></>
              ) : (
                <>
                  {[['Happening now', official.current], ['Upcoming', official.upcoming], ['Recently ended', official.recent]].filter(([, l]) => l.length).map(([h, list]) => (
                    <div key={h}><b>{h}</b>
                      {list.map(n => (
                        <div key={n.id} className="alert blue">
                          <b>{{ planned: 'Planned work', unplanned: 'Unplanned outage', advisory: 'Advisory' }[n.kind]}</b>
                          <div>{n.description}</div>
                          <small>{n.starts_at ? `From ${fmt(n.starts_at)}` : ''}{n.ends_at ? ` to ${fmt(n.ends_at)}` : ''} · Source: <a href={n.source_url} target="_blank" rel="noreferrer noopener">{n.source_name}</a> · Published {fmt(n.published_at)}</small>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
              {pulse?.offline && <small>Offline: official notices need the server connection.</small>}
            </Card>

            <Card title="What residents are reporting" right={<span className="tag community">Community, unverified</span>}>
              {community && (
                <>
                  <p><span className={`pulse-dot ${community.counts.outage ? '' : 'quiet'}`} /><b>{community.headline}</b></p>
                  {community.confidenceNote && <p className="muted">{community.confidenceNote}</p>}
                  {community.areaLabels.length > 0 && <p className="muted">Mentioned: {community.areaLabels.map(a => `${a.label} (${a.n})`).join(', ')}</p>}
                  <div className="alert"><b>Read this first.</b> {DISCLAIMER}</div>
                </>
              )}
            </Card>
          </div>

          <div className="cols">
            <Card title="Report a power cut">
              <div className="chips">{KINDS.map(([id, l]) => <button key={id} className={`chip ${id === kind ? 'on' : ''}`} onClick={() => setKind(id)}>{l}</button>)}</div>
              {kind !== 'restored' && <label className="field"><span>When did it start?</span><input type="datetime-local" value={startedAt} max={nowLocal()} onChange={e => setStartedAt(e.target.value)} /></label>}
              <label className="field"><span>Approximate area (street, block or landmark)</span><input maxLength={80} value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. HSR Layout sector 2" /><small>No names, phone numbers or house numbers.</small></label>
              <label className="field"><span>Note (optional)</span><input maxLength={200} value={note} onChange={e => setNote(e.target.value)} /></label>
              <button className="btn" onClick={send}>Submit report</button>
              {status && <p role="status">{status}</p>}
              <small>Limited to 5 reports an hour to keep the feed trustworthy. Sign-in may be required when connected to the server.</small>
            </Card>

            <Card title="Report timeline (last 24 hours)">
              {community && !community.items.length && <p className="muted">No reports yet in {area.division_name}.</p>}
              {community?.items.slice(0, 12).map(r => (
                <div key={r.id} className="row">
                  <div><b>{KINDS.find(k => k[0] === r.kind)?.[1]}</b>{r.area_label && <> · {r.area_label}</>}
                    {r.note && <div className="muted">{r.note}</div>}
                    {r.startedText && <small>Said it started {r.startedText}</small>}</div>
                  <small title={fmt(r.created_at)}>Reported {r.ageText}</small>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
