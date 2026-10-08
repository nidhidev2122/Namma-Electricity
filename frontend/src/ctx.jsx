import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { TARIFF, computeBill, runtimeMinutes, inr } from './utils.js';
import { currentUser, hasApi, logout as apiLogout, syncAlert } from './api.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

function useLocal(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue];
}

const monthKey = () => new Date().toISOString().slice(0, 7);
// Rs per kWh a running appliance actually costs: energy + P&G + FPPCA, then duty on top
const rupeesPerKwh = (TARIFF.energy + TARIFF.pgSurcharge + TARIFF.fppca) * (1 + TARIFF.dutyRate);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(hasApi());
  const [profilePhoto, setProfilePhoto] = useLocal('np.profilePhoto', '');
  const [areaId, setAreaId] = useLocal('np.area', 'HSR-05');
  const [settings, setSettings] = useLocal('np.settings', { sanctionedKw: 2, gruhaJyothi: true });
  const [appliances, setAppliances] = useLocal('np.appliances', []);
  const [meterUnits, setMeterUnits] = useLocal('np.units', 0);
  const [intervals, setIntervals] = useLocal('np.intervals', { total: 0, count: 0, peakKw: 0, month: '' });
  const [alerts, setAlerts] = useLocal('np.alerts', []);
  const [ceilingMonth, setCeilingMonth] = useLocal('np.ceiling', '');
  const [notifPerm, setNotifPerm] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

  useEffect(() => {
    if (!hasApi()) return;
    currentUser().then(nextUser => {
      setUser(nextUser);
      // CHANGE 1: Always set the photo. If the new user has no photo, set it to empty string.
      setProfilePhoto(nextUser.profile_photo || ''); 
    }).catch(() => localStorage.removeItem('np.auth.token')).finally(() => setAuthLoading(false));
  }, []);

  async function logout() {
    await apiLogout();
    setUser(null);
    // CHANGE 2: Clear the profile photo state on logout to prevent leaking to next user
    setProfilePhoto(''); 
  }

  const unitsSoFar = intervals.month === monthKey() && intervals.total > 0 ? intervals.total : Number(meterUnits) || 0;

  const push = useCallback((type, title, body, cost) => {
    setAlerts(prev => [{ id: Date.now() + Math.random(), type, title, body, at: Date.now() }, ...prev].slice(0, 30));
    syncAlert(type, cost ?? null);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }, [setAlerts]);

  // The check runs off a ref so the 30 s timer always sees the latest appliance list
  const appRef = useRef(appliances);
  appRef.current = appliances;
  useEffect(() => {
    const id = setInterval(() => {
      const due = appRef.current.filter(a => a.startedAt && !a.alerted && runtimeMinutes(a) >= a.alertAfter);
      if (!due.length) return;
      due.forEach(a => {
        const perHour = (a.watts / 1000) * rupeesPerKwh;
        push('long_runtime', `${a.name} has been on for ${a.alertAfter}+ min`,
          `About ${inr(perHour.toFixed(2))} per hour at this load. Switch it off if you are done.`, perHour);
      });
      setAppliances(prev => prev.map(a => (due.some(d => d.id === a.id) ? { ...a, alerted: true } : a)));
    }, 30000);
    return () => clearInterval(id);
  }, [push, setAppliances]);

  useEffect(() => {
    if (!settings.gruhaJyothi || unitsSoFar < TARIFF.gruhaJyothiWarn || ceilingMonth === monthKey()) return;
    const over = computeBill({ units: TARIFF.gruhaJyothiCap + 1, sanctionedKw: settings.sanctionedKw }).gross;
    push('gruha_jyothi_ceiling', `${Math.round(unitsSoFar)} units used this month`,
      `The Gruha Jyothi limit is ${TARIFF.gruhaJyothiCap} units. Crossing it turns a \u20B90 bill into roughly ${inr(over)}.`, over);
    setCeilingMonth(monthKey());
  }, [unitsSoFar, settings, ceilingMonth, push, setCeilingMonth]);

  async function askNotifications() {
    if (typeof Notification === 'undefined') return;
    setNotifPerm(await Notification.requestPermission());
  }

  const value = {
    areaId, setAreaId, settings, setSettings, appliances, setAppliances,
    meterUnits, setMeterUnits, intervals, setIntervals, unitsSoFar,
    alerts, setAlerts, notifPerm, askNotifications, monthKey, user, setUser, authLoading, logout,
    profilePhoto, setProfilePhoto
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}