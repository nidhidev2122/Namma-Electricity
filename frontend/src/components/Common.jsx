import { useApp } from '../ctx.jsx';
import { SUBDIVISIONS, RISK_LABEL } from '../data.js';

export const Card = ({ title, children, className = '' }) => (
  <section className={`card ${className}`}>
    {title && <h3>{title}</h3>}
    {children}
  </section>
);

export const RiskBadge = ({ level }) => (
  <span className={`badge badge-${level}`}>{RISK_LABEL[level]}</span>
);

export function AreaPicker() {
  const { areaId, setAreaId } = useApp();
  return (
    <label className="field">
      <span>Your sub-division</span>
      <select value={areaId} onChange={e => setAreaId(e.target.value)}>
        {SUBDIVISIONS.map(s => (
          <option key={s.id} value={s.id}>{s.division_name} ({s.subdivision_code})</option>
        ))}
      </select>
    </label>
  );
}

export const useArea = () => {
  const { areaId } = useApp();
  return SUBDIVISIONS.find(s => s.id === areaId) || SUBDIVISIONS[0];
};

export const Disclaimer = () => (
  <footer className="disclaimer">
    <p>
      Namma Power is an independent app. It is not affiliated with, endorsed by, or operated by BESCOM or KERC.
      Outage figures and tariff rates are illustrative and may differ from official notices; check bescom.karnataka.gov.in
      before acting on them.
    </p>
    <p>
      Privacy: we never ask for or store Aadhaar, voter ID, phone numbers or names. Your data stays on this device
      under a random ID, in line with the DPDP Act, 2023.
    </p>
  </footer>
);
