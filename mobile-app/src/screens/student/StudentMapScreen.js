import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config, { smartApiRequest } from '../../../config';
import { supabase } from '../../../supabaseClient';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentMapScreen() {
  const [selectedZone, setSelectedZone] = useState('KRISHNA HOSTEL');
  const [zones, setZones] = useState([
    'KRISHNA HOSTEL', 'South Block', 'Central Library',
    'HOSPITAL PARKING', 'Hostel Complex', 'CS Academic Block', 'Visitor Parking', 'Scad'
  ]);
  const [rawZoneObjs, setRawZoneObjs] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('student@college.edu');
  const [userRole, setUserRole] = useState('STUDENT');
  const [vehicles, setVehicles] = useState([]);
  const [aiRec, setAiRec] = useState(null);
  
  // Slot Modal Booking State
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState('');
  const [bookingDuration, setBookingDuration] = useState(4);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMapData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@parknex_user');
        const userObj = storedUser ? JSON.parse(storedUser) : { email: 'student@college.edu', role: 'STUDENT' };
        const userEmail = userObj.email || 'student@college.edu';
        const role = (userObj.role || 'STUDENT').toUpperCase();
        const isStaffOrFaculty = role === 'FACULTY' || role === 'STAFF';

        if (isMounted) {
          setCurrentUserEmail(userEmail);
          setUserRole(role);
        }

        const [zoneRes, bookRes, allBookRes, vehRes, recRes] = await Promise.allSettled([
          smartApiRequest('get', `/zones?role=${encodeURIComponent(role)}`),
          smartApiRequest('get', `/bookings/my-bookings?email=${encodeURIComponent(userEmail)}`),
          smartApiRequest('get', '/bookings/all'),
          smartApiRequest('get', `/vehicles?email=${encodeURIComponent(userEmail)}`),
          smartApiRequest('get', `/ai/recommendations?department=Computer Science&role=${encodeURIComponent(role)}&email=${encodeURIComponent(userEmail)}`)
        ]);

        if (recRes.status === 'fulfilled' && Array.isArray(recRes.value.data?.recommendations) && isMounted) {
          const recs = recRes.value.data.recommendations;
          const roleFiltered = isStaffOrFaculty
            ? recs.filter(r => (r.zoneName || '').toLowerCase().includes('staff') || (r.zoneName || '').toLowerCase().includes('faculty'))
            : recs.filter(r => !(r.zoneName || '').toLowerCase().includes('staff') && !(r.zoneName || '').toLowerCase().includes('faculty'));
          setAiRec(roleFiltered[0] || (isStaffOrFaculty ? { slotNumber: 'SP-01', zoneName: 'Staff Parking', score: 98, reason: 'Staff Priority Bay • 45m away' } : recs[0] || null));
        }

        if (zoneRes.status === 'fulfilled' && Array.isArray(zoneRes.value.data) && zoneRes.value.data.length > 0 && isMounted) {
          setRawZoneObjs(zoneRes.value.data);
          const filtered = isStaffOrFaculty
            ? zoneRes.value.data.filter(z => z.isStaffOnly || z.isFacultyOnly || z.name.toLowerCase().includes('staff') || z.name.toLowerCase().includes('faculty'))
            : zoneRes.value.data.filter(z => !z.isStaffOnly && !z.isFacultyOnly && !z.name.toLowerCase().includes('faculty') && !z.name.toLowerCase().includes('staff'));
          const names = filtered.map(z => z.name);
          setZones(names);
          if (isStaffOrFaculty && (!selectedZone.toLowerCase().includes('staff') && !selectedZone.toLowerCase().includes('faculty'))) {
            setSelectedZone(names[0] || 'Staff Parking');
          } else if (!isStaffOrFaculty && (selectedZone.toLowerCase().includes('faculty') || selectedZone.toLowerCase().includes('staff'))) {
            setSelectedZone(names[0] || 'KRISHNA HOSTEL');
          }
        }

        if (bookRes.status === 'fulfilled' && Array.isArray(bookRes.value.data) && isMounted) {
          setMyBookings(bookRes.value.data);
        }

        if (allBookRes.status === 'fulfilled' && Array.isArray(allBookRes.value.data) && isMounted) {
          setAllBookings(allBookRes.value.data);
        }

        if (vehRes.status === 'fulfilled' && Array.isArray(vehRes.value.data) && vehRes.value.data.length > 0 && isMounted) {
          setVehicles(vehRes.value.data);
          setSelectedVehiclePlate(prev => prev || vehRes.value.data[0].plateNumber || vehRes.value.data[0].plate || '');
        } else if (isMounted) {
          // Check local cache
          const localVeh = await AsyncStorage.getItem(`@parknex_vehicles_${userEmail.toLowerCase()}`).catch(() => null);
          if (localVeh) {
            try {
              const parsed = JSON.parse(localVeh);
              setVehicles(parsed);
              if (parsed.length > 0) setSelectedVehiclePlate(prev => prev || parsed[0].plate);
            } catch (e) {}
          }
        }
      } catch (e) {}
    };

    fetchMapData();
    const interval = setInterval(fetchMapData, 3000);

    const chName = `student-map-realtime-${Date.now()}`;
    const channel = supabase
      .channel(chName)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchMapData();
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') fetchMapData();
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (supabase && supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, []);

  const getZonePrefix = (zName) => {
    if (zName.includes('KRISHNA')) return 'K-';
    if (zName.includes('North')) return 'N-';
    if (zName.includes('Staff Block') || zName.includes('Faculty Block')) return 'SB-';
    if (zName.includes('Staff') || zName.includes('Faculty')) return 'SP-';
    if (zName.includes('Hospital') || zName.includes('HOSPITAL')) return 'H-';
    if (zName.includes('Zone A')) return 'A-';
    if (zName.includes('Zone B')) return 'B-';
    if (zName.includes('Zone C')) return 'C-';
    return `${zName.charAt(0).toUpperCase()}-`;
  };

  const prefix = getZonePrefix(selectedZone);
  const selectedZoneObj = rawZoneObjs.find(z => z.name === selectedZone);
  const totalCount = selectedZoneObj?.total || (selectedZone.includes('KRISHNA') ? 150 : selectedZone.includes('HOSPITAL') || selectedZone.includes('North') || selectedZone.includes('Zone C') ? 200 : 100);

  const todayStr = new Date().toISOString().split('T')[0];

  const activeMySlots = new Set(
    myBookings
      .filter(b => {
        const isConfirmed = b.status === 'CONFIRMED' || !b.status;
        const bZone = (b.zoneName || b.slot?.zone?.name || b.zone || '').trim().toLowerCase();
        const selZone = selectedZone.trim().toLowerCase();
        const zoneMatch = bZone === selZone;
        const bDate = b.bookingDate || b.date;
        const dateMatch = !bDate || bDate === todayStr;
        return isConfirmed && zoneMatch && dateMatch;
      })
      .map(b => ((b.slotNumber || b.slot?.slotNumber || b.slot || '').toString()).trim().toUpperCase())
  );

  const activeAllBookedSlots = new Set(
    allBookings
      .filter(b => {
        const isConfirmed = b.status === 'CONFIRMED' || !b.status;
        const bZone = (b.zoneName || b.slot?.zone?.name || b.zone || '').trim().toLowerCase();
        const selZone = selectedZone.trim().toLowerCase();
        const zoneMatch = bZone === selZone;
        const bDate = b.bookingDate || b.date;
        const dateMatch = !bDate || bDate === todayStr;
        return isConfirmed && zoneMatch && dateMatch;
      })
      .map(b => ((b.slotNumber || b.slot?.slotNumber || b.slot || '').toString()).trim().toUpperCase())
  );

  const isStaffOrFaculty = userRole === 'FACULTY' || userRole === 'STAFF';
  const isZoneFacultyOnly = selectedZone.toLowerCase().includes('faculty') || selectedZone.toLowerCase().includes('staff') || selectedZoneObj?.isFacultyOnly;

  const slots = Array.from({ length: totalCount }, (_, i) => {
    const numStr = (i + 1).toString().padStart(2, '0');
    const id = `${prefix}${numStr}`.toUpperCase();
    let status = 'Available';
    
    if (activeMySlots.has(id)) {
      status = 'Yours';
    } else if (activeAllBookedSlots.has(id)) {
      status = 'Occupied';
    }

    const hasEV = i % 4 === 3;
    // Dedicated staff zone is restricted to non-staff. Regular campus zones have ALL slots available to students!
    const isFacultyOnly = isZoneFacultyOnly && !isStaffOrFaculty;
    return { id, status, hasEV, isFacultyOnly };
  });

  const handleSlotPress = (slot) => {
    if (slot.isFacultyOnly || (isZoneFacultyOnly && !isStaffOrFaculty)) {
      Alert.alert('Staff Only Zone 🛑', `${selectedZone} is exclusively reserved for Staff members.`);
      return;
    }

    if (!isZoneFacultyOnly && isStaffOrFaculty) {
      Alert.alert('Staff Allocation Notice 🛑', 'Staff members must park exclusively in designated Staff zones and cannot reserve normal student slots.');
      return;
    }

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

    if (isZoneFacultyOnly && !isStaffOrFaculty) {
      Alert.alert('Access Restricted 🛑', 'This parking zone is exclusively reserved for Staff members.');
      return;
    }

    if (!isZoneFacultyOnly && isStaffOrFaculty) {
      Alert.alert('Access Restricted 🛑', 'Staff members must park exclusively in designated Staff Parking zones and cannot book in general student zones.');
      return;
    }

    if (!selectedVehiclePlate || vehicles.length === 0) {
      Alert.alert('No Registered Vehicle 🚗', 'You must register a vehicle plate before reserving a slot. Please add your vehicle under My Vehicles first.');
      return;
    }

    const slotId = selectedSlotForBooking.id.toUpperCase();
    if (activeAllBookedSlots.has(slotId) || activeMySlots.has(slotId)) {
      Alert.alert('Slot Already Occupied 🛑', `Slot ${slotId} was just reserved by another user. Please choose another available slot.`);
      return;
    }

    const bookingDateStr = new Date().toISOString().split('T')[0];
    const bookingTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    try {
      const res = await smartApiRequest('post', '/bookings', {
        userEmail: currentUserEmail,
        userRole: userRole,
        role: userRole,
        zoneName: selectedZone,
        slotNumber: slotId,
        plateNumber: selectedVehiclePlate,
        vehiclePlate: selectedVehiclePlate,
        durationHours: bookingDuration,
        bookingDate: bookingDateStr,
        bookingTime: bookingTimeStr
      });

      const newBookingObj = {
        id: res?.data?.id || `b_${Date.now()}`,
        userEmail: currentUserEmail,
        slotNumber: slotId,
        zoneName: selectedZone,
        plateNumber: selectedVehiclePlate,
        status: 'CONFIRMED',
        bookingDate: bookingDateStr,
        date: bookingDateStr,
        time: `${bookingTimeStr} (${bookingDuration} hrs)`
      };

      setMyBookings(prev => [newBookingObj, ...prev]);
      setAllBookings(prev => [newBookingObj, ...prev]);

      // Save to local history cache
      const histKey = `@parknex_history_${currentUserEmail.toLowerCase()}`;
      const savedHist = await AsyncStorage.getItem(histKey).catch(() => null);
      let list = savedHist ? JSON.parse(savedHist) : [];
      list = [{
        id: newBookingObj.id,
        date: bookingDateStr,
        time: `${bookingTimeStr} (${bookingDuration} hrs)`,
        zone: selectedZone,
        slot: slotId,
        vehicle: selectedVehiclePlate,
        duration: `${bookingDuration} Hours`,
        status: 'CONFIRMED'
      }, ...list];
      await AsyncStorage.setItem(histKey, JSON.stringify(list)).catch(() => null);

      Alert.alert(
        'Slot Reserved Successfully! 🎉',
        `Slot ${slotId} in ${selectedZone} has been locked for vehicle ${selectedVehiclePlate}!`
      );
    } catch (e) {
      const errMsg = e?.response?.data?.error || e?.message || 'Slot could not be booked due to a conflict.';
      Alert.alert('Booking Conflict / Error 🛑', errMsg);
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
        
        {/* AI REAL-TIME ROLE-SCOPED RECOMMENDATION BANNER */}
        {aiRec && (
          <TouchableOpacity 
            onPress={() => {
              if (selectedZone !== aiRec.zoneName) setSelectedZone(aiRec.zoneName);
              const targetSlot = slots.find(s => s.id === aiRec.slotNumber) || { id: aiRec.slotNumber, status: 'Available' };
              handleSlotPress(targetSlot);
            }}
            activeOpacity={0.88}
            style={{ 
              marginBottom: 16, 
              backgroundColor: '#EEF2FF', 
              borderRadius: 18, 
              padding: 14, 
              borderWidth: 1.5, 
              borderColor: '#6366F1', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 3
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="sparkles" size={16} color="#4F46E5" />
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#4F46E5', textTransform: 'uppercase' }}>
                  {isStaffOrFaculty ? 'Staff Priority AI Recommendation' : 'AI Real-Time Slot Recommendation'}
                </Text>
                <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#047857' }}>{aiRec.score || 98}% Match</Text>
                </View>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A' }}>
                Slot {aiRec.slotNumber} in {aiRec.zoneName}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' }} numberOfLines={1}>
                {aiRec.reason}
              </Text>
            </View>
            <View style={{ backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 11 }}>Reserve</Text>
            </View>
          </TouchableOpacity>
        )}

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
              const isAiPick = aiRec && aiRec.slotNumber === slot.id && aiRec.zoneName === selectedZone;

              return (
                <TouchableOpacity 
                  key={slot.id} 
                  onPress={() => handleSlotPress(slot)}
                  style={{ 
                    width: '22%', 
                    height: 54,
                    backgroundColor: isAiPick ? 'rgba(99, 102, 241, 0.12)' : s.backgroundColor, 
                    borderRadius: 12, 
                    borderWidth: isAiPick ? 2 : 1.5, 
                    borderColor: isAiPick ? '#6366F1' : s.borderColor, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    padding: 4,
                    position: 'relative'
                  }}
                >
                  {isAiPick && (
                    <View style={{ position: 'absolute', top: -7, right: -4, backgroundColor: '#4F46E5', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 5 }}>
                      <Text style={{ color: '#fff', fontSize: 7, fontWeight: '900' }}>AI PICK</Text>
                    </View>
                  )}
                  <Text style={{ color: isAiPick ? '#4F46E5' : s.color, fontWeight: '900', fontSize: 12 }}>{slot.id}</Text>
                  <Text style={{ color: isAiPick ? '#4F46E5' : s.color, fontWeight: '700', fontSize: 8, marginTop: 1 }}>
                    {slot.status === 'Yours' ? 'SELECTED' : slot.status === 'Occupied' ? 'TAKEN' : isAiPick ? '★ TOP PICK' : slot.hasEV ? '⚡ EV' : 'FREE'}

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
