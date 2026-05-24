import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// Services & Config
import config from './config';
import { supabase } from './supabaseClient';
import * as NotificationService from './notificationService';
import { globalStyles as styles } from './src/theme/styles';
import { COLORS } from './src/theme/colors';

// Screens
import AuthScreen from './src/screens/auth/AuthScreen';
import StudentMapScreen from './src/screens/student/StudentMapScreen';
import StudentVehiclesScreen from './src/screens/student/StudentVehiclesScreen';
import StudentPassScreen from './src/screens/student/StudentPassScreen';
import SecurityDashboard from './src/screens/security/SecurityDashboard';
import ScanScreen from './src/screens/security/ScanScreen';
import ProcessingScreen from './src/screens/security/ProcessingScreen';
import AccessGrantedScreen from './src/screens/security/AccessGrantedScreen';
import ExitScanScreen from './src/screens/security/ExitScanScreen';
import ExitClearedScreen from './src/screens/security/ExitClearedScreen';
import OfficerProfileScreen from './src/screens/security/OfficerProfileScreen';
import VehicleSearchScreen from './src/screens/security/VehicleSearchScreen';
import SecurityLogsScreen from './src/screens/security/SecurityLogsScreen';
import UserManagementScreen from './src/screens/admin/UserManagementScreen';
import AuthorizedVehiclesScreen from './src/screens/admin/AuthorizedVehiclesScreen';
import ReportsScreen from './src/screens/admin/ReportsScreen';
import ManageZonesScreen from './src/screens/admin/ManageZonesScreen';
import UnauthorizedLogsScreen from './src/screens/admin/UnauthorizedLogsScreen';
import SystemSettingsScreen from './src/screens/admin/SystemSettingsScreen';
import RoleManagementScreen from './src/screens/admin/RoleManagementScreen';
import SystemActivityScreen from './src/screens/admin/SystemActivityScreen';
import AdminProfileScreen from './src/screens/admin/AdminProfileScreen';
import StudentHomeScreen from './src/screens/student/StudentHomeScreen';

// --- Navigators ---

// Security Stack
const SecurityStackNav = createStackNavigator();
function SecurityStack({ onLogout }) {
  return (
    <SecurityStackNav.Navigator screenOptions={{ headerShown: false }}>
      <SecurityStackNav.Screen name="SecurityHome">
        {props => <SecurityDashboard {...props} onLogout={onLogout} />}
      </SecurityStackNav.Screen>
      <SecurityStackNav.Screen name="Scan" component={ScanScreen} />
      <SecurityStackNav.Screen name="Processing" component={ProcessingScreen} />
      <SecurityStackNav.Screen name="AccessGranted" component={AccessGrantedScreen} />
      <SecurityStackNav.Screen name="ExitScan" component={ExitScanScreen} />
      <SecurityStackNav.Screen name="ExitCleared" component={ExitClearedScreen} />
      <SecurityStackNav.Screen name="OfficerProfile">
        {props => <OfficerProfileScreen {...props} onLogout={onLogout} />}
      </SecurityStackNav.Screen>
      <SecurityStackNav.Screen name="VehicleSearch" component={VehicleSearchScreen} />
      <SecurityStackNav.Screen name="SecurityLogs" component={SecurityLogsScreen} />
    </SecurityStackNav.Navigator>
  );
}

// Admin Stack
const AdminStackNav = createStackNavigator();
function AdminStack({ onLogout, occupancy, events }) {
  return (
    <AdminStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AdminStackNav.Screen name="AdminHome">
        {props => <AdminDashboard {...props} occupancy={occupancy} events={events} onLogout={onLogout} />}
      </AdminStackNav.Screen>
      <AdminStackNav.Screen name="UserManagement" component={UserManagementScreen} />
      <AdminStackNav.Screen name="AuthorizedVehicles" component={AuthorizedVehiclesScreen} />
      <AdminStackNav.Screen name="Reports" component={ReportsScreen} />
      <AdminStackNav.Screen name="ManageZones" component={ManageZonesScreen} />
      <AdminStackNav.Screen name="UnauthorizedLogs" component={UnauthorizedLogsScreen} />
      <AdminStackNav.Screen name="SystemSettings" component={SystemSettingsScreen} />
      <AdminStackNav.Screen name="RoleManagement" component={RoleManagementScreen} />
      <AdminStackNav.Screen name="SystemActivity" component={SystemActivityScreen} />
      <AdminStackNav.Screen name="AdminProfile">
        {props => <AdminProfileScreen {...props} onLogout={onLogout} />}
      </AdminStackNav.Screen>
    </AdminStackNav.Navigator>
  );
}

try {
  NotificationService.configureNotificationHandler();
} catch (e) {
  console.warn('Failed to configure global notification handler', e);
}

const BACKEND_URL = config.BACKEND_URL;
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Splash Screen
function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Auth');
    }, 2000);
  }, []);

  return (
    <View style={[styles.center, { backgroundColor: COLORS.primary }]}>
      <MaterialCommunityIcons name="car-connected" size={100} color="white" />
      <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', marginTop: 20 }}>ParkNex-AI</Text>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 8 }}>Smart Campus Parking</Text>
    </View>
  );
}

import StudentBookScreen from './src/screens/student/StudentBookScreen';
import LiveStatusScreen from './src/screens/student/LiveStatusScreen';
import NotificationsScreen from './src/screens/student/NotificationsScreen';
import SlotOccupiedAlertScreen from './src/screens/student/SlotOccupiedAlertScreen';
import ExitSuccessScreen from './src/screens/student/ExitSuccessScreen';
import StudentHistoryScreen from './src/screens/student/StudentHistoryScreen';
import StudentProfileScreen from './src/screens/student/StudentProfileScreen';

