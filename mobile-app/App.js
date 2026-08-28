import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Services & Config
import config from './config';
import { supabase } from './supabaseClient';
import * as NotificationService from './notificationService';
import { globalStyles as styles } from './src/theme/styles';
import { COLORS } from './src/theme/colors';

// Screens
import AuthScreen from './src/screens/auth/AuthScreen';
import StudentHomeScreen from './src/screens/student/StudentHomeScreen';
import StudentMapScreen from './src/screens/student/StudentMapScreen';
import StudentVehiclesScreen from './src/screens/student/StudentVehiclesScreen';
import StudentPassScreen from './src/screens/student/StudentPassScreen';
import StudentBookScreen from './src/screens/student/StudentBookScreen';
import LiveStatusScreen from './src/screens/student/LiveStatusScreen';
import NotificationsScreen from './src/screens/student/NotificationsScreen';
import SlotOccupiedAlertScreen from './src/screens/student/SlotOccupiedAlertScreen';
import ExitSuccessScreen from './src/screens/student/ExitSuccessScreen';
import StudentHistoryScreen from './src/screens/student/StudentHistoryScreen';
import StudentProfileScreen from './src/screens/student/StudentProfileScreen';

import SecurityDashboard from './src/screens/security/SecurityDashboard';
import ScanScreen from './src/screens/security/ScanScreen';
import ProcessingScreen from './src/screens/security/ProcessingScreen';
import AccessGrantedScreen from './src/screens/security/AccessGrantedScreen';
import ExitScanScreen from './src/screens/security/ExitScanScreen';
import ExitClearedScreen from './src/screens/security/ExitClearedScreen';
import OfficerProfileScreen from './src/screens/security/OfficerProfileScreen';
import VehicleSearchScreen from './src/screens/security/VehicleSearchScreen';
import SecurityLogsScreen from './src/screens/security/SecurityLogsScreen';

import AdminDashboard from './src/screens/admin/AdminDashboard';
import UserManagementScreen from './src/screens/admin/UserManagementScreen';
import AuthorizedVehiclesScreen from './src/screens/admin/AuthorizedVehiclesScreen';
import ReportsScreen from './src/screens/admin/ReportsScreen';
import ManageZonesScreen from './src/screens/admin/ManageZonesScreen';
import UnauthorizedLogsScreen from './src/screens/admin/UnauthorizedLogsScreen';
import SystemSettingsScreen from './src/screens/admin/SystemSettingsScreen';
import RoleManagementScreen from './src/screens/admin/RoleManagementScreen';
import SystemActivityScreen from './src/screens/admin/SystemActivityScreen';
import AdminProfileScreen from './src/screens/admin/AdminProfileScreen';
import AnalyticsScreen from './src/screens/admin/AnalyticsScreen';

const BACKEND_URL = config.BACKEND_URL;

// Axios Token Interceptor setup
axios.interceptors.request.use(async (reqConfig) => {
  try {
    const token = await AsyncStorage.getItem('@parknex_token');
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return reqConfig;
}, error => Promise.reject(error));

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
      <AdminStackNav.Screen name="Analytics" component={AnalyticsScreen} />
      <AdminStackNav.Screen name="AdminProfile">
        {props => <AdminProfileScreen {...props} onLogout={onLogout} />}
      </AdminStackNav.Screen>
    </AdminStackNav.Navigator>
  );
}

// Splash Screen
function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Auth');
    }, 1500);
  }, []);

  return (
    <View style={[styles.center, { backgroundColor: COLORS.primary }]}>
      <MaterialCommunityIcons name="car-connected" size={100} color="white" />
      <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', marginTop: 20 }}>ParkNex-AI</Text>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 8 }}>Smart Campus Parking Ecosystem</Text>
    </View>
  );
}

// Home Stack to handle nested navigation from Student Home
const HomeStackNav = createStackNavigator();
function HomeStack({ occupancy, navigation }) {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="StudentHome">
        {props => <StudentHomeScreen {...props} occupancy={occupancy} parentNavigation={navigation} />}
      </HomeStackNav.Screen>
      <HomeStackNav.Screen name="Vehicles" component={StudentVehiclesScreen} />
      <HomeStackNav.Screen name="Pass" component={StudentPassScreen} />
      <HomeStackNav.Screen name="LiveStatus" component={LiveStatusScreen} />
      <HomeStackNav.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStackNav.Screen name="SlotOccupied" component={SlotOccupiedAlertScreen} />
      <HomeStackNav.Screen name="ExitSuccess" component={ExitSuccessScreen} />
      <HomeStackNav.Screen name="History" component={StudentHistoryScreen} />
    </HomeStackNav.Navigator>
  );
}

