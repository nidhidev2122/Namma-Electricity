// mobile/src/screens/Settings.jsx
import React, { useState } from 'react';
import { Alert, Switch, Text, View, Image, Pressable, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Field, s } from '../components';
import { useApp } from '../AppContext';
import { C } from '../theme';
import { updateProfile } from '../api';

export default function Settings() {
  const {
    settings, setSettings, askNotifications,
    user, setUser, logout,
    profilePhoto, setProfilePhoto,
  } = useApp();

  const [status, setStatus] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');

  // Update display name when user changes
  React.useEffect(() => {
    setDisplayName(user?.display_name || '');
  }, [user?.display_name]);

  async function resetLocalData() {
    Alert.alert(
      'Reset local data?',
      'This removes saved settings, appliances, reports, and meter readings from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'np.area', 'np.settings', 'np.appliances', 'np.units',
              'np.intervals', 'np.alerts', 'np.ceiling', 'np.reports', 'np.mine',
            ]);
            setSettings({ sanctionedKw: 2, gruhaJyothi: true });
            setStatus('Local data reset. Restart the app to reload all defaults.');
          },
        },
      ]
    );
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setProfileStatus('Permission to access photos was denied.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      // Resize to keep it under the 500 KB backend limit
      const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (dataUri.length > 490000) {
        setProfileStatus('Photo is too large. Please choose a smaller image.');
        return;
      }
      setProfilePhoto(dataUri);
      setProfileStatus('Photo ready. Save profile to sync it.');
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileStatus('Saving profile...');
    try {
      const result = await updateProfile(displayName, profilePhoto || '');
      setUser(result.user);
      setDisplayName(result.user.display_name || '');
      setProfilePhoto(result.user.profile_photo || '');
      setProfileStatus('Profile saved successfully.');
    } catch (err) {
      setProfileStatus(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <>
      {/* Tariff Preferences */}
      <Card title="Tariff preferences">
        <Field
          label="Sanctioned load (kW)"
          value={settings.sanctionedKw}
          onChangeText={value => setSettings({ ...settings, sanctionedKw: Number(value) || 1 })}
          keyboardType="numeric"
        />
        <View style={s.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.text}>Gruha Jyothi enrolled</Text>
            <Text style={s.muted}>Use the subsidy ceiling in bill estimates and alerts.</Text>
          </View>
          <Switch
            value={settings.gruhaJyothi}
            onValueChange={value => setSettings({ ...settings, gruhaJyothi: value })}
            trackColor={{ false: '#D0D5DD', true: '#93C5FD' }}
            thumbColor={settings.gruhaJyothi ? '#1D4ED8' : '#FFFFFF'}
          />
        </View>
      </Card>

      {/* Alerts */}
      <Card title="Alerts">
        <Text style={s.muted}>
          Notifications are disabled in Expo Go. A development build enables device notifications.
        </Text>
        <Button title="Request notification permission" secondary onPress={askNotifications} />
      </Card>

      {/* Privacy & Storage */}
      <Card title="Privacy and storage">
        <Text style={s.muted}>
          Your device identity is anonymous. Account numbers are not saved by this app.
        </Text>
        <Button title="Reset local data" danger onPress={resetLocalData} />
        {status && <Text style={s.text}>{status}</Text>}
      </Card>

      {/* ACCOUNT SECTION - MATCHES WEB APP */}
      {user && (
        <Card title="Account">

          {/* Profile Photo Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={{ width: 64, height: 64, borderRadius: 32, marginRight: 14 }}
              />
            ) : (
              <View
                style={{
                  width: 64, height: 64, borderRadius: 32, marginRight: 14,
                  backgroundColor: C.blueSoft || '#DBEAFE',
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 26, fontWeight: '800', color: C.brand || '#1D4ED8' }}>
                  {user.email.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.ink || '#14213D' }}>
                {user.email}
              </Text>
              <Text style={s.muted}>Your profile stays linked to this account.</Text>

              <View style={{ flexDirection: 'row', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                <Pressable
                  onPress={pickImage}
                  style={{
                    backgroundColor: C.brand || '#1D4ED8',
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>
                    {profilePhoto ? 'Change profile photo' : 'Upload profile photo'}
                  </Text>
                </Pressable>
                {profilePhoto ? (
                  <Pressable
                    onPress={() => setProfilePhoto('')}
                    style={{
                      backgroundColor: '#F3F4F6',
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: C.red || '#EF4444', fontWeight: '700', fontSize: 12 }}>
                      Remove photo
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>

          {/* Display Name Field */}
          <Field
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
          />

          <Button
            title={savingProfile ? 'Saving...' : 'Save profile'}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          />

          {profileStatus ? (
            <Text
              style={{
                color: profileStatus.toLowerCase().includes('success') ? (C.green || '#10B981') : (C.red || '#EF4444'),
                marginTop: 10, textAlign: 'center', fontSize: 13,
              }}
            >
              {profileStatus}
            </Text>
          ) : null}

          {/* Access Level Badge */}
          <View
            style={{
              marginTop: 18, paddingTop: 16,
              borderTopWidth: 1, borderTopColor: C.line || '#E4E7EC',
            }}
          >
            <Text style={{ fontWeight: '700', color: C.ink || '#14213D', marginBottom: 4 }}>
              {user.role === 'admin' ? 'Administrator access' : 'Basic member access'}
            </Text>
            <Text style={s.muted}>
              {user.role === 'admin'
                ? 'You can manage users, sessions, and platform reports.'
                : 'You can manage your own energy data. Administrative data is protected.'}
            </Text>
          </View>

          {/* Log Out */}
          <View style={{ marginTop: 12 }}>
            <Button title="Log out" secondary onPress={logout} />
          </View>

        </Card>
      )}
    </>
  );
}