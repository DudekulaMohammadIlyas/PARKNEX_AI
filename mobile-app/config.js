import Constants from 'expo-constants';
import axios from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';

let activeBackendUrl = null;

// Initialize cached working backend URL from previous successful session
AsyncStorage.getItem('@parknex_active_backend_url').then(cached => {
  if (cached && typeof cached === 'string') {
    activeBackendUrl = cached;
  }
}).catch(() => null);

const getCandidateUrls = () => {
  const candidates = [];
  
  if (activeBackendUrl) {
    candidates.push(activeBackendUrl);
  }

  // 1. Explicit env URL if configured
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    candidates.push(process.env.EXPO_PUBLIC_BACKEND_URL);
  }

  // 2. Dynamically extracted Expo Metro / host IP (Primary for Wi-Fi mobile testing)
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

  // 3. Current Host machine Wi-Fi IPv4 address
  candidates.push('http://192.168.29.254:5000/api');
  candidates.push('http://10.213.187.205:5000/api');

  // 4. USB reverse debugging localhost (for adb reverse tcp:5000 tcp:5000)
  candidates.push('http://localhost:5000/api');
  candidates.push('http://127.0.0.1:5000/api');

  // 5. Android Emulator default host mapping
  candidates.push('http://10.0.2.2:5000/api');

  return [...new Set(candidates)];
};

export const getBackendUrl = () => {
  return activeBackendUrl || getCandidateUrls()[0];
};

export const smartApiRequest = async (method, relativePath, data = null, headers = {}) => {
  const candidates = activeBackendUrl 
    ? [activeBackendUrl, ...getCandidateUrls().filter(u => u !== activeBackendUrl)]
    : getCandidateUrls();

  let lastError = null;

  for (const baseUrl of candidates) {
    const fullUrl = `${baseUrl.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`;
    try {
      const isAiReq = (relativePath || '').toLowerCase().includes('ai');
      const response = await axios({
        method,
        url: fullUrl,
        data,
        headers,
        timeout: isAiReq ? 25000 : 6000
      });

      // Cache the working backend URL for future requests in memory and AsyncStorage
      activeBackendUrl = baseUrl;
      AsyncStorage.setItem('@parknex_active_backend_url', baseUrl).catch(() => null);
      return response;
    } catch (err) {
      lastError = err;
      if (err.response) {
        activeBackendUrl = baseUrl;
        AsyncStorage.setItem('@parknex_active_backend_url', baseUrl).catch(() => null);
        throw err;
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

