import { useId } from 'react';
import { useApp } from '../ctx.jsx';
import { SUBDIVISIONS, RISK_LABEL } from '../data.js';
import { TARIFF_META, OFFICIAL_LINKS } from '@engine/tariff.js';

export const Card = ({ title, children, className = '', right }) => (
  <section className={`card ${className}`}>
    {(title || right) && <div className="row" style={{ border: 0, padding: 0, marginBottom: 10 }}>{title && <h3 style={{ margin: 0 }}>{title}</h3>}{right}</div>}
    {children}
  </section>
);

export const RiskBadge = ({ level }) => <span className={`badge badge-${level}`}>{RISK_LABEL[level]}</span>;

const QUALITY = {
  actual: ['actual', 'From your bill'],
  mixed: ['', 'Partly estimated'],
  totals: ['', 'Estimate from totals'],
  estimated: ['', 'Estimate']
};
export const QualityTag = ({ q }) => <span className={`tag ${QUALITY[q]?.[0] || ''}`}>{QUALITY[q]?.[1] || 'Estimate'}</span>;
export const EstimateTag = ({ children = 'Estimate' }) => <span className="tag">{children}</span>;

export function AreaPicker() {
  const { areaId, setAreaId } = useApp();
  return (
    <label className="field">
      <span>Your sub-division</span>
      <select value={areaId} onChange={e => setAreaId(e.target.value)}>
        {SUBDIVISIONS.map(s => <option key={s.id} value={s.id}>{s.division_name} ({s.subdivision_code})</option>)}
      </select>
    </label>
  );
}

export const useArea = () => {
  const { areaId } = useApp();
  return SUBDIVISIONS.find(s => s.id === areaId) || SUBDIVISIONS[0];
};

export function NumField({ label, hint, value, onChange, min = 0, step = 'any', placeholder, ...rest }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" inputMode="decimal" min={min} step={step} value={value ?? ''} placeholder={placeholder}
        onChange={e => onChange(e.target.value === '' ? '' : e.target.value)} {...rest} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Tabs({ value, onChange, items }) {
  return <div className="tabs" role="tablist">{items.map(([id, label]) => <button key={id} role="tab" aria-selected={id === value} className={id === value ? 'on' : ''} onClick={() => onChange(id)}>{label}</button>)}</div>;
}

// Progress ring: value/max with a centre label. Colour shifts as the household nears or passes its limit.
export function Ring({ value, max, size = 190, stroke = 16, label, sub, tone }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const pct = max ? Math.min(1, Math.max(0, value / max)) : 0;
  const color = tone || (pct >= 1 ? 'var(--red)' : pct >= 0.85 ? 'var(--fil)' : 'var(--brand)');
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label} ${sub || ''}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle className="ring-arc" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-label"><b>{label}</b><small>{sub}</small></div>
    </div>
  );
}

export function Sparkline({ values, width = 260, height = 70, color = 'var(--brand)' }) {
  const id = useId();
  if (!values.length) return null;
  const max = Math.max(...values, 1), min = Math.min(...values, 0);
  const pts = values.map((v, i) => [values.length === 1 ? width / 2 : (i / (values.length - 1)) * (width - 12) + 6, height - 8 - ((v - min) / (max - min || 1)) * (height - 16)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".25" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L${pts[pts.length - 1][0]} ${height} L${pts[0][0]} ${height} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={color} />)}
    </svg>
  );
}

export const OfficialLinks = ({ ids }) => (
  <div className="chips">
    {OFFICIAL_LINKS.filter(l => !ids || ids.includes(l.id)).map(l => <a key={l.id} className="chip" href={l.url} target="_blank" rel="noreferrer noopener">{l.label} ↗</a>)}
  </div>
);

export const Disclaimer = () => (
  <footer className="disclaimer">
    <p>Namma Electricity is an independent app. It is not affiliated with, endorsed by, or operated by BESCOM or KERC. {TARIFF_META.note} Outage figures for sub-divisions are illustrative; check bescom.karnataka.gov.in before acting on them.</p>
    <p>Privacy: we never ask for or store Aadhaar, voter ID, phone numbers, names or consumer numbers. Bill text you paste is processed on your device and not saved.</p>
  </footer>
);
