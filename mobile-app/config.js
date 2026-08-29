import Constants from 'expo-constants';
import axios from 'axios';

let activeBackendUrl = null;

const getCandidateUrls = () => {
  const candidates = [];
  
  // 1. Explicit env URL if configured
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    candidates.push(process.env.EXPO_PUBLIC_BACKEND_URL);
  }

  // 2. USB reverse debugging localhost (for adb reverse tcp:5000 tcp:5000)
  candidates.push('http://localhost:5000/api');
  candidates.push('http://127.0.0.1:5000/api');

  // 3. Dynamically extracted Expo Metro / host IP (for Wi-Fi testing)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      candidates.push(`http://${ip}:5000/api`);
    }
  }

  // 4. Host machine Wi-Fi IPv4 address
  candidates.push('http://10.17.85.205:5000/api');

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
      console.log(`[MOBILE NETWORKING] ${method.toUpperCase()} -> ${fullUrl}`);
      const response = await axios({
        method,
        url: fullUrl,
        data,
        headers,
        timeout: 6000
      });

      // Cache the working backend URL for future requests
      activeBackendUrl = baseUrl;
      return response;
    } catch (err) {
      lastError = err;
      // If server responded with an HTTP status code (401, 400, 404, etc.), server was REACHED!
      if (err.response) {
        activeBackendUrl = baseUrl;
        throw err;
      }
      console.warn(`[MOBILE NETWORKING] Candidate ${baseUrl} failed with network error, attempting next fallback candidate...`);
    }
  }

  throw lastError || new Error('Failed to reach server. Please check your network connection.');
};

const config = {
  BACKEND_URL: getBackendUrl(),

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
