import { useEffect, useMemo, useRef, useState } from 'react';
import { askNamma, analyzeBill, analyzeGruhaJyothi, applianceBreakdown, savingsIdeas, buildPlan } from '@engine/index.js';
import { useApp } from '../ctx.jsx';
import { Card } from './Common.jsx';

const STARTERS = ['Explain my electricity bill in simple words', 'What does FPPCA mean?', 'How can I reduce my electricity costs?', 'Where can I verify this scheme information?'];
const BASIS = { 'your bill': 'From your bill', calculated: 'Calculated here', official: 'Official source', general: 'General explanation' };

export default function Ask() {
  const { billInputs, settings, meterUnits, unitsSoFar, appliances, budget } = useApp();
  const [log, setLog] = useState([{ who: 'bot', text: 'Hi, I am Namma. I answer from your bill figures, the numbers calculated in this app and official sources. I do not guess tariff rules.', followUps: STARTERS, basis: [], sources: [] }]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [log, busy]);

  const ctx = useMemo(() => {
    const units = Number(meterUnits) || unitsSoFar || 0;
    const analysis = billInputs?.current?.units !== '' && billInputs?.current ? analyzeBill({ current: billInputs.current, previous: billInputs.previous?.units !== '' ? billInputs.previous : null, sanctionedKw: settings.sanctionedKw, gruhaJyothi: settings.gruhaJyothi }) : null;
    const now = new Date();
    return {
      analysis,
      gj: settings.gruhaJyothi ? analyzeGruhaJyothi({ units, sanctionedKw: settings.sanctionedKw, enrolled: true, entitlementUnits: settings.entitlementUnits || null, avgPastUnits: settings.avgPastUnits || null }) : null,
      breakdown: appliances.length ? applianceBreakdown(appliances) : null,
      ideas: appliances.length ? savingsIdeas(appliances) : [],
      plan: units ? buildPlan({ budget: Number(budget) || 0, unitsSoFar: units, dayOfMonth: now.getDate(), daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), sanctionedKw: settings.sanctionedKw, gruhaJyothi: settings.gruhaJyothi, entitlementUnits: settings.entitlementUnits || null, appliances }) : null
    };
  }, [billInputs, settings, meterUnits, unitsSoFar, appliances, budget]);

  function ask(text) {
    const question = (text ?? q).trim();
    if (!question || busy) return;
    setLog(l => [...l, { who: 'user', text: question }]); setQ(''); setBusy(true);
    setTimeout(() => { setLog(l => [...l, { who: 'bot', ...askNamma(question, ctx) }]); setBusy(false); }, 450);
  }

  const have = [ctx.analysis?.ok && 'your bill', ctx.gj && 'Gruha Jyothi settings', ctx.breakdown && 'appliances', ctx.plan && 'budget plan'].filter(Boolean);

  return (
    <Card className="chat-card">
      <div className="chat">
        <div className="chat-log" aria-live="polite">
          {log.map((m, i) => (
            <div key={i} className={`msg ${m.who}`}>
              {m.text}
              {m.who === 'bot' && m.basis?.length > 0 && <div className="src">{[...new Set(m.basis)].map(b => <span key={b} className="tag">{BASIS[b]}</span>)}</div>}
              {m.sources?.length > 0 && <div className="src">{m.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer noopener">{s.label} ↗</a>)}</div>}
              {m.followUps?.length > 0 && i === log.length - 1 && <div className="chips">{m.followUps.map(f => <button key={f} className="chip" onClick={() => ask(f)}>{f}</button>)}</div>}
            </div>
          ))}
          {busy && <div className="msg bot"><span className="typing"><i /><i /><i /></span></div>}
          <div ref={end} />
        </div>
        <div>
          <small>{have.length ? `Using: ${have.join(', ')}.` : 'No bill or usage data yet. Add some in Bill Detective or Where it goes for answers about your own numbers.'}</small>
          <form className="chat-form" onSubmit={e => { e.preventDefault(); ask(); }}>
            <input value={q} onChange={e => setQ(e.target.value)} maxLength={500} placeholder="Ask about your bill, a charge, savings or the scheme" aria-label="Your question" />
            <button className="btn" disabled={!q.trim() || busy}>Ask</button>
          </form>
        </div>
      </div>
    </Card>
  );
}
