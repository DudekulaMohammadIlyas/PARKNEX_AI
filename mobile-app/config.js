import Constants from 'expo-constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let activeBackendUrl = null;
let customServerUrl = null;

// Primary host machine Wi-Fi IPv4 address on the current network
export const CURRENT_WIFI_IP = '10.183.174.205';

// Initialize cached working backend URL and custom server override from previous sessions
AsyncStorage.getItem('@parknex_custom_server_ip').then(custom => {
  if (custom && typeof custom === 'string') {
    customServerUrl = custom.startsWith('http') ? custom : `http://${custom}:5000/api`;
  }
}).catch(() => null);

AsyncStorage.getItem('@parknex_active_backend_url').then(cached => {
  if (cached && typeof cached === 'string') {
    activeBackendUrl = cached;
  }
}).catch(() => null);

export const getCandidateUrls = () => {
  const candidates = [];

  // 1. User manual override if configured in app
  if (customServerUrl) {
    candidates.push(customServerUrl);
  }

  // 2. Currently active / verified working URL
  if (activeBackendUrl) {
    candidates.push(activeBackendUrl);
  }

  // 3. Current active Wi-Fi host IPv4 address (Primary for current network)
  candidates.push(`http://${CURRENT_WIFI_IP}:5000/api`);

  // 4. Explicit env URL if configured
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    candidates.push(process.env.EXPO_PUBLIC_BACKEND_URL);
  }

  // 5. Dynamically extracted Expo Metro / host IP (Primary for Expo Go & dev-client)
  const expoHostUris = [
    Constants.expoConfig?.hostUri,
    Constants.manifest?.debuggerHost,
    Constants.manifest2?.extra?.expoGo?.developer?.tool,
    Constants.manifest2?.extra?.manifest?.debuggerHost,
    Constants.experienceUrl,
    Constants.linkingUri
  ].filter(Boolean);

  for (const uri of expoHostUris) {
    if (typeof uri === 'string') {
      const match = uri.match(/^(?:[a-z]+:\/\/)?([^:\/]+)/i);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        candidates.push(`http://${match[1]}:5000/api`);
      }
    }
  }

  // 6. USB reverse debugging localhost (for adb reverse tcp:5000 tcp:5000)
  candidates.push('http://localhost:5000/api');
  candidates.push('http://127.0.0.1:5000/api');

  // 7. Android Emulator default host mapping
  candidates.push('http://10.0.2.2:5000/api');

  // 8. Other previous known fallback network IPs
  candidates.push('http://10.213.187.205:5000/api');
  candidates.push('http://192.168.29.254:5000/api');
  candidates.push('http://192.168.1.100:5000/api');

  return [...new Set(candidates)];
};

export const getBackendUrl = () => {
  return customServerUrl || activeBackendUrl || `http://${CURRENT_WIFI_IP}:5000/api`;
};

export const setCustomBackendIp = async (ipOrUrl) => {
  if (!ipOrUrl || !ipOrUrl.trim()) {
    customServerUrl = null;
    await AsyncStorage.removeItem('@parknex_custom_server_ip');
    return null;
  }
  let clean = ipOrUrl.trim().replace(/\/api\/?$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `http://${clean}`;
  }
  if (!clean.includes(':', 7)) {
    clean = `${clean}:5000`;
  }
  const formatted = `${clean}/api`;
  customServerUrl = formatted;
  activeBackendUrl = formatted;
  await AsyncStorage.setItem('@parknex_custom_server_ip', formatted);
  await AsyncStorage.setItem('@parknex_active_backend_url', formatted);
  return formatted;
};

export const testBackendConnection = async (targetUrl = null) => {
  const urlToTest = targetUrl || getBackendUrl();
  const clean = urlToTest.replace(/\/$/, '');
  try {
    const res = await axios.get(`${clean}/health`, { timeout: 3000 });
    return { success: res.status === 200, url: urlToTest, data: res.data };
  } catch (err) {
    return { success: false, url: urlToTest, error: err.message };
  }
};

export const smartApiRequest = async (method, relativePath, data = null, headers = {}) => {
  const isAiReq = (relativePath || '').toLowerCase().includes('ai');
  const candidates = getCandidateUrls();

  let lastError = null;

  for (const baseUrl of candidates) {
    const fullUrl = `${baseUrl.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`;
    try {
      const response = await axios({
        method,
        url: fullUrl,
        data,
        headers,
        timeout: isAiReq ? 25000 : 3500 // Fast failover on dead IP candidates
      });

      // Cache the working backend URL for future requests
      activeBackendUrl = baseUrl;
      AsyncStorage.setItem('@parknex_active_backend_url', baseUrl).catch(() => null);
      return response;
    } catch (err) {
      lastError = err;
      // If the backend returned an HTTP response (400, 401, 403, etc.),
      // the network connection succeeded!
      if (err.response) {
        activeBackendUrl = baseUrl;
        AsyncStorage.setItem('@parknex_active_backend_url', baseUrl).catch(() => null);
        throw err;
      }
      // If network timed out or connection refused, invalidate stale activeBackendUrl
      if (activeBackendUrl === baseUrl) {
        activeBackendUrl = null;
        AsyncStorage.removeItem('@parknex_active_backend_url').catch(() => null);
      }
    }
  }

  throw lastError || new Error(`Network Error: Unable to reach backend server. Candidate URLs tried: ${candidates.join(', ')}`);
};

const config = {
  get BACKEND_URL() {
    return getBackendUrl();
  },

  // Theme Colors (Royal Blue)
  COLORS: {
    primary: '#2563EB',
    bg: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1E293B',
    textMuted: '#64748B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    border: '#E2E8F0',
    white: '#FFFFFF',
  }
};

export default config;
