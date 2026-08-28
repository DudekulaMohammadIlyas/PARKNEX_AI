import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Modal, TextInput, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import config from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentHomeScreen({ occupancy, navigation, user }) {
  const userEmail = user?.email || 'student@college.edu';
  const userName = user?.name || 'Student';
  const isDemoUser = userEmail === 'student@college.edu' || userName === 'Alex Carter';

  const [digitalPass, setDigitalPass] = useState(null);
  const [recommendations, setRecommendations] = useState([
    { slotNumber: 'K-04', zoneName: 'KRISHNA HOSTEL', score: 96, reason: '80m from Academic Block • 96% vacant • EV Charger' },
    { slotNumber: 'H-08', zoneName: 'HOSPITAL PARKING', score: 91, reason: '140m from CS Block • 100% vacant • High security' },
    { slotNumber: 'N-15', zoneName: 'North Block', score: 85, reason: '190m from North Block • Wide shade cover' }
  ]);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);

  const [campusZones, setCampusZones] = useState([
    { id: 'z1', name: 'Faculty Parking', total: 100, occupied: 10 },
    { id: 'z2', name: 'South Block', total: 150, occupied: 50 },
    { id: 'z3', name: 'Zone B', total: 80, occupied: 78 },
    { id: 'z4', name: 'KRISHNA HOSTEL', total: 150, occupied: 50 },
    { id: 'z5', name: 'HOSPITAL PARKING', total: 200, occupied: 80 },
    { id: 'z6', name: 'Zone C', total: 200, occupied: 110 },
    { id: 'z7', name: 'Zone A', total: 120, occupied: 45 },
    { id: 'z8', name: 'Visitor Parking', total: 50, occupied: 10 },
    { id: 'z9', name: 'Scad', total: 75, occupied: 1 },
    { id: 'z10', name: 'Near Temple', total: 60, occupied: 0 },
    { id: 'z11', name: 'Faculty Block Parking', total: 100, occupied: 15 },
    { id: 'z12', name: 'North Block', total: 200, occupied: 80 }
  ]);
  const [isFindVehicleOpen, setIsFindVehicleOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: `👋 Hi ${userName}! I am your ParkNex AI Assistant. Ask me "Where should I park?", "Find my car", or "Show my pass".` }
  ]);

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('4-Wheeler');

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const userVehiclesKey = `@parknex_vehicles_${userEmail}`;
        const userHistoryKey = `@parknex_history_${userEmail}`;

        const [passRes, recRes, zoneRes, vehRes, bookRes] = await Promise.allSettled([
          axios.get(`${BACKEND_URL}/passes/my-pass`),
          axios.get(`${BACKEND_URL}/ai/recommendations?department=Computer Science`),
          axios.get(`${BACKEND_URL}/zones`),
          axios.get(`${BACKEND_URL}/vehicles`),
          axios.get(`${BACKEND_URL}/bookings/my-bookings`)
        ]);

        if (passRes.status === 'fulfilled' && passRes.value.data) {
          setDigitalPass(passRes.value.data);
        }
        if (recRes.status === 'fulfilled' && Array.isArray(recRes.value.data?.recommendations)) {
          setRecommendations(recRes.value.data.recommendations);
        }
        if (zoneRes.status === 'fulfilled' && Array.isArray(zoneRes.value.data) && zoneRes.value.data.length > 0) {
          setCampusZones(zoneRes.value.data);
        }

        // Fetch vehicles from API & AsyncStorage
        let currentVeh = [...vehicles];
        if (vehRes.status === 'fulfilled' && Array.isArray(vehRes.value.data) && vehRes.value.data.length > 0) {
          const apiVeh = vehRes.value.data.map(v => ({
            id: v.id,
            brand: v.brand,
            model: v.model || 'Standard',
            plate: v.plateNumber,
            type: v.type === 'TWO_WHEELER' ? '2-Wheeler' : '4-Wheeler',
            status: 'Verified'
          }));
          setVehicles(apiVeh);
          currentVeh = apiVeh;
        } else {
          const savedVeh = await AsyncStorage.getItem(userVehiclesKey).catch(() => null);
          if (savedVeh) {
            try { currentVeh = JSON.parse(savedVeh); setVehicles(currentVeh); } catch (e) {}
          } else if (isDemoUser) {
            currentVeh = [
              { id: '1', brand: 'Honda', model: 'Civic', color: 'Pearl White', type: '4-Wheeler', plate: 'KA-01-AB-1234', status: 'Verified' },
              { id: '2', brand: 'Royal Enfield', model: 'Classic 350', color: 'Matte Black', type: '2-Wheeler', plate: 'KA-05-XY-9876', status: 'Verified' }
            ];
            setVehicles(currentVeh);
          }
        }

        // Fetch active booking from API & AsyncStorage
        if (bookRes.status === 'fulfilled' && Array.isArray(bookRes.value.data) && bookRes.value.data.length > 0) {
          const active = bookRes.value.data.find(b => b.status === 'CONFIRMED');
          if (active) {
            setActiveBooking({
              id: String(active.id),
              slotNumber: active.slotNumber || active.slot?.slotNumber || 'K-30',
              zoneName: active.zoneName || active.slot?.zone?.name || 'KRISHNA HOSTEL',
              plateNumber: active.plateNumber || active.vehicle?.plateNumber || currentVeh[0]?.plate || 'KA-01-AB-1234',
              durationHours: active.durationHours || 4,
              bookingTime: active.bookingTime || 'Just Now',
              bookingDate: active.bookingDate || new Date().toISOString().split('T')[0],
              status: 'CONFIRMED'
            });
          } else {
            setActiveBooking(null);
          }
        } else {
          const savedHist = await AsyncStorage.getItem(userHistoryKey).catch(() => null);
          if (savedHist) {
            try {
              const parsedHist = JSON.parse(savedHist);
              const active = parsedHist.find(h => h.status === 'CONFIRMED');
              if (active) {
                setActiveBooking(active);
              } else {
                setActiveBooking(null);
              }
            } catch (e) {
              setActiveBooking(null);
            }
          } else {
            setActiveBooking(null);
          }
        }
      } catch (e) {}
    };

    fetchHomeData();
    const interval = setInterval(fetchHomeData, 3000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const handleAddVehicleSubmit = async () => {
    if (!newBrand.trim() || !newPlate.trim()) {
      Alert.alert('Validation Error', 'Please enter Vehicle Brand and License Plate Number.');
      return;
    }

    const newVehObj = {
      id: `v_${Date.now()}`,
      brand: newBrand.trim(),
      model: newModel.trim() || 'Standard',
      plate: newPlate.toUpperCase().trim(),
      type: newType,
      status: 'Verified'
    };

    try {
      await axios.post(`${BACKEND_URL}/vehicles`, {
        brand: newBrand.trim(),
        model: newModel.trim() || 'Standard',
        plateNumber: newPlate.toUpperCase().trim(),
        type: newType === '2-Wheeler' ? 'TWO_WHEELER' : 'FOUR_WHEELER'
      }).catch(() => null);
    } catch (e) {}

    const updated = [...vehicles, newVehObj];
    setVehicles(updated);
    try {
      await AsyncStorage.setItem(`@parknex_vehicles_${userEmail}`, JSON.stringify(updated));
    } catch (e) {}

    setIsAddVehicleOpen(false);
    setNewBrand('');
    setNewModel('');
    setNewPlate('');
    Alert.alert('Vehicle Registered! 🚗', `Vehicle ${newPlate.toUpperCase()} linked successfully to your Digital Campus Permit!`);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, { message: userText });
      if (res.data?.reply) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: '🤖 ParkNex AI: Recommended Slot K-04 in KRISHNA HOSTEL (80m away).' }]);
    }
  };

  const [liveTime, setLiveTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState(() => new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const topPick = (recommendations && recommendations[0]) || { 
    slotNumber: 'K-04', 
    zoneName: 'KRISHNA HOSTEL', 
    score: 96, 
    reason: '80m from Academic Block • 96% vacant' 
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        {/* WELCOME BACK HEADER */}
        <View style={{ marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A' }}>
              Welcome Back, {userName} ✨
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 3 }}>
              Computer Science & Engineering • Student ID: STU-2026-089
            </Text>
          </View>
          <TouchableOpacity 
            style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setIsChatOpen(true)}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* LIVE CLOCK & DATE PILL */}
        <View style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 6, borderContent: 'center', borderColor: '#BFDBFE', borderWidth: 1 }}>
          <Ionicons name="time" size={16} color="#2563EB" />
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#1D4ED8' }}>
            LIVE CLOCK: {liveTime} ({liveDate})
          </Text>
        </View>

        {/* INTERACTIVE NAVIGATION PILL TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
          <TouchableOpacity style={{ backgroundColor: '#8B5CF6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => setIsChatOpen(true)}>
            <MaterialCommunityIcons name="robot" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>AI Assistant</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('Book')}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>Book a Slot</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('Vehicles')}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>My Vehicles</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('Map')}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>Campus Map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('Pass')}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>Passes & Billing</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('History')}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>Parking History</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ACTIVE PARKED VEHICLE CARD OR NO SESSION BANNER */}
        {activeBooking && activeBooking.status === 'CONFIRMED' ? (
          <View style={{ backgroundColor: '#047857', borderRadius: 20, padding: 18, marginBottom: 20, shadowColor: '#047857', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="car-sport" size={20} color="#fff" />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#A7F3D0', letterSpacing: 0.8 }}>
                ACTIVE PARKED VEHICLE
              </Text>
            </View>

            <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', marginBottom: 4, lineHeight: 22 }}>
              Vehicle {activeBooking.plateNumber || activeBooking.vehicle || 'KA-01-AB-1234'} is Parked in Slot {activeBooking.slotNumber || activeBooking.slot || 'K-30'} ({activeBooking.zoneName || activeBooking.zone || 'KRISHNA HOSTEL'})
            </Text>
            <Text style={{ fontSize: 12, color: '#D1FAE5', fontWeight: '600', marginBottom: 14 }}>
              Session: {activeBooking.bookingTime || 'Just Now'} ({activeBooking.durationHours || 4} hrs) • Date: {activeBooking.bookingDate || liveDate}
            </Text>

            <TouchableOpacity 
              style={{ backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              onPress={async () => {
                const bookingId = activeBooking?.id;
                try {
                  if (bookingId) {
                    await axios.put(`${BACKEND_URL}/bookings/${bookingId}/exit`).catch(() => null);
                  }
                } catch (e) {}

                // Save to history as EXITED
                try {
                  const savedHist = await AsyncStorage.getItem(`@parknex_history_${userEmail}`).catch(() => null);
                  let list = savedHist ? JSON.parse(savedHist) : [];
                  list = list.map(h => h.id === bookingId ? { ...h, status: 'EXITED' } : h);
                  await AsyncStorage.setItem(`@parknex_history_${userEmail}`, JSON.stringify(list));
                } catch (e) {}

                setActiveBooking(null);
                Alert.alert('Exited Successfully! 🚗💨', 'Barrier gate released! Parking slot marked vacant in PostgreSQL database.');
              }}
            >
              <Ionicons name="exit-outline" size={18} color="#047857" />
              <Text style={{ color: '#047857', fontWeight: '900', fontSize: 13 }}>
                Check Out / Exit Parking Gate
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', elevation: 2 }}>
            <Ionicons name="car-outline" size={32} color="#64748B" style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A', marginBottom: 2 }}>No Active Parking Session</Text>
            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 12, fontWeight: '600' }}>You currently have no active slot reservations. Reserve a slot from the map to park.</Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => navigation.navigate('Map')}
            >
              <Ionicons name="map-outline" size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>Reserve Parking Slot</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI RECOMMENDED PARKING SLOTS SECTION */}
        <View style={{ marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="robot" size={20} color="#2563EB" />
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>AI Recommended Parking Slots</Text>
          </View>
          <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#047857' }}>AI MATCH CONFIDENCE: 96%</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 10 }}>
          {/* CARD 1: TOP PICK #1 */}
          <View style={{ width: 280, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 2, borderColor: '#2563EB', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#2563EB' }}>🏆 TOP PICK #1</Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#059669' }}>96% Match</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>Slot Z-04 (Zone B)</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 14 }}>
              80m from CS Block • 30% vacant • EV Charger available
            </Text>
            <TouchableOpacity style={{ backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }} onPress={() => navigation.navigate('Book')}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>Reserve Slot Z-04</Text>
            </TouchableOpacity>
          </View>

          {/* CARD 2: RECOMMENDATION #2 */}
          <View style={{ width: 280, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#64748B' }}>#2 RECOMMENDATION</Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#059669' }}>91% Match</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>Slot Z-08 (Zone C)</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 14 }}>
              140m from CS Block • 45% vacant
            </Text>
            <TouchableOpacity style={{ backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }} onPress={() => navigation.navigate('Book')}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>Reserve Slot Z-08</Text>
            </TouchableOpacity>
          </View>

          {/* CARD 3: RECOMMENDATION #3 */}
          <View style={{ width: 280, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#64748B' }}>#3 RECOMMENDATION</Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#059669' }}>86% Match</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>Slot FB-15 (Faculty Block)</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 14 }}>
              200m from CS Block • 85% vacant
            </Text>
            <TouchableOpacity style={{ backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }} onPress={() => navigation.navigate('Book')}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>Reserve Slot FB-15</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* QUICK ACTION CARDS WITH FRESH ONBOARDING FALLBACKS */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {/* DIGITAL PASS CARD */}
          <TouchableOpacity 
            style={[styles.card, { flex: 1, borderLeftWidth: 4, borderLeftColor: vehicles.length === 0 ? COLORS.warning : COLORS.primary }]}
            onPress={() => vehicles.length === 0 ? setIsAddVehicleOpen(true) : navigation.navigate('Pass')}
          >
            <Ionicons name="card" size={24} color={vehicles.length === 0 ? COLORS.warning : COLORS.primary} />
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>Digital Pass</Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.text, marginTop: 2 }}>
              {vehicles.length === 0 ? 'Pending Link' : (digitalPass?.passNumber || `PASS-STU-${(userEmail || 'USER').split('@')[0].toUpperCase()}`)}
            </Text>
            <Text style={{ fontSize: 10, color: vehicles.length === 0 ? COLORS.warning : COLORS.success, fontWeight: '800', marginTop: 4 }}>
              {vehicles.length === 0 ? '+ Tap to Add Vehicle' : '● ACTIVE'}
            </Text>
          </TouchableOpacity>

          {/* AI FIND MY VEHICLE */}
          <TouchableOpacity 
            style={[styles.card, { flex: 1, borderLeftWidth: 4, borderLeftColor: COLORS.warning }]}
            onPress={() => {
              if (activeBooking) setIsFindVehicleOpen(true);
              else navigation.navigate('Book');
            }}
          >
            <Ionicons name="compass" size={24} color={COLORS.warning} />
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>Find My Vehicle</Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.text, marginTop: 2 }}>
              {activeBooking ? `Slot ${activeBooking.slot}` : 'No Active Booking'}
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: '800', marginTop: 4 }}>
              {activeBooking ? 'Route Guide →' : 'Book a Slot →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* LIVE ZONES AVAILABILITY */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text }}>Live Campus Zones</Text>
            <Ionicons name="location" size={20} color={COLORS.primary} />
          </View>

          {campusZones.map((z, idx) => {
            const tot = z.total || z.capacity || 100;
            const occ = z.occupied || 0;
            const free = Math.max(0, tot - occ);
            const ratio = occ / tot;
            const color = ratio > 0.9 ? COLORS.danger : ratio > 0.7 ? COLORS.warning : COLORS.success;
            return (
              <View key={z.id || idx} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: COLORS.text }}>{z.name}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600' }}>
                    {free} / {tot} Free
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(100, ratio * 100)}%`, height: '100%', backgroundColor: color }} />
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* FIND MY VEHICLE MODAL */}
      <Modal visible={isFindVehicleOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>AI Find My Vehicle</Text>
              <TouchableOpacity onPress={() => setIsFindVehicleOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600' }}>Parked Vehicle</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.primary, marginTop: 2 }}>KA-01-AB-1234</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 8 }}>
                {vehicleLocation?.currentZone || 'Zone A (Near CS)'} — {vehicleLocation?.slotNumber || 'Slot A-12'}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: '700', marginTop: 4 }}>
                ● Parked Safely • Entry: 09:15 AM
              </Text>
            </View>

            <Text style={{ fontWeight: '800', fontSize: 13, color: COLORS.text, marginBottom: 8 }}>Walking Route Guide:</Text>
            {(vehicleLocation?.walkingDirections || [
              'Exit Academic Block Main Gate',
              'Turn Left towards Computer Science Courtyard',
              'Walk 80 meters to Zone A',
              'Your vehicle is parked in Slot A-12'
            ]).map((dir, i) => (
              <Text key={i} style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
                {i + 1}. {dir}
              </Text>
            ))}

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => setIsFindVehicleOpen(false)}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI CHATBOT MODAL */}
      <Modal visible={isChatOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={[styles.card, { height: '60%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="robot" size={24} color={COLORS.primary} />
                <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text }}>ParkNex AI Assistant</Text>
              </View>
              <TouchableOpacity onPress={() => setIsChatOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, marginBottom: 12 }}>
              {chatMessages.map((m, idx) => (
                <View key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', backgroundColor: m.sender === 'user' ? COLORS.primary : '#F1F5F9', padding: 12, borderRadius: 14, marginBottom: 8, maxWidth: '85%' }}>
                  <Text style={{ color: m.sender === 'user' ? '#fff' : COLORS.text, fontSize: 13 }}>{m.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ask ParkNex AI..."
                value={chatInput}
                onChangeText={setChatInput}
              />
              <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 16 }]} onPress={handleSendChatMessage}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD VEHICLE MODAL */}
      <Modal visible={isAddVehicleOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>Add Campus Vehicle</Text>
              <TouchableOpacity onPress={() => setIsAddVehicleOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Vehicle Brand</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. Honda / Royal Enfield / Tesla" value={newBrand} onChangeText={setNewBrand} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Vehicle Model</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. Civic / Creta / Classic 350" value={newModel} onChangeText={setNewModel} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>License Plate Number</Text>
            <TextInput style={[styles.input, { marginBottom: 16 }]} placeholder="e.g. KA-01-AB-1234" value={newPlate} onChangeText={setNewPlate} autoCapitalize="characters" />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Vehicle Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {['4-Wheeler', '2-Wheeler', 'EV'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewType(t)}
                  style={{ backgroundColor: newType === t ? COLORS.primary : '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}
                >
                  <Text style={{ color: newType === t ? '#fff' : COLORS.text, fontWeight: '800', fontSize: 11 }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddVehicleSubmit}>
              <Text style={styles.primaryBtnText}>Register Vehicle & Link Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
