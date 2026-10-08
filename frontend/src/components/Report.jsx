import { useCallback, useEffect, useState } from 'react';
import { getReports, submitReport } from '../api.js';
import { Card, AreaPicker, useArea } from './Common.jsx';
import { nextTuesday } from '../utils.js';

const KINDS = [
  { id: 'outage', label: 'Power is out' },
  { id: 'voltage', label: 'Voltage problem' },
  { id: 'restored', label: 'Power is back' }
];

const ago = iso => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

export default function Report() {
  const area = useArea();
  const [kind, setKind] = useState('outage');
  const [note, setNote] = useState('');
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('');
  const load = useCallback(() => getReports(area.id).then(setReports), [area.id]);

  useEffect(() => { load(); }, [load]);

  async function send() {
    try {
      await submitReport({ subdivisionId: area.id, kind, note });
      setNote('');
      setStatus('Thanks, your report is in.');
      load();
    } catch (e) {
      setStatus(e.message);
    }
  }

  return (
    <div className="stack">
      <AreaPicker />
      <Card title="Report a problem">
        <div className="chips">
          {KINDS.map(k => (
            <button key={k.id} className={`chip ${k.id === kind ? 'on' : ''}`} onClick={() => setKind(k.id)}>{k.label}</button>
          ))}
        </div>
        <label className="field"><span>Street or landmark (optional, no personal details)</span>
          <input maxLength={200} value={note} onChange={e => setNote(e.target.value)} /></label>
        <button className="btn" onClick={send}>Submit</button>
        {status && <p>{status}</p>}
        <small>Limited to 5 reports an hour to keep the feed trustworthy.</small>
      </Card>
      <Card title={`Last 24 hours in ${area.division_name}`}>
        <p className="muted">
          Maintenance notice: planned work usually falls on Tuesdays ({nextTuesday().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} next).
        </p>
        {!reports.length && <p className="muted">No reports yet.</p>}
        {reports.map(r => (
          <div key={r.id} className="alert">
            <b>{KINDS.find(k => k.id === r.kind)?.label}</b> <small>{ago(r.created_at)}</small>
            {r.note && <div>{r.note}</div>}
          </div>
        ))}
      </Card>
    </div>
  );
}
