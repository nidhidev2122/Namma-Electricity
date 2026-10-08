import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from './src/AppContext';
import { Disclaimer, s } from './src/components';
import Dashboard from './src/screens/Dashboard';
import MapViewScreen from './src/screens/MapViewScreen';
import Appliances from './src/screens/Appliances';
import Bills from './src/screens/Bills';
import Coach from './src/screens/Coach';
import Report from './src/screens/Report';
import RentBuy from './src/screens/RentBuy';
import Complaints from './src/screens/Complaints';
import Settings from './src/screens/Settings';
import Analytics from './src/screens/Analytics';
import { currentUser, hasApi, login, register, logout } from './src/api';

const TABS = [['home', 'Home'], ['map', 'Map'], ['appliances', 'Appliances'], ['bills', 'Bills'], ['coach', 'Coach'], ['analytics', 'Analytics'], ['report', 'Report'], ['rent', 'Rent/Buy'], ['complaints', 'Complaints']];
const views = { home: Dashboard, map: MapViewScreen, appliances: Appliances, bills: Bills, coach: Coach, analytics: Analytics, report: Report, rent: RentBuy, complaints: Complaints, settings: Settings };

function Shell() {
  const [tab, setTab] = useState('home');
  const [moreOpen, setMoreOpen] = useState(false);
  const Screen = views[tab];
  const [user, setUser] = useState(undefined);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!hasApi()) { setUser(null); return; }
    currentUser().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return (
    <SafeAreaView style={s.screen}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    </SafeAreaView>
  );

  if (!user) return (
    <AuthScreen
      email={email} setEmail={setEmail}
      password={password} setPassword={setPassword}
      mode={mode} setMode={setMode}
      error={error}
      submit={async () => {
        try {
          const result = mode === 'login' ? await login(email, password) : await register(email, password);
          setUser(result.user);
        } catch (err) { setError(err.message); }
      }}
      offline={() => setUser({ offline: true })}
    />
  );

  const selectTab = id => { setTab(id); setMoreOpen(false); };

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <Text style={s.title}>Namma Power</Text>
        <Text style={s.subtitle}>Your personal electricity companion for Bengaluru</Text>
        <Pressable onPress={async () => { await logout(); setUser(null); }}>
          <Text style={{ color: '#1D4ED8', fontWeight: '700' }}>Log out</Text>
        </Pressable>
      </View>
      <ScrollView horizontal style={{ flexGrow: 0, height: 52 }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 7, paddingBottom: 6, alignItems: 'center' }}>
        {TABS.slice(0, 5).map(([id, label]) => (
          <Pressable key={id} onPress={() => selectTab(id)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: id === tab ? '#1D4ED8' : '#E4E7EC', backgroundColor: id === tab ? '#1D4ED8' : '#FFF' }}>
            <Text style={{ fontSize: 13, fontWeight: '650', color: id === tab ? '#FFF' : '#14213D' }}>{label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setMoreOpen(value => !value)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: moreOpen ? '#1D4ED8' : '#E4E7EC', backgroundColor: moreOpen ? '#DBEAFE' : '#FFF' }}>
          <Text style={{ fontSize: 13, fontWeight: '650', color: '#14213D' }}>More</Text>
        </Pressable>
      </ScrollView>
      {moreOpen && (
        <View style={s.moreMenu}>
          {TABS.slice(5).map(([id, label]) => (
            <Pressable key={id} onPress={() => selectTab(id)} style={s.moreItem}>
              <Text style={s.text}>{label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => selectTab('settings')} style={s.moreItem}>
            <Text style={s.text}>Settings</Text>
          </Pressable>
        </View>
      )}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        <Screen go={setTab} />
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

function AuthScreen({ email, setEmail, password, setPassword, mode, setMode, error, submit, offline }) {
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, flexGrow: 1 }}>
        
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          {/* FIXED LOGO: Black rounded square with the yellow bolt SVG inside */}
          <View style={{ width: 80, height: 80, backgroundColor: '#111827', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Image 
              source={require('./assets/logo.svg')} 
              style={{ width: 44, height: 44 }} 
              resizeMode="contain" 
            />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#14213D' }}>NammaPower</Text>
          <Text style={{ fontSize: 14, color: '#667085', marginTop: 4, textAlign: 'center' }}>
            {mode === 'login' ? 'Sign in to your energy workspace' : 'Create your private workspace'}
          </Text>
        </View>

        <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 10, padding: 14, marginTop: 12, backgroundColor: '#FFF' }} />
        <TextInput secureTextEntry placeholder="Password (8+ characters)" value={password} onChangeText={setPassword} style={{ borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 10, padding: 14, marginTop: 12, backgroundColor: '#FFF' }} />
        
        {error ? <Text style={{ color: '#EF4444', marginTop: 10, textAlign: 'center' }}>{error}</Text> : null}
        
        <Pressable onPress={submit} style={{ backgroundColor: '#1D4ED8', padding: 16, borderRadius: 10, marginTop: 20 }}>
          <Text style={{ color: '#FFF', fontWeight: '700', textAlign: 'center', fontSize: 16 }}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>
        </Pressable>
        
        <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          <Text style={{ color: '#1D4ED8', textAlign: 'center', padding: 16, fontWeight: '600' }}>{mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Log in'}</Text>
        </Pressable>
        
        <Pressable onPress={offline}>
          <Text style={{ color: '#667085', textAlign: 'center', paddingTop: 8 }}>Continue with offline demo</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}