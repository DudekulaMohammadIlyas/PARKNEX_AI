import Constants from 'expo-constants';

const getBackendUrl = () => {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) return `http://${ip}:5000/api`;
  }
  return 'http://localhost:5000/api';
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
