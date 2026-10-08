import { useEffect, useState } from 'react';
import { useApp } from '../ctx.jsx';
import { Card } from './Common.jsx';
import { updateProfile } from '../api.js';

export default function Settings() {
  const { settings, setSettings, askNotifications, user, setUser, logout, profilePhoto, setProfilePhoto } = useApp();
  const [status, setStatus] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');

  useEffect(() => {
    setDisplayName(user?.display_name || '');
  }, [user?.display_name]);

  function resetLocalData() {
    localStorage.clear();
    setSettings({ sanctionedKw: 2, gruhaJyothi: true });
    setStatus('Local data reset. Reload the app to restore all defaults.');
  }

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      setStatus('Please choose an image smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        setProfilePhoto(canvas.toDataURL('image/jpeg', 0.82));
        setProfileStatus('Photo ready. Save profile to sync it.');
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileStatus('Saving profile...');
    try {
      const result = await updateProfile(displayName, profilePhoto);
      setUser(result.user);
      setDisplayName(result.user.display_name || '');
      setProfilePhoto(result.user.profile_photo || '');
      setProfileStatus('Profile saved successfully.');
    } catch (error) {
      setProfileStatus(error.message);
    } finally {
      setSavingProfile(false);
    }
  }

  return <div className="stack">
    <Card title="Tariff preferences">
      <label className="field"><span>Sanctioned load (kW)</span>
        <input type="number" min="1" step="0.5" value={settings.sanctionedKw}
          onChange={e => setSettings({...settings, sanctionedKw: Number(e.target.value) || 1})} />
      </label>
      <label className="check"><input type="checkbox" checked={settings.gruhaJyothi}
        onChange={e => setSettings({...settings, gruhaJyothi: e.target.checked})} />
        I am enrolled in Gruha Jyothi
      </label>
    </Card>
    <Card title="Alerts">
      <p className="muted">Alerts are stored locally and shown in the Appliances screen.</p>
      <button className="btn" onClick={askNotifications}>Enable browser notifications</button>
    </Card>
    <Card title="Privacy and storage">
      <p className="muted">No Aadhaar, voter ID, name, phone number, or consumer number is stored.</p>
      <button className="btn btn-danger" onClick={resetLocalData}>Reset local data</button>
      {status && <p>{status}</p>}
    </Card>
    {user && <Card title="Account" className="account-card">
      <div className="profile-editor">
        {profilePhoto ? <img className="profile-photo" src={profilePhoto} alt="Current profile" /> : <span className="profile-photo profile-placeholder">{user.email.slice(0, 1).toUpperCase()}</span>}
        <div>
          <p className="profile-email">{user.email}</p>
          <p className="muted profile-hint">Your profile stays linked to this account.</p>
          <label className="btn profile-upload">Change profile photo<input type="file" accept="image/*" onChange={choosePhoto} /></label>
          {profilePhoto && <button className="btn btn-danger profile-remove" onClick={() => setProfilePhoto('')}>Remove photo</button>}
        </div>
      </div>
      <form className="profile-form" onSubmit={saveProfile}>
        <label className="field"><span>Display name</span><input value={displayName} maxLength="80" onChange={event => setDisplayName(event.target.value)} placeholder="Your name" /></label>
        <button className="btn btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save profile'}</button>
      </form>
      {profileStatus && <p className="profile-status" aria-live="polite">{profileStatus}</p>}
      <div className="access-note">
        <strong>{user.role === 'admin' ? 'Administrator access' : 'Basic member access'}</strong>
        <span>{user.role === 'admin' ? 'You can manage users, sessions, and platform reports.' : 'You can manage your own energy data. Administrative data is protected.'}</span>
      </div>
      <button className="btn account-logout" onClick={logout}>Log out</button>
    </Card>}
  </div>;
}
