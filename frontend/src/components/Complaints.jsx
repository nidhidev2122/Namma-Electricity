import { useState } from 'react';
import { COMPLAINT_TYPES } from '../data.js';
import { Card, AreaPicker, useArea } from './Common.jsx';
import { fillTemplate, whatsappLink } from '../utils.js';

const WA_NUMBER = import.meta.env.VITE_BESCOM_WHATSAPP || '918277884012';

export default function Complaints() {
  const area = useArea();
  const [type, setType] = useState(COMPLAINT_TYPES[0].id);
  // Kept in component state only, never written to storage or sent to the server
  const [account, setAccount] = useState('');
  const t = COMPLAINT_TYPES.find(c => c.id === type);
  const text = fillTemplate(t.text, { area: area.division_name, code: area.subdivision_code, account });

  const copy = () => navigator.clipboard?.writeText(text);

  return (
    <div className="stack">
      <AreaPicker />
      <Card title="What is wrong?">
        <label className="field"><span>Complaint type</span>
          <select value={type} onChange={e => setType(e.target.value)}>
            {COMPLAINT_TYPES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className="field"><span>Consumer account number (optional, not saved)</span>
          <input value={account} onChange={e => setAccount(e.target.value)} inputMode="numeric" /></label>
        <textarea readOnly rows="6" value={text} />
        <div className="row-actions">
          <a className="btn" href="tel:1912">Call 1912</a>
          <a className="btn" href={whatsappLink(WA_NUMBER, text)} target="_blank" rel="noreferrer">Send on WhatsApp</a>
          <button className="btn btn-alt" onClick={copy}>Copy text</button>
        </div>
        <small>Note the complaint number BESCOM gives you. If nothing happens in a few days, escalate to the sub-division office.</small>
      </Card>
    </div>
  );
}
