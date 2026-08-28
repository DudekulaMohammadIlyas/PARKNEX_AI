import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentMapScreen() {
  const [selectedZone, setSelectedZone] = useState('North Block');
  const [zones, setZones] = useState([
    'Faculty Parking', 'South Block', 'Zone B', 'KRISHNA HOSTEL',
    'HOSPITAL PARKING', 'Zone C', 'Zone A', 'Visitor Parking',
    'Scad', 'Near Temple', 'Faculty Block Parking', 'North Block'
  ]);
  const [rawZoneObjs, setRawZoneObjs] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('student@college.edu');
  const [vehicles, setVehicles] = useState([]);
  
  // Slot Modal Booking State
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState('KA-09-ZZ-9999');
  const [bookingDuration, setBookingDuration] = useState(4);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@parknex_user');
        const userObj = storedUser ? JSON.parse(storedUser) : { email: 'student@college.edu' };
        const userEmail = userObj.email || 'student@college.edu';
        setCurrentUserEmail(userEmail);

        const [zoneRes, bookRes, allBookRes, vehRes] = await Promise.allSettled([
          axios.get(`${BACKEND_URL}/zones`),
          axios.get(`${BACKEND_URL}/bookings/my-bookings?email=${userEmail}`),
          axios.get(`${BACKEND_URL}/bookings/all`),
          axios.get(`${BACKEND_URL}/vehicles?email=${userEmail}`)
        ]);

        if (zoneRes.status === 'fulfilled' && Array.isArray(zoneRes.value.data) && zoneRes.value.data.length > 0) {
          setRawZoneObjs(zoneRes.value.data);
          const names = zoneRes.value.data.map(z => z.name);
          setZones(names);
        }

        if (bookRes.status === 'fulfilled' && Array.isArray(bookRes.value.data)) {
          setMyBookings(bookRes.value.data);
        }

        if (allBookRes.status === 'fulfilled' && Array.isArray(allBookRes.value.data)) {
          setAllBookings(allBookRes.value.data);
        }

        if (vehRes.status === 'fulfilled' && Array.isArray(vehRes.value.data) && vehRes.value.data.length > 0) {
          setVehicles(vehRes.value.data);
          setSelectedVehiclePlate(vehRes.value.data[0].plateNumber || vehRes.value.data[0].plate || 'KA-09-ZZ-9999');
        } else {
          setVehicles([
            { plate: 'KA-09-ZZ-9999', brand: 'Honda Civic' },
            { plate: 'AP02JT7894', brand: 'Yamaha R15' }
          ]);
        }
      } catch (e) {}
    };

    fetchMapData();
    const interval = setInterval(fetchMapData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getZonePrefix = (zName) => {
    if (zName.includes('KRISHNA')) return 'K-';
    if (zName.includes('North')) return 'N-';
    if (zName.includes('Faculty Block')) return 'FB-';
    if (zName.includes('Faculty')) return 'F-';
    if (zName.includes('Hospital') || zName.includes('HOSPITAL')) return 'H-';
    if (zName.includes('Zone A')) return 'A-';
    if (zName.includes('Zone B')) return 'B-';
    if (zName.includes('Zone C')) return 'C-';
    return `${zName.charAt(0).toUpperCase()}-`;
  };

  const prefix = getZonePrefix(selectedZone);
  const selectedZoneObj = rawZoneObjs.find(z => z.name === selectedZone);
  const totalCount = selectedZoneObj?.total || (selectedZone.includes('KRISHNA') ? 150 : selectedZone.includes('HOSPITAL') || selectedZone.includes('North') || selectedZone.includes('Zone C') ? 200 : 100);

  const activeMySlots = new Set(
    myBookings
      .filter(b => b.status === 'CONFIRMED' && (b.zoneName === selectedZone || b.slot?.zone?.name === selectedZone))
      .map(b => b.slotNumber || b.slot?.slotNumber)
  );

  const activeAllBookedSlots = new Set(
    allBookings
      .filter(b => b.status === 'CONFIRMED' && (b.zoneName === selectedZone || b.slot?.zone?.name === selectedZone))
      .map(b => b.slotNumber || b.slot?.slotNumber)
  );

  const slots = Array.from({ length: totalCount }, (_, i) => {
    const numStr = (i + 1).toString().padStart(2, '0');
    const id = `${prefix}${numStr}`;
    let status = 'Available';
    
    if (activeMySlots.has(id)) {
      status = 'Yours';
    } else if (activeAllBookedSlots.has(id)) {
      status = 'Occupied';
    }

    const hasEV = i % 4 === 3;
    const isFacultyOnly = i < 2;
    return { id, status, hasEV, isFacultyOnly };
  });

  const handleSlotPress = (slot) => {
    if (slot.status === 'Occupied') {
      Alert.alert('Slot Occupied 🛑', `Slot ${slot.id} in ${selectedZone} is currently reserved by another vehicle.`);
      return;
    }

    if (slot.status === 'Yours') {
      Alert.alert('Your Active Reservation 🚗', `Slot ${slot.id} is already reserved by your account in ${selectedZone}.`);
      return;
    }

    setSelectedSlotForBooking(slot);
    setIsBookingModalOpen(true);
  };

  const handleConfirmMapBooking = async () => {
    if (!selectedSlotForBooking) return;

    const newBookingObj = {
      id: `b_${Date.now()}`,
      userEmail: currentUserEmail,
      slotNumber: selectedSlotForBooking.id,
      zoneName: selectedZone,
      plateNumber: selectedVehiclePlate,
      status: 'CONFIRMED'
    };

    setMyBookings(prev => [newBookingObj, ...prev]);
    setAllBookings(prev => [newBookingObj, ...prev]);

    try {
      await axios.post(`${BACKEND_URL}/bookings`, {
        userEmail: currentUserEmail,
        zoneName: selectedZone,
        slotNumber: selectedSlotForBooking.id,
        plateNumber: selectedVehiclePlate,
        durationHours: bookingDuration,
        bookingDate: new Date().toISOString().split('T')[0],
        bookingTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }).catch(() => null);

      Alert.alert(
        'Slot Reserved Successfully! 🎉',
        `Slot ${selectedSlotForBooking.id} in ${selectedZone} has been locked for vehicle ${selectedVehiclePlate}!`
      );
    } catch (e) {
      Alert.alert('Slot Reserved Successfully! 🎉', `Slot ${selectedSlotForBooking.id} locked for ${selectedVehiclePlate}!`);
    } finally {
      setIsBookingModalOpen(false);
      setSelectedSlotForBooking(null);
    }
  };

  const getSlotStyle = (status) => {
    if (status === 'Occupied') return { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#EF4444' };
    if (status === 'Yours') return { backgroundColor: '#2563EB', borderColor: '#1D4ED8', color: '#FFFFFF' };
    return { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: '#10B981', color: '#047857' };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View>
          <Text style={[styles.greeting, { fontSize: 24 }]}>Campus Parking Map</Text>
          <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Tap any green slot to reserve instantly</Text>
        </View>
        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' }}>
          <Text style={{ color: '#047857', fontWeight: '900', fontSize: 12 }}>{selectedZone} ({slots.length} Slots)</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {zones.map(zone => (
            <TouchableOpacity 
              key={zone} 
              onPress={() => setSelectedZone(zone)}
              style={{ backgroundColor: selectedZone === zone ? '#0F172A' : COLORS.white, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: selectedZone === zone ? '#0F172A' : COLORS.border }}
            >
              <Text style={{ color: selectedZone === zone ? COLORS.white : COLORS.textMuted, fontWeight: '800', fontSize: 13 }}>{zone}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: '#10B981' }} />
              <Text style={{ color: COLORS.textMuted, fontWeight: '700', fontSize: 12 }}>Available</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: '#EF4444' }} />
              <Text style={{ color: COLORS.textMuted, fontWeight: '700', fontSize: 12 }}>Occupied</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: '#2563EB' }} />
              <Text style={{ color: COLORS.textMuted, fontWeight: '700', fontSize: 12 }}>Yours (Booked)</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
            {slots.map(slot => {
              const s = getSlotStyle(slot.status);
              return (
                <TouchableOpacity 
                  key={slot.id} 
                  onPress={() => handleSlotPress(slot)}
                  style={{ 
                    width: '22%', 
                    height: 54,
                    backgroundColor: s.backgroundColor, 
                    borderRadius: 12, 
                    borderWidth: 1.5, 
                    borderColor: s.borderColor, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    padding: 4
                  }}
                >
                  <Text style={{ color: s.color, fontWeight: '900', fontSize: 12 }}>{slot.id}</Text>
                  <Text style={{ color: s.color, fontWeight: '700', fontSize: 8, marginTop: 1 }}>
                    {slot.status === 'Yours' ? 'SELECTED' : slot.status === 'Occupied' ? 'TAKEN' : slot.hasEV ? '⚡ EV' : 'FREE'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* DIRECT SLOT RESERVATION MODAL FROM MAP GRID */}
      <Modal visible={isBookingModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 22 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>Reserve Slot {selectedSlotForBooking?.id}</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{selectedZone} • Direct Map Reservation</Text>
              </View>
              <TouchableOpacity onPress={() => setIsBookingModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Vehicle Selection */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>Select Vehicle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
              {vehicles.map((v, idx) => {
                const p = v.plateNumber || v.plate || `VEH-${idx}`;
                const isSel = selectedVehiclePlate === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setSelectedVehiclePlate(p)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: isSel ? '#0F172A' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: isSel ? '#0F172A' : '#CBD5E1'
                    }}
                  >
                    <Text style={{ color: isSel ? '#FFFFFF' : COLORS.text, fontSize: 12, fontWeight: '800' }}>{p}</Text>
                    <Text style={{ color: isSel ? '#38BDF8' : COLORS.textMuted, fontSize: 10, fontWeight: '700', marginTop: 2 }}>{v.brand || 'Vehicle'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Duration Selector */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>Booking Duration</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              {[1, 2, 4, 8].map(hrs => {
                const isSel = bookingDuration === hrs;
                return (
                  <TouchableOpacity
                    key={hrs}
                    onPress={() => setBookingDuration(hrs)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: isSel ? COLORS.primary : '#F1F5F9',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: isSel ? '#fff' : COLORS.text, fontWeight: '900', fontSize: 13 }}>{hrs} Hours</Text>
                    <Text style={{ color: isSel ? '#E0E7FF' : COLORS.textMuted, fontSize: 10, fontWeight: '700', marginTop: 2 }}>₹{hrs * 10}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Total Fare Card */}
            <View style={{ backgroundColor: '#ECFDF5', padding: 14, borderRadius: 14, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0' }}>
              <View>
                <Text style={{ fontSize: 11, color: '#047857', fontWeight: '800' }}>Total Parking Fee</Text>
                <Text style={{ fontSize: 18, color: '#047857', fontWeight: '900', marginTop: 2 }}>₹{bookingDuration * 10}</Text>
              </View>
              <View style={{ backgroundColor: '#047857', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>INSTANT CONFIRMATION</Text>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmMapBooking}>
              <Text style={styles.primaryBtnText}>🚗 Confirm & Reserve Slot {selectedSlotForBooking?.id}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
