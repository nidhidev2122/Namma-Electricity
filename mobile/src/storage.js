import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export async function setJSON(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
export async function getDeviceId() {
  let id = await AsyncStorage.getItem('np.device');
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await AsyncStorage.setItem('np.device', id);
  }
  return id;
}