// Student Tabs Navigator
const Tab = createBottomTabNavigator();
function StudentTabs({ occupancy, onLogout, user }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Pass') iconName = focused ? 'card' : 'card-outline';
          else if (route.name === 'Book') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size + 3} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { height: 72, paddingBottom: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.white },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11, marginTop: -3 },
      })}
    >
      <Tab.Screen name="Home">
        {props => <HomeStack {...props} occupancy={occupancy} />}
      </Tab.Screen>
      <Tab.Screen name="Map" component={StudentMapScreen} />
      <Tab.Screen name="Pass" component={StudentPassScreen} />
      <Tab.Screen name="Book" component={StudentBookScreen} />
      <Tab.Screen name="Profile">
        {props => <StudentProfileScreen {...props} onLogout={onLogout} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Security Bottom Tab Navigator
const SecurityTab = createBottomTabNavigator();
function SecurityTabs({ onLogout, user }) {
  return (
    <SecurityTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'shield' : 'shield-outline';
          else if (route.name === 'CCTV') iconName = focused ? 'videocam' : 'videocam-outline';
          else if (route.name === 'Visitors') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Violations') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size + 3} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { height: 72, paddingBottom: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11, marginTop: -3 },
      })}
    >
      <SecurityTab.Screen name="Home">
        {props => <SecurityStack {...props} onLogout={onLogout} />}
      </SecurityTab.Screen>
      <SecurityTab.Screen name="CCTV">
        {props => <SecurityDashboard {...props} onLogout={onLogout} initialTab="cctv" />}
      </SecurityTab.Screen>
      <SecurityTab.Screen name="Visitors">
        {props => <SecurityDashboard {...props} onLogout={onLogout} initialTab="visitors" />}
      </SecurityTab.Screen>
      <SecurityTab.Screen name="Violations">
        {props => <SecurityDashboard {...props} onLogout={onLogout} initialTab="violations" />}
      </SecurityTab.Screen>
      <SecurityTab.Screen name="Profile">
        {props => <OfficerProfileScreen {...props} onLogout={onLogout} user={user} />}
      </SecurityTab.Screen>
    </SecurityTab.Navigator>
  );
}

// Admin Bottom Tab Navigator
const AdminTab = createBottomTabNavigator();
function AdminTabs({ occupancy, events, onLogout, user }) {
  return (
    <AdminTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Zones') iconName = focused ? 'layers' : 'layers-outline';
          else if (route.name === 'Users') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Reports') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size + 3} color={color} />;
        },
        tabBarActiveTintColor: '#0F172A',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: { height: 72, paddingBottom: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11, marginTop: -3 },
      })}
    >
      <AdminTab.Screen name="Home">
        {props => <AdminStack {...props} occupancy={occupancy} events={events} onLogout={onLogout} />}
      </AdminTab.Screen>
      <AdminTab.Screen name="Zones" component={ManageZonesScreen} />
      <AdminTab.Screen name="Users" component={UserManagementScreen} />
      <AdminTab.Screen name="Reports" component={ReportsScreen} />
      <AdminTab.Screen name="Profile">
        {props => <AdminProfileScreen {...props} onLogout={onLogout} user={user} />}
      </AdminTab.Screen>
    </AdminTab.Navigator>
  );
}

// Main App Component
const Stack = createStackNavigator();
function MainApp() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [events, setEvents] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@parknex_user');
        const storedRole = await AsyncStorage.getItem('@parknex_role');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setRole(storedRole || 'STUDENT');
        }
      } catch (e) {
      } finally {
        setIsInitializing(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [occ, ev] = await Promise.all([
          axios.get(`${BACKEND_URL}/occupancy`),
          axios.get(`${BACKEND_URL}/events`)
        ]);
        setOccupancy(occ.data);
        setEvents(ev.data);
      } catch (e) {
        console.warn('Data fetch warning:', e.message);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLoginSuccess = async (userData, token) => {
    try {
      if (token) await AsyncStorage.setItem('@parknex_token', token);
      if (userData) {
        await AsyncStorage.setItem('@parknex_user', JSON.stringify(userData));
        await AsyncStorage.setItem('@parknex_role', userData.role || 'STUDENT');
        setUser(userData);
        setRole(userData.role || 'STUDENT');
      }
    } catch (e) {
      console.error('Login storage error:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@parknex_token');
      await AsyncStorage.removeItem('@parknex_user');
      await AsyncStorage.removeItem('@parknex_role');
      await supabase.auth.signOut().catch(() => {});
    } catch (e) {}
    setUser(null);
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
        {!user ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Auth">
              {props => <AuthScreen {...props} onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Main">
            {() => (
              <>
                {(role === 'STUDENT' || role === 'FACULTY' || !role) && <StudentTabs occupancy={occupancy} onLogout={handleLogout} user={user} />}
                {role === 'SECURITY' && <SecurityTabs onLogout={handleLogout} user={user} />}
                {(role === 'ADMIN' || role === 'CAMPUS_ADMIN' || role === 'DEPARTMENT_ADMIN') && <AdminTabs occupancy={occupancy} events={events} onLogout={handleLogout} user={user} />}
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
