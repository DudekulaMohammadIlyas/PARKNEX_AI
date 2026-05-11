/**
 * ParkNex-AI Mobile Configuration
 * Use your API backend URL and replace this value for local development.
 */
const config = {
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000/api',

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
