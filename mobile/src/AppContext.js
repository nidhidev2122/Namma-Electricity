// mobile/src/AppContext.jsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { isRunningInExpoGo } from 'expo';
import { getJSON, setJSON } from './storage';
import { TARIFF, computeBill, runtimeMinutes, inr } from './utils';
import {
  syncAlert,
  getAppliances,
  currentUser,
  hasApi,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from './api';

const notifications = isRunningInExpoGo() ? Promise.resolve(null) : import('expo-notifications');

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const monthKey = () => new Date().toISOString().slice(0, 7);
const rupeesPerKwh = (TARIFF.energy + TARIFF.pgSurcharge + TARIFF.fppca) * (1 + TARIFF.dutyRate);

export function AppProvider({ children }) {
  // ---------- AUTH STATE ----------
  const [user, setUser] = useState(undefined); // undefined = still loading, null = logged out
  const [authLoading, setAuthLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState('');

  // ---------- APP STATE ----------
  const [areaId, setAreaId] = useState('HSR-05');
  const [settings, setSettings] = useState({ sanctionedKw: 2, gruhaJyothi: true });
  const [appliances, setAppliances] = useState([]);
  const [meterUnits, setMeterUnits] = useState(0);
  const [intervals, setIntervals] = useState({ total: 0, count: 0, peakKw: 0, month: '' });
  const [alerts, setAlerts] = useState([]);
  const [ceilingMonth, setCeilingMonth] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const ref = useRef(appliances);
  ref.current = appliances;

  // ---------- BOOTSTRAP: LOAD SAVED DATA + CHECK SESSION ----------
  useEffect(() => {
    (async () => {
      // Restore cached local data first
      setAreaId(await getJSON('np.area', 'HSR-05'));
      setSettings(await getJSON('np.settings', { sanctionedKw: 2, gruhaJyothi: true }));
      setMeterUnits(await getJSON('np.units', 0));
      setIntervals(await getJSON('np.intervals', { total: 0, count: 0, peakKw: 0, month: '' }));
      setAlerts(await getJSON('np.alerts', []));
      setCeilingMonth(await getJSON('np.ceiling', ''));

      // Restore cached profile photo (until we know the real user)
      setProfilePhoto(await getJSON('np.profilePhoto', ''));

      // Configure notifications
      const notificationModule = await notifications;
      notificationModule?.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      await notificationModule?.setNotificationChannelAsync?.('alerts', {
        name: 'NammaPower Alerts',
        importance: notificationModule.AndroidImportance?.DEFAULT || 3,
      });

      // Try to restore the logged-in user from the API
      if (hasApi()) {
        try {
          const nextUser = await currentUser();
          setUser(nextUser || null);
          // Always set the photo from backend (or clear it if the new user has none)
          setProfilePhoto(nextUser?.profile_photo || '');
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      // Load appliances (remote if possible, local otherwise)
      const localApps = await getJSON('np.appliances', []);
      try {
        const remote = await getAppliances();
        setAppliances(
          remote.map((a) => ({
            id: a.id,
            name: a.name,
            watts: Number(a.watts),
            hoursPerDay: Number(a.daily_runtime_hours),
            alertAfter: Number(a.alert_after_minutes),
            startedAt: null,
            alerted: false,
          }))
        );
      } catch {
        setAppliances(localApps);
      }

      setHydrated(true);
      setAuthLoading(false);
    })();
  }, []);

  // ---------- PERSIST TO STORAGE ----------
  useEffect(() => { if (hydrated) setJSON('np.area', areaId); }, [areaId, hydrated]);
  useEffect(() => { if (hydrated) setJSON('np.settings', settings); }, [settings, hydrated]);
  useEffect(() => { if (hydrated) setJSON('np.appliances', appliances); }, [appliances, hydrated]);
  useEffect(() => { if (hydrated) setJSON('np.units', meterUnits); }, [meterUnits, hydrated]);
  useEffect(() => { if (hydrated) setJSON('np.intervals', intervals); }, [intervals, hydrated]);
  useEffect(() => { if (hydrated) setJSON('np.alerts', alerts); }, [alerts, hydrated]);
  useEffect(() => { if (hydrated) setJSON('np.ceiling', ceilingMonth); }, [ceilingMonth, hydrated]);
  useEffect(() => { if (hydrated) setJSON('np.profilePhoto', profilePhoto); }, [profilePhoto, hydrated]);

  // ---------- AUTH ACTIONS ----------
  async function login(email, password) {
    const result = await apiLogin(email, password);
    setUser(result.user);
    setProfilePhoto(result.user.profile_photo || '');
    return result;
  }

  async function register(email, password) {
    const result = await apiRegister(email, password);
    setUser(result.user);
    setProfilePhoto(result.user.profile_photo || '');
    return result;
  }

  async function logout() {
    try { await apiLogout(); } catch {}
    setUser(null);
    setProfilePhoto(''); // Prevent the previous user's photo leaking to the next session
  }

  // ---------- DERIVED VALUES ----------
  const unitsSoFar =
    intervals.month === monthKey() && intervals.total > 0
      ? intervals.total
      : Number(meterUnits) || 0;

  // ---------- ALERT PUSH ----------
  const push = useCallback(async (type, title, body, cost) => {
    setAlerts((prev) => [
      { id: Date.now() + Math.random(), type, title, body, at: Date.now() },
      ...prev,
    ].slice(0, 30));
    syncAlert(type, cost ?? null);
    const notificationModule = await notifications;
    await notificationModule
      ?.scheduleNotificationAsync({ content: { title, body }, trigger: null })
      .catch(() => {});
  }, []);

  // Long-running appliance check
  useEffect(() => {
    const id = setInterval(() => {
      const due = ref.current.filter(
        (a) => a.startedAt && !a.alerted && runtimeMinutes(a) >= a.alertAfter
      );
      if (!due.length) return;
      due.forEach((a) => {
        const perHour = (a.watts / 1000) * rupeesPerKwh;
        push(
          'long_runtime',
          `${a.name} has been on for ${a.alertAfter}+ min`,
          `About ${inr(perHour.toFixed(2))} per hour at this load. Switch it off if you are done.`,
          perHour
        );
      });
      setAppliances((prev) =>
        prev.map((a) => (due.some((d) => d.id === a.id) ? { ...a, alerted: true } : a))
      );
    }, 30000);
    return () => clearInterval(id);
  }, [push]);

  // Gruha Jyothi ceiling check
  useEffect(() => {
    if (!settings.gruhaJyothi || unitsSoFar < TARIFF.gruhaJyothiWarn || ceilingMonth === monthKey()) return;
    const over = computeBill({
      units: TARIFF.gruhaJyothiCap + 1,
      sanctionedKw: settings.sanctionedKw,
    }).gross;
    push(
      'gruha_jyothi_ceiling',
      `${Math.round(unitsSoFar)} units used this month`,
      `The Gruha Jyothi limit is ${TARIFF.gruhaJyothiCap} units. Crossing it makes the bill payable, roughly ${inr(over)} at the placeholder tariff.`,
      over
    );
    setCeilingMonth(monthKey());
  }, [unitsSoFar, settings, ceilingMonth, push]);

  // ---------- NOTIFICATIONS PERMISSION ----------
  const askNotifications = async () => {
    const notificationModule = await notifications;
    await notificationModule?.requestPermissionsAsync();
  };

  // ---------- CONTEXT VALUE ----------
  const value = {
    // Auth
    user, setUser,
    authLoading,
    profilePhoto, setProfilePhoto,
    login, register, logout,
    // App state
    areaId, setAreaId,
    settings, setSettings,
    appliances, setAppliances,
    meterUnits, setMeterUnits,
    intervals, setIntervals,
    unitsSoFar,
    alerts, setAlerts,
    monthKey,
    askNotifications,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}