import { useMemo, useState } from 'react';
import { analyzeBill, extractBillFields, inr } from '@engine/index.js';
import { useApp } from '../ctx.jsx';
import { Card, NumField, QualityTag, OfficialLinks } from './Common.jsx';

const COLORS = { usage: '#5b3fd6', rate: '#ffb020', fixed: '#8f7af0', tax: '#b7a8f5', other: '#e04a56', credit: '#0f9d7a' };
const LINES = [['energy', 'Energy charge'], ['fixed', 'Fixed charge'], ['pg', 'P&G surcharge'], ['fppca', 'FPPCA'], ['duty', 'Electricity duty'], ['other', 'Arrears / other'], ['subsidy', 'Subsidy credit']];
const EMPTY = { units: '', payable: '', days: '', energy: '', fixed: '', pg: '', fppca: '', duty: '', other: '', subsidy: '', prevReading: '', currReading: '' };
const SAMPLE = {
  current: { units: 210, payable: 1825.5, days: 31, energy: 1218, fixed: 300, pg: 73.5, fppca: 79.8, duty: 154.2 },
  previous: { units: 150, payable: 1394.6, days: 30, energy: 870, fixed: 300, pg: 52.5, fppca: 57, duty: 115.1 }
};

function BillForm({ title, which, value, onChange }) {
  const [more, setMore] = useState(false);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k, v) => onChange({ ...value, [k]: v });
  function extract(text) {
    const { fields, found } = extractBillFields(text);
    if (!found) return setMsg('Could not find bill figures in that text. Type them in instead.');
    const next = { ...value };
    Object.entries(fields).forEach(([k, v]) => { if (v !== null) next[k === 'arrears' ? 'other' : k] = v; });
    onChange(next); setMore(true);
    setMsg(`Filled ${found} field${found > 1 ? 's' : ''}. Check each against your bill before trusting the result.`);
  }
  return (
    <Card title={title}>
      <div className="grid2">
        <NumField label="Units consumed" value={value.units} onChange={v => set('units', v)} placeholder="e.g. 210" />
        <NumField label="Total payable (₹)" value={value.payable} onChange={v => set('payable', v)} placeholder="e.g. 1825.50" />
      </div>
      <button className="link" onClick={() => setMore(!more)}>{more ? 'Hide' : 'Add'} charge lines, billing days and readings</button>
      {more && (
        <div className="grid2">
          <NumField label="Billing days" value={value.days} onChange={v => set('days', v)} />
          {LINES.map(([k, l]) => <NumField key={k} label={`${l} (₹)`} value={value[k]} onChange={v => set(k, v)} />)}
          <NumField label="Previous meter reading" value={value.prevReading} onChange={v => set('prevReading', v)} />
          <NumField label="Current meter reading" value={value.currReading} onChange={v => set('currReading', v)} />
        </div>
      )}
      <details style={{ marginTop: 8 }}>
        <summary className="muted" style={{ cursor: 'pointer' }}>Paste bill text instead</summary>
        <textarea rows={4} value={paste} onChange={e => setPaste(e.target.value)} placeholder="Paste the text of your bill, e.g. from the BESCOM PDF or SMS" />
        <div className="row-actions" style={{ marginTop: 6 }}>
          <button className="btn btn-alt" onClick={() => extract(paste)}>Read figures</button>
          <label className="btn btn-alt" style={{ cursor: 'pointer' }}>Open a .txt file
            <input type="file" accept=".txt,.csv,text/plain" hidden onChange={e => e.target.files?.[0]?.text().then(t => { setPaste(t); extract(t); })} />
          </label>
        </div>
        <small>Photos and scanned PDFs are not read. Type the figures or paste text; nothing is uploaded or saved.</small>
        {msg && <p className="warn" style={{ margin: '6px 0 0' }}>{msg}</p>}
      </details>
    </Card>
  );
}

