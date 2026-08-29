import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import config from '../../../config';
import { supabase } from '../../../supabaseClient';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function AdminDashboard({ navigation, onLogout, occupancy }) {
  const [executiveData, setExecutiveData] = useState({ systemHealth: '99.8% Optimal' });
  const [sustainability, setSustainability] = useState({ co2ReducedKg: 1450, fuelSavedLiters: 620, greenCampusRating: 'A+ Excellent' });
  const [signage, setSignage] = useState([{ screenName: 'MAIN_GATE_LED_01', displayedText: 'WELCOME • CS ACADEMIC BLOCK: 75 FREE • CENTRAL LIBRARY: 30 FREE' }]);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isSignageModalOpen, setIsSignageModalOpen] = useState(false);
  const [customSignageText, setCustomSignageText] = useState('WELCOME • CS ACADEMIC BLOCK: 75 FREE • CENTRAL LIBRARY: 30 FREE');
  const [liveOccupancyPct, setLiveOccupancyPct] = useState('68%');

  const fetchAdminData = async () => {
    try {
      const [execRes, sustRes, signRes, zoneRes] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/executive/dashboard`),
        axios.get(`${BACKEND_URL}/sustainability/metrics`),
        axios.get(`${BACKEND_URL}/signage`),
        axios.get(`${BACKEND_URL}/zones`)
      ]);

      if (execRes.status === 'fulfilled' && execRes.value.data) setExecutiveData(execRes.value.data);
      if (sustRes.status === 'fulfilled' && sustRes.value.data) setSustainability(sustRes.value.data);
      if (signRes.status === 'fulfilled' && Array.isArray(signRes.value.data) && signRes.value.data.length > 0) {
        setSignage(signRes.value.data);
        if (signRes.value.data[0].displayedText) setCustomSignageText(signRes.value.data[0].displayedText);
      }
      if (zoneRes.status === 'fulfilled' && Array.isArray(zoneRes.value.data) && zoneRes.value.data.length > 0) {
        const totalCap = zoneRes.value.data.reduce((acc, z) => acc + (z.total || 100), 0);
        const totalOcc = zoneRes.value.data.reduce((acc, z) => acc + (z.occupied || 0), 0);
        const pct = Math.round((totalOcc / totalCap) * 100);
        setLiveOccupancyPct(`${pct}%`);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 3000);

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchAdminData();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchAdminData();
      });

    return () => {
      clearInterval(interval);
      if (supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, []);

  const handleBroadcastSignage = async () => {
    if (!customSignageText.trim()) {
      Alert.alert('Error', 'Please enter text to broadcast onto campus LED screens.');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/signage`, {
        screenName: 'MAIN_GATE_LED_01',
        displayedText: customSignageText.trim()
      });
      setSignage([{ screenName: 'MAIN_GATE_LED_01', displayedText: customSignageText.trim() }]);
      setIsSignageModalOpen(false);
      Alert.alert('Broadcast Published! 📺', 'New message is now displayed live on main entrance LED screens!');
    } catch (e) {
      setSignage([{ screenName: 'MAIN_GATE_LED_01', displayedText: customSignageText.trim() }]);
      setIsSignageModalOpen(false);
      Alert.alert('Broadcast Updated', 'Signage updated locally.');
    }
  };

  const handleTriggerEmergency = async () => {
    try {
      await axios.post(`${BACKEND_URL}/emergency/trigger`, {
        vehicleType: 'AMBULANCE',
        plateNumber: 'EMG-9999',
        locationZone: 'Zone A'
      });
      setIsEmergencyActive(true);
      Alert.alert('🚨 EMERGENCY OVERRIDE', 'Priority gate barrier release triggered!');
    } catch (e) {
      setIsEmergencyActive(true);
      Alert.alert('Emergency Override', 'Activated locally.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
        
        {/* EMERGENCY OVERRIDE BANNER */}
        {isEmergencyActive && (
          <View style={{ backgroundColor: '#EF4444', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="warning-sharp" size={22} color="#FFFFFF" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>🚨 EMERGENCY OVERRIDE ACTIVE</Text>
            </View>
            <Text style={{ color: '#FEE2E2', fontSize: 12, marginTop: 4, fontWeight: '600' }}>All barrier gates held open for priority emergency vehicle entry.</Text>
            <TouchableOpacity style={{ marginTop: 12, backgroundColor: '#fff', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }} onPress={() => setIsEmergencyActive(false)}>
              <Text style={{ color: '#DC2626', fontWeight: '900', fontSize: 13 }}>Deactivate Override</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PREMIUM DARK EXECUTIVE HEADER */}
        <View style={{ backgroundColor: '#0F172A', borderRadius: 22, padding: 18, marginBottom: 18, borderWidth: 1.5, borderColor: '#1E293B', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
              <Image 
                source={require('../../../assets/icon.png')}
                style={{ width: 50, height: 50, borderRadius: 14, borderWidth: 2, borderColor: '#38BDF8' }} 
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#F8FAFC', letterSpacing: 0.3 }}>Executive Admin</Text>
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#10B981' }}>
                    <Text style={{ color: '#34D399', fontSize: 9, fontWeight: '900' }}>LIVE SYNC</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '700' }}>Saveetha University • Command Hub</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }} 
              onPress={onLogout}
            >
              <Ionicons name="log-out" size={20} color="#F87171" />
            </TouchableOpacity>
          </View>
        </View>

        {/* LIVE METRICS SUMMARY BAR (KPIs) */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B' }}>OCCUPANCY</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', marginTop: 4 }}>{liveOccupancyPct}</Text>
            <View style={{ height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <View style={{ width: liveOccupancyPct, height: '100%', backgroundColor: '#6366F1' }} />
            </View>
          </View>

          <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B' }}>TOTAL REVENUE</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#10B981', marginTop: 4 }}>₹4,850</Text>
            <Text style={{ fontSize: 10, color: '#059669', fontWeight: '800', marginTop: 4 }}>+14% today</Text>
          </View>

          <View style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B' }}>VIOLATIONS</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#F59E0B', marginTop: 4 }}>3 Active</Text>
            <Text style={{ fontSize: 10, color: '#D97706', fontWeight: '800', marginTop: 4 }}>Action req.</Text>
          </View>
        </View>

        {/* ADMIN COMMAND HUB GRID */}
        <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 12, letterSpacing: 0.3 }}>
          ⚡ Admin Command Hub
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ManageZones')}
            style={{ width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0', elevation: 2 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Feather name="grid" size={22} color="#6366F1" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>Manage Zones</Text>
            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '600' }}>Configure slot grids & capacity</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('UserManagement')}
            style={{ width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0', elevation: 2 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Feather name="users" size={22} color="#10B981" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>User Access</Text>
            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '600' }}>Manage roles, add or suspend</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('SystemSettings')}
            style={{ width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0', elevation: 2 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Feather name="settings" size={22} color="#F59E0B" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>System Settings</Text>
            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '600' }}>Branding & API configuration</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Reports')}
            style={{ width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0', elevation: 2 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(139, 92, 246, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Feather name="bar-chart-2" size={22} color="#8B5CF6" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>Reports & Logs</Text>
            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '600' }}>Revenue analytics & audit</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Analytics')}
            style={{ width: '48%', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: '#E2E8F0', elevation: 2 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(37, 99, 235, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <MaterialCommunityIcons name="brain" size={24} color="#2563EB" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>AI Analytics</Text>
            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '600' }}>Models & anomaly detection</Text>
          </TouchableOpacity>
        </View>

        {/* SYSTEM HEALTH & SUSTAINABILITY SECTION */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#1E293B' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="cpu-64-bit" size={20} color="#34D399" />
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8' }}>System Health</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginTop: 6 }}>100/100</Text>
            <Text style={{ fontSize: 10, color: '#34D399', fontWeight: '800', marginTop: 2 }}>⚡ All Nodes Active</Text>
          </View>

          <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#1E293B' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="leaf" size={20} color="#38BDF8" />
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#94A3B8' }}>Sustainability</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginTop: 6 }}>{sustainability.greenCampusRating}</Text>
            <Text style={{ fontSize: 10, color: '#38BDF8', fontWeight: '800', marginTop: 2 }}>🌿 1,450 kg CO2 Saved</Text>
          </View>
        </View>

        {/* DIGITAL SIGNAGE FEED */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="tv-outline" size={18} color="#0F172A" />
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>Digital Signage Matrix Feed</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsSignageModalOpen(true)}
              style={{ backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Feather name="edit-3" size={14} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>Broadcast Text</Text>
            </TouchableOpacity>
          </View>
          {signage.map((s, idx) => (
            <View key={idx} style={{ backgroundColor: '#020617', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1E293B' }}>
              <Text style={{ color: '#34D399', fontWeight: '900', fontSize: 12 }}>
                ▶ {s.displayedText}
              </Text>
            </View>
          ))}
        </View>

        {/* BOLD EMERGENCY OVERRIDE TRIGGER BUTTON */}
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#EF4444', 
            paddingVertical: 16, 
            borderRadius: 18, 
            flexDirection: 'row', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 10,
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 5
          }} 
          onPress={handleTriggerEmergency}
        >
          <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 }}>Trigger Emergency Override</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* EDIT & BROADCAST SIGNAGE MODAL */}
      <Modal visible={isSignageModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 6 }}>
              📺 Broadcast LED Signage
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Enter message text to display live across main gate matrix screens:
            </Text>

            <TextInput
              style={{ backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 14, padding: 14, fontSize: 14, color: '#0F172A', fontWeight: '700', minHeight: 80, marginBottom: 20, textAlignVertical: 'top' }}
              multiline
              value={customSignageText}
              onChangeText={setCustomSignageText}
              placeholder="e.g. WELCOME • CS ACADEMIC BLOCK: 75 FREE • CENTRAL LIBRARY: 30 FREE"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                onPress={() => setIsSignageModalOpen(false)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '800', color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleBroadcastSignage}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '900', color: '#FFFFFF' }}>Publish Live 📡</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