// Home Stack to handle nested navigation from the Home screen
const HomeStackNav = createStackNavigator();
function HomeStack({ occupancy }) {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="StudentHome">
        {props => <StudentHomeScreen {...props} occupancy={occupancy} />}
      </HomeStackNav.Screen>
      <HomeStackNav.Screen name="Vehicles" component={StudentVehiclesScreen} />
      <HomeStackNav.Screen name="LiveStatus" component={LiveStatusScreen} />
      <HomeStackNav.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStackNav.Screen name="SlotOccupied" component={SlotOccupiedAlertScreen} />
      <HomeStackNav.Screen name="ExitSuccess" component={ExitSuccessScreen} />
      <HomeStackNav.Screen name="History" component={StudentHistoryScreen} />
    </HomeStackNav.Navigator>
  );
}

// Student Tabs Navigator
function StudentTabs({ occupancy, onLogout, session }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Book') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size + 4} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { height: 90, paddingBottom: 30, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.white },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11, marginTop: -5 },
      })}
    >
      <Tab.Screen name="Home">
        {props => <HomeStack {...props} occupancy={occupancy} />}
      </Tab.Screen>
      <Tab.Screen name="Map" component={StudentMapScreen} />
      <Tab.Screen name="Book" component={StudentBookScreen} />
      <Tab.Screen name="Profile">
        {props => <StudentProfileScreen {...props} onLogout={onLogout} session={session} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Main App Component
function MainApp() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [events, setEvents] = useState([]);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let notificationListener = { remove: () => {} };
    let responseListener = { remove: () => {} };
    let subscription = { unsubscribe: () => {} };

    try {
      NotificationService.registerForPushNotificationsAsync()
        .then(token => { if (token) setExpoPushToken(token); })
        .catch(() => {});

      const listeners = NotificationService.setupNotificationListeners(
        (notification) => console.log('App: Notification Received', notification),
        (response) => console.log('App: Notification Response', response)
      );
      notificationListener = listeners.notificationListener;
      responseListener = listeners.responseListener;
    } catch (error) {}

    try {
      supabase.auth.getSession()
        .then(({ data: { session }, error }) => {
          if (error) {
            if (error.message.includes('Refresh Token Not Found')) {
              console.warn('Invalid refresh token. Signing out silently.');
              supabase.auth.signOut().catch(() => {});
            }
            setIsInitializing(false);
            return;
          }
          setSession(session);
          if (session?.user?.user_metadata?.role) setRole(session.user.user_metadata.role);
          setIsInitializing(false);
        })
        .catch(() => setIsInitializing(false));

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setRole(null);
        } else {
          setSession(session);
          if (session?.user?.user_metadata?.role) setRole(session.user.user_metadata.role);
        }
      });
      subscription = authListener?.subscription || { unsubscribe: () => {} };
    } catch (error) {
      setIsInitializing(false);
    }

    return () => {
      if (subscription.unsubscribe) subscription.unsubscribe();
      if (notificationListener.remove) notificationListener.remove();
      if (responseListener.remove) responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    if (expoPushToken) {
      axios.post(`${BACKEND_URL}/register-push-token`, {
        email: session.user.email,
        pushToken: expoPushToken,
        role: session.user.user_metadata.role
      }).catch(() => {});
    }

    const fetchData = async () => {
      try {
        const [occ, ev] = await Promise.all([
          axios.get(`${BACKEND_URL}/occupancy`),
          axios.get(`${BACKEND_URL}/events`)
        ]);
        setOccupancy(occ.data);
        setEvents(ev.data);
      } catch (e) { console.error('Data fetch error:', e.message); }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Event' },
        (payload) => {
          setEvents(prev => [payload.new, ...prev]);
          axios.get(`${BACKEND_URL}/occupancy`).then(res => setOccupancy(res.data)).catch(() => {});
        }
      ).subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [session, expoPushToken]);

  const simulateEvent = async (type) => {
    setIsActionLoading(true);
    try {
      const zones = occupancy?.zones || [];
      const randomZone = zones.length > 0 ? zones[Math.floor(Math.random() * zones.length)].id : 'mock-zone-id';
      
      await axios.post(`${BACKEND_URL}/simulate-event`, {
        type,
        plateNumber: `UP${Math.floor(10 + Math.random() * 90)}AB${Math.floor(1000 + Math.random() * 9000)}`,
        zoneId: randomZone
      });
    } catch (error) {
      alert('Failed to simulate event. Check backend connection.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const triggerAIScan = async () => {
    setIsActionLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/trigger-ai`);
      if (res.data.success) {
        alert('AI scan process started in the background!');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start AI scan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  if (isInitializing) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.bg }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          <Stack.Screen name="Main">
            {() => (
              <>
                {role === 'STUDENT' && <StudentTabs occupancy={occupancy} onLogout={handleLogout} session={session} />}
                {role === 'SECURITY' && <SecurityStack onLogout={handleLogout} />}
                {role === 'ADMIN' && <AdminStack occupancy={occupancy} events={events} onLogout={handleLogout} />}
                {/* Fallback if role is undefined */}
                {!role && <StudentTabs occupancy={occupancy} onLogout={handleLogout} session={session} />}
              </>
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

// Global Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global Error Caught by Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={[styles.center, { padding: 24, backgroundColor: COLORS.bg }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={80} color={COLORS.danger} />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 20 }}>Oops! Something went wrong.</Text>
          <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 10, marginBottom: 30 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Text>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children; 
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
