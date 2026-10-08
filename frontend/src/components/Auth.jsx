import { useState } from 'react';
import { login, register } from '../api.js';

export default function Auth({ onAuthenticated, onOffline }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = mode === 'login' ? await login(email, password) : await register(email, password);
      onAuthenticated(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page">
    <section className="auth-panel">
      <div className="brand auth-brand"><img className="brand-mark" src="/nammapower-lightning.svg" alt="" /><div><strong>NammaPower</strong><small>Energy OS · Bengaluru</small></div></div>
      <span className="eyebrow">Private energy workspace</span>
      <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="muted">{mode === 'login' ? 'Sign in to sync your energy data across sessions.' : 'Use an email and password to start a private workspace.'}</p>
      <form className="auth-form" onSubmit={submit}>
        <label className="field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="field"><span>Password</span><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary auth-submit" disabled={busy}>{busy ? 'Working...' : mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
      <button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
        {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Log in'}
      </button>
      <div className="auth-divider"><span>or</span></div>
      <button className="btn auth-offline" onClick={onOffline}>Continue with offline demo</button>
      <p className="auth-privacy">Passwords are hashed before storage. We never ask for Aadhaar, phone numbers, or consumer IDs.</p>
    </section>
  </main>;
}
