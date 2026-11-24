// Keeps the app working in locked-down hosts (sandboxed iframes, private modes) where
// storage, history and crypto.randomUUID can throw or be missing. Must be imported first.
function memoryStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(String(k)) ? m.get(String(k)) : null),
    setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: k => { m.delete(String(k)); },
    clear: () => m.clear(),
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; }
  };
}

for (const name of ['localStorage', 'sessionStorage']) {
  try { window[name].getItem('__np_probe'); } catch {
    try { Object.defineProperty(window, name, { value: memoryStorage(), configurable: true }); } catch { /* ignore */ }
  }
}

for (const fn of ['replaceState', 'pushState']) {
  const original = history[fn].bind(history);
  history[fn] = (...args) => { try { original(...args); } catch { /* blocked in sandboxed frames */ } };
}

if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  crypto.randomUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });
}