export default function BillDetective({ go }) {
  const { settings, setSettings, billInputs, setBillInputs } = useApp();
  const [cur, setCur] = useState(billInputs?.current || EMPTY);
  const [prev, setPrev] = useState(billInputs?.previous || EMPTY);
  const [open, setOpen] = useState(null);
  const save = (c, p) => setBillInputs({ current: c, previous: p });
  const upd = (which, v) => { which === 'c' ? setCur(v) : setPrev(v); which === 'c' ? save(v, prev) : save(cur, v); };
  const hasPrev = prev.units !== '' && prev.units !== undefined;

  const result = useMemo(() => analyzeBill({ current: cur, previous: hasPrev ? prev : null, sanctionedKw: settings.sanctionedKw, gruhaJyothi: settings.gruhaJyothi }), [cur, prev, hasPrev, settings.sanctionedKw, settings.gruhaJyothi]);
  const cmp = result.ok ? result.comparison : null;
  const total = cmp?.drivers.reduce((s, d) => s + Math.abs(d.amount), 0) || 1;

  return (
    <div className="stack">
      {cmp ? (
        <div className={`hero-delta ${cmp.total < 0 ? 'down' : ''}`} aria-live="polite">
          <span className="tag">{result.labels.basis.startsWith('Based on the charge') ? 'From your bills' : 'Includes estimates'}</span>
          <div className="display">{cmp.total >= 0 ? '+' : '−'}{inr(Math.round(Math.abs(cmp.total)))}</div>
          <p>{result.headline} {cmp.drivers[0] ? `The biggest piece: ${cmp.drivers[0].label.toLowerCase()}.` : ''}</p>
        </div>
      ) : (
        <div className="hero-delta">
          <span className="tag">Bill Detective</span>
          <div className="display">Why did my bill change?</div>
          <p>{result.ok ? result.headline : 'Enter this month\'s units and total, plus last month\'s, and we\'ll split the change into usage, rates and other charges.'}</p>
          <div className="row-actions" style={{ marginTop: 14 }}>
            <button className="btn btn-fil" onClick={() => { const c = { ...EMPTY, ...SAMPLE.current }, p = { ...EMPTY, ...SAMPLE.previous }; setCur(c); setPrev(p); save(c, p); setSettings({ ...settings, sanctionedKw: 2 }); }}>Try a sample bill</button>
          </div>
        </div>
      )}

      <div className="cols">
        <BillForm title="This bill" which="c" value={cur} onChange={v => upd('c', v)} />
        <BillForm title="Last bill" which="p" value={prev} onChange={v => upd('p', v)} />
      </div>
      <div className="grid2" style={{ maxWidth: 520 }}>
        <NumField label="Sanctioned load (kW)" value={settings.sanctionedKw} min={0.5} step={0.5} onChange={v => setSettings({ ...settings, sanctionedKw: Number(v) || 1 })} hint="On your bill, used for fixed-charge checks" />
        <label className="check" style={{ alignSelf: 'end' }}><input type="checkbox" checked={settings.gruhaJyothi} onChange={e => setSettings({ ...settings, gruhaJyothi: e.target.checked })} /> I am registered for Gruha Jyothi</label>
      </div>

      {result.ok && cmp && (
        <div className="cols">
          <Card title="What changed" right={<QualityTag q={cmp.basis} />}>
            <div className="seg" role="img" aria-label="Share of each driver">
              {cmp.drivers.map(d => <i key={d.id} style={{ flex: Math.abs(d.amount) / total, background: COLORS[d.id], opacity: open && open !== d.id ? 0.35 : 1 }} title={d.label} />)}
            </div>
            {cmp.drivers.map(d => (
              <div key={d.id} className="drv" onMouseEnter={() => setOpen(d.id)} onMouseLeave={() => setOpen(null)} onFocus={() => setOpen(d.id)} onBlur={() => setOpen(null)} tabIndex={0}>
                <i style={{ background: COLORS[d.id] }} />
                <div><strong>{d.label}</strong><p>{d.explain}</p></div>
                <b className={d.amount > 0 && d.id !== 'credit' ? 'warn' : 'good'}>{d.amount >= 0 ? '+' : '−'}{inr(Math.abs(d.amount))}</b>
              </div>
            ))}
            {!cmp.drivers.length && <p className="muted">No difference big enough to attribute.</p>}
            <small>{result.labels.basis} {result.labels.tariff}</small>
          </Card>
          <Card title="Worth a closer check">
            {result.checks.map((c, i) => (
              <div key={i} className={`check-item ${c.severity}`}>
                <strong>{c.title}</strong>
                <span className="muted">{c.detail}</span>
                <div className="verify">{c.verify}</div>
              </div>
            ))}
            <OfficialLinks ids={['bescom', 'kerc']} />
            <button className="link" onClick={() => go('ask')}>Ask Namma to explain this bill</button>
          </Card>
        </div>
      )}
      {result.ok && !cmp && (
        <Card title="Worth a closer check">
          {result.checks.map((c, i) => <div key={i} className={`check-item ${c.severity}`}><strong>{c.title}</strong><span className="muted">{c.detail}</span><div className="verify">{c.verify}</div></div>)}
        </Card>
      )}
    </div>
  );
}
