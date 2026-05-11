import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, StatusBar, Platform, TextInput, Alert, Image, Dimensions, FlatList } from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as NotificationService from './notificationService';
import axios from 'axios';
import { supabase } from './supabaseClient';
import config from './config';

// Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

NotificationService.configureNotificationHandler();

const { width, height } = Dimensions.get('window');
const BACKEND_URL = config.BACKEND_URL;
const COLORS = config.COLORS;

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ==========================================
// SPLASH & ONBOARDING
// ==========================================
function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Onboarding');
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

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Easy Parking',
    description: 'Find and book parking slots across the campus in seconds.',
    icon: 'car-parking',
  },
  {
    id: '2',
    title: 'AI Vision',
    description: 'Automated entry and exit using advanced AI license plate recognition.',
    icon: 'eye-check',
  },
  {
    id: '3',
    title: 'Digital Pass',
    description: 'Seamless access with your personal dynamic QR code.',
    icon: 'qrcode-scan',
  }
];

function OnboardingScreen({ navigation }) {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <FlatList
        data={ONBOARDING_DATA}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, padding: 40, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ padding: 30, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 100 }}>
              <MaterialCommunityIcons name={item.icon} size={120} color={COLORS.primary} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginTop: 40, textAlign: 'center' }}>{item.title}</Text>
            <Text style={{ fontSize: 16, color: COLORS.textMuted, marginTop: 20, textAlign: 'center', lineHeight: 24 }}>{item.description}</Text>
          </View>
        )}
      />

      <View style={{ padding: 30 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 30 }}>
          {ONBOARDING_DATA.map((_, i) => (
            <View key={i} style={{ width: i === activeSlide ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === activeSlide ? COLORS.primary : COLORS.border }} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.replace('Auth')}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// AUTH SCREEN
// ==========================================
function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: role }
          }
        });
        if (error) throw error;
        Alert.alert('Success', 'Registration successful! You can now sign in.');
        setIsLogin(true);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.white }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ padding: 24, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 32, marginBottom: 24 }}>
            <Ionicons name="car-sport" size={64} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 36, fontWeight: '900', color: COLORS.text, marginBottom: 8, letterSpacing: -1 }}>ParkNex-AI</Text>
          <Text style={{ fontSize: 16, color: COLORS.textMuted, textAlign: 'center' }}>
            {isLogin ? 'Sign in to access your dashboard' : 'Create an account to get started'}
          </Text>
        </View>

        <View style={{ width: '100%', gap: 20 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {!isLogin && (
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>Select Your Role</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                {['STUDENT', 'SECURITY', 'ADMIN'].map(r => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    style={[
                      styles.roleSelectBtn,
                      { flex: 1 },
                      role === r && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                    ]}
                  >
                    <Text style={[
                      styles.roleSelectText,
                      role === r && { color: COLORS.white }
                    ]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, { height: 56, marginTop: 10 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setIsLogin(!isLogin)}>
            <Text style={{ textAlign: 'center', color: COLORS.primary, fontWeight: '700', fontSize: 15 }}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// STUDENT DASHBOARD
// ==========================================
// ==========================================
// STUDENT DASHBOARD SCREENS
// ==========================================

function StudentMapScreen({ occupancy }) {
  const getZoneColor = (occupied, total) => {
    const ratio = occupied / total;
    if (ratio > 0.9) return COLORS.danger;
    if (ratio > 0.7) return COLORS.warning;
    return COLORS.success;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>P</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Parking Map</Text>
            <Text style={styles.subtitle}>Find available spots</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="search" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.zonesGrid}>
          {occupancy?.zones.map(zone => {
            const available = zone.total - zone.occupied;
            const color = getZoneColor(zone.occupied, zone.total);

            return (
              <TouchableOpacity key={zone.id} style={styles.zoneCard}>
                <View style={styles.zoneHeader}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <View style={[styles.indicator, { backgroundColor: color }]} />
                </View>
                <Text style={styles.zoneAvailable}>
                  <Text style={{ color, fontSize: 32, fontWeight: '800' }}>{available}</Text>
                  <Text style={styles.zoneTotal}> / {zone.total}</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${(zone.occupied / zone.total) * 100}%`, backgroundColor: color }
                    ]}
                  />
                </View>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>{zone.occupied} spots filled</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StudentVehiclesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>My Vehicles</Text>
          <Text style={styles.subtitle}>Manage your registered cars</Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: COLORS.primary }]}>
          <Feather name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <View style={[styles.center, { padding: 40, flex: 1 }]}>
        <MaterialCommunityIcons name="car-multiple" size={100} color={COLORS.border} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 24 }}>No Vehicles Found</Text>
        <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 20 }}>Register your vehicle to get your automated parking pass and AI detection alerts.</Text>
        <TouchableOpacity style={[styles.primaryBtn, { width: '80%', marginTop: 32 }]}>
          <Text style={styles.primaryBtnText}>Add Vehicle</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StudentPassScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Digital Pass</Text>
          <Text style={styles.subtitle}>Scan at the entry gate</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={[styles.card, { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.white }]}>
          <View style={{ padding: 24, backgroundColor: 'white', borderRadius: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
            <QRCode value={"STUDENT_PASS_UP14AB1234_PRIYA"} size={220} />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.text, marginTop: 32, letterSpacing: 1 }}>UP14 AB1234</Text>
          <Text style={{ color: COLORS.textMuted, marginTop: 6, fontWeight: '600' }}>Valid until: Dec 2026</Text>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 40, width: '100%' }}>
            <View style={{ flex: 1, alignItems: 'center', padding: 20, backgroundColor: COLORS.surface, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 }}>STATUS</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.success, marginTop: 4 }}>ACTIVE</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', padding: 20, backgroundColor: COLORS.surface, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 }}>TYPE</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.primary, marginTop: 4 }}>MONTHLY</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StudentBillingScreen({ onLogout }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [passActive, setPassActive] = useState(false);

  const handlePurchase = async () => {
    setIsProcessing(true);
    setTimeout(() => {
      setPassActive(true);
      setIsProcessing(false);
      Alert.alert('Success', 'Monthly Pass activated for ₹2,500');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Billing & History</Text>
          <Text style={styles.subtitle}>Manage your subscriptions</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.iconBtn}>
          <Feather name="log-out" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={[styles.card, { padding: 24, backgroundColor: COLORS.primary, borderRadius: 24 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>ACTIVE PASS</Text>
            <MaterialCommunityIcons name="crown" size={24} color="white" />
          </View>
          <Text style={{ color: 'white', fontSize: 32, fontWeight: '900', marginTop: 12 }}>{passActive ? 'Premium Monthly' : 'No Active Pass'}</Text>
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 24 }} />
          <TouchableOpacity
            style={{ backgroundColor: 'white', padding: 18, borderRadius: 16, alignItems: 'center' }}
            onPress={handlePurchase}
            disabled={isProcessing || passActive}
          >
            <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 16 }}>
              {isProcessing ? 'Processing...' : passActive ? 'Manage Subscription' : 'Upgrade to Monthly - ₹2,500'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 40, marginBottom: 16 }]}>Parking History</Text>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[styles.eventItem, { marginBottom: 16, padding: 16 }]}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' }}>
              <Feather name={i % 2 === 0 ? "arrow-down-left" : "arrow-up-right"} size={22} color={i % 2 === 0 ? COLORS.success : COLORS.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.text }}>Zone {i % 2 === 0 ? 'B' : 'A'} {i % 2 === 0 ? 'Entry' : 'Exit'}</Text>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>May {10 - i}, 2026 • 09:15 AM</Text>
            </View>
            <Text style={{ fontWeight: '900', fontSize: 16, color: COLORS.text }}>₹0</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StudentTabs({ occupancy, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Vehicles') iconName = focused ? 'car-sport' : 'car-sport-outline';
          else if (route.name === 'Pass') iconName = focused ? 'qr-code' : 'qr-code-outline';
          else if (route.name === 'History') iconName = focused ? 'wallet' : 'wallet-outline';
          return <Ionicons name={iconName} size={size + 4} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { height: 100, paddingBottom: 40, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.white },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 12, marginTop: -5 },
      })}
    >
      <Tab.Screen name="Map">
        {props => <StudentMapScreen {...props} occupancy={occupancy} />}
      </Tab.Screen>
      <Tab.Screen name="Vehicles" component={StudentVehiclesScreen} />
      <Tab.Screen name="Pass" component={StudentPassScreen} />
      <Tab.Screen name="History">
        {props => <StudentBillingScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ==========================================
// SECURITY DASHBOARD
// ==========================================
function SecurityDashboard({ occupancy, events, onLogout, simulateEvent, triggerAIScan, isActionLoading }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Security Monitor</Text>
          <Text style={styles.subtitle}>Live Campus Feed</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.iconBtn}>
          <Feather name="log-out" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mock Live Feed */}
        <View style={[styles.card, { padding: 0, overflow: 'hidden', borderRadius: 24 }]}>
          <View style={{ height: 240, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="videocam" size={60} color="#333" />
            <Text style={{ color: '#666', marginTop: 12, fontWeight: '700' }}>Waiting for AI Stream...</Text>
            <View style={{ position: 'absolute', top: 20, left: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger, marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>LIVE • GATE 1</Text>
            </View>
            <TouchableOpacity
              style={{ position: 'absolute', bottom: 20, right: 20, backgroundColor: isActionLoading ? COLORS.textMuted : COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
              onPress={triggerAIScan}
              disabled={isActionLoading}
            >
              <Text style={{ color: 'white', fontWeight: '900' }}>{isActionLoading ? 'Processing...' : 'Run AI Scan'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 16 }}>
          <View style={[styles.card, { flex: 1, padding: 20, borderBottomWidth: 4, borderBottomColor: COLORS.primary }]}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted }}>OCCUPANCY</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.primary, marginTop: 8 }}>
              {occupancy?.occupiedSlots} <Text style={{ fontSize: 16, color: COLORS.textMuted }}>/ {occupancy?.totalSlots}</Text>
            </Text>
          </View>
          <View style={[styles.card, { flex: 1, padding: 20, borderBottomWidth: 4, borderBottomColor: COLORS.danger }]}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted }}>ALERTS</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.danger, marginTop: 8 }}>
              {events.filter(e => e.status === 'UNAUTHORIZED').length}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <TouchableOpacity 
            style={[styles.primaryBtn, { flex: 1, backgroundColor: COLORS.success }]} 
            onPress={() => simulateEvent('ENTRY')}
            disabled={isActionLoading}
          >
            <Text style={styles.primaryBtnText}>{isActionLoading ? '...' : 'Simulate Entry'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.primaryBtn, { flex: 1, backgroundColor: COLORS.warning }]} 
            onPress={() => simulateEvent('EXIT')}
            disabled={isActionLoading}
          >
            <Text style={styles.primaryBtnText}>{isActionLoading ? '...' : 'Simulate Exit'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Recent Activity</Text>
        <View style={{ gap: 12, paddingBottom: 40 }}>
          {events.slice(0, 8).map(event => (
            <View key={event.id} style={[styles.eventItem, { padding: 16, borderLeftWidth: 4, borderLeftColor: event.status === 'UNAUTHORIZED' ? COLORS.danger : COLORS.success }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '900', letterSpacing: 1 }}>{event.plateNumber}</Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                  {new Date(event.timestamp).toLocaleTimeString()} • Zone {event.zoneId?.slice(0, 4).toUpperCase()}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: event.status === 'UNAUTHORIZED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: event.status === 'UNAUTHORIZED' ? COLORS.danger : COLORS.success }}>{event.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
function AdminDashboard({ occupancy, onLogout }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Console</Text>
          <Text style={styles.subtitle}>System Overview</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={{ padding: 8, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}>
          <Feather name="log-out" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.zonesGrid}>
          <View style={[styles.card, { width: '100%', marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View>
              <Text style={styles.statusTitle}>Total Users</Text>
              <Text style={{ fontSize: 32, fontWeight: '800', color: COLORS.text, marginTop: 4 }}>1,248</Text>
            </View>
            <View style={{ padding: 16, backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: 20 }}>
              <Feather name="users" size={32} color={COLORS.primary} />
            </View>
          </View>

          <View style={[styles.card, { width: '100%', marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View>
              <Text style={styles.statusTitle}>System Status</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.success, marginTop: 4 }}>Online</Text>
            </View>
            <View style={{ padding: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 20 }}>
              <Feather name="check-circle" size={32} color={COLORS.success} />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Zone Management</Text>
        {occupancy?.zones.map(zone => (
          <View key={zone.id} style={[styles.eventItem, { marginBottom: 12 }]}>
            <View>
              <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>{zone.name}</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4, fontWeight: '500' }}>Capacity: {zone.total} slots</Text>
            </View>
            <TouchableOpacity style={{ padding: 8, backgroundColor: COLORS.bg, borderRadius: 8 }}>
              <Feather name="settings" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [events, setEvents] = useState([]);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    let notificationListener = { remove: () => {} };
    let responseListener = { remove: () => {} };
    let subscription = { unsubscribe: () => {} };

    // Setup notifications with error handling
    try {
      NotificationService.registerForPushNotificationsAsync()
        .then(token => {
          if (token) setExpoPushToken(token);
        })
        .catch(error => {
          console.warn('Failed to register for push notifications:', error.message);
        });

      const listeners = NotificationService.setupNotificationListeners(
        (notification) => {
          // Handle foreground notification
          console.log('App: Notification Received', notification);
        },
        (response) => {
          // Handle notification response (tap)
          console.log('App: Notification Response', response);
        }
      );
      notificationListener = listeners.notificationListener;
      responseListener = listeners.responseListener;

    } catch (error) {
      console.warn('Error during notification setup:', error.message);
    }

    // Always initialize auth regardless of notification setup
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user?.user_metadata?.role) setRole(session.user.user_metadata.role);
      });

      const authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session?.user?.user_metadata?.role) setRole(session.user.user_metadata.role);
        else setRole(null);
      });
      subscription = authSubscription.data;
    } catch (error) {
      console.warn('Error during auth initialization:', error.message);
    }

    return () => {
      try {
        subscription.unsubscribe();
        notificationListener.remove();
        responseListener.remove();
      } catch (error) {
        console.warn('Error during cleanup:', error.message);
      }
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    // Register push token
    if (expoPushToken) {
      axios.post(`${BACKEND_URL}/register-push-token`, {
        email: session.user.email,
        pushToken: expoPushToken,
        role: session.user.user_metadata.role
      }).catch(console.log);
    }

    const fetchData = async () => {
      try {
        const [occ, ev] = await Promise.all([
          axios.get(`${BACKEND_URL}/occupancy`),
          axios.get(`${BACKEND_URL}/events`)
        ]);
        setOccupancy(occ.data);
        setEvents(ev.data);
      } catch (e) { console.error(e); }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Event' },
        (payload) => {
          setEvents(prev => [payload.new, ...prev]);
          axios.get(`${BACKEND_URL}/occupancy`).then(res => setOccupancy(res.data));
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
      console.error('Error simulating event:', error);
      Alert.alert('Error', 'Failed to communicate with backend server.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const triggerAIScan = async () => {
    setIsActionLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/trigger-ai`);
      if (res.data.success) {
        Alert.alert('AI Vision', 'AI scan process started in the background!');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to start AI scan.';
      Alert.alert('AI Error', msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          <Stack.Screen name="Main">
            {() => (
              <>
                {role === 'STUDENT' && <StudentTabs occupancy={occupancy} onLogout={handleLogout} />}
                {role === 'SECURITY' && (
                  <SecurityDashboard 
                    occupancy={occupancy} 
                    events={events} 
                    onLogout={handleLogout} 
                    simulateEvent={simulateEvent} 
                    triggerAIScan={triggerAIScan}
                    isActionLoading={isActionLoading}
                  />
                )}
                {role === 'ADMIN' && <AdminDashboard occupancy={occupancy} events={events} onLogout={handleLogout} />}
              </>
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roleSelectBtn: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  roleSelectText: {
    color: COLORS.textMuted,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  greeting: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    padding: 24,
    paddingTop: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  zonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  zoneCard: {
    width: '47.5%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneName: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zoneAvailable: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
  },
  zoneTotal: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.01)',
  }
});
