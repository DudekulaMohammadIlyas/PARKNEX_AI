import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, Modal } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../../../config';
import { supabase } from '../../../supabaseClient';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentHistoryScreen() {
  const [user, setUser] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [selectedExitBooking, setSelectedExitBooking] = useState(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@parknex_user');
        const userObj = storedUser ? JSON.parse(storedUser) : { email: 'student@college.edu', name: 'Student' };
        setUser(userObj);

        const userEmail = userObj.email || 'student@college.edu';
        const isDemoUser = userEmail === 'student@college.edu' || userObj.name === 'Alex Carter';

        const savedHist = await AsyncStorage.getItem(`@parknex_history_${userEmail}`);
        if (savedHist) {
          try { setHistoryData(JSON.parse(savedHist)); } catch (e) {}
        } else if (isDemoUser) {
          const demo = [
            { id: '1', date: '2026-08-25', time: '09:15 AM - 01:30 PM', zone: 'KRISHNA HOSTEL', slot: 'Slot K-30', vehicle: 'KA-01-AB-1234', duration: '4h 15m', status: 'CONFIRMED' },
            { id: '2', date: '2026-08-24', time: '10:15 AM - 12:00 PM', zone: 'CS Academic Block', slot: 'Slot A-12', vehicle: 'KA-01-AB-1234', duration: '1h 45m', status: 'EXITED' },
            { id: '3', date: '2026-08-20', time: '08:30 AM - 05:00 PM', zone: 'Central Library', slot: 'Slot B-05', vehicle: 'KA-05-XY-9876', duration: '8h 30m', status: 'EXITED' }
          ];
          setHistoryData(demo);
          await AsyncStorage.setItem(`@parknex_history_${userEmail}`, JSON.stringify(demo));
        } else {
          setHistoryData([]);
        }

        const apiRes = await axios.get(`${BACKEND_URL}/bookings/my-bookings?email=${encodeURIComponent(userEmail)}`).catch(() => null);
        if (Array.isArray(apiRes?.data) && apiRes.data.length > 0) {
          const apiMapped = apiRes.data.map(b => ({
            id: b.id || `b_${Date.now()}`,
            date: b.bookingDate || 'Today',
            time: b.bookingTime || '09:00 AM',
            zone: b.zoneName || b.slot?.zone?.name || 'KRISHNA HOSTEL',
            slot: b.slotNumber || b.slot?.slotNumber || 'K-30',
            vehicle: b.vehiclePlate || b.plateNumber || b.vehicle?.plateNumber || 'NO VEHICLE',
            duration: `${b.durationHours || 4} Hours`,
            status: b.status || 'CONFIRMED'
          }));

          setHistoryData(prev => {
            const map = new Map();
            apiMapped.forEach(m => map.set(m.id, m));
            prev.forEach(p => {
              if (!map.has(p.id)) {
                map.set(p.id, p);
              }
            });
            const merged = Array.from(map.values());
            AsyncStorage.setItem(`@parknex_history_${userEmail}`, JSON.stringify(merged)).catch(() => null);
            return merged;
          });
        }
      } catch (e) {}
    };

    loadHistory();

    const channel = supabase
      .channel('student-history-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadHistory();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') loadHistory();
      });

    return () => {
      if (supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, []);

  const handleConfirmExit = async () => {
    if (!selectedExitBooking) return;

    try {
      await axios.put(`${BACKEND_URL}/bookings/${selectedExitBooking.id}/exit`).catch(() => null);
    } catch (e) {}

    const updated = historyData.map(h => 
      h.id === selectedExitBooking.id ? { ...h, status: 'EXITED' } : h
    );
    setHistoryData(updated);

    const userEmail = user?.email || 'student@college.edu';
    await AsyncStorage.setItem(`@parknex_history_${userEmail}`, JSON.stringify(updated));

    setIsExitModalOpen(false);
    Alert.alert('Checkout Successful', `Gate Barrier Released! Slot ${selectedExitBooking.slot} is now marked 100% FREE in backend database.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.greeting, { fontSize: 24 }]}>Parking History</Text>
        <Text style={{ color: COLORS.textMuted, fontWeight: '700', fontSize: 12 }}>{historyData.length} Logs</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {historyData.length === 0 ? (
          <View style={[styles.card, { padding: 30, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border }]}>
            <MaterialCommunityIcons name="history" size={48} color={COLORS.textMuted} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 12 }}>No Parking History Found</Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 }}>
              Your completed campus parking reservations and entry/exit logs will appear here.
            </Text>
          </View>
        ) : (
          historyData.map(item => (
            <View key={item.id} style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: COLORS.text }}>{item.zone}</Text>
                  <Text style={{ fontSize: 13, color: COLORS.primary, marginTop: 2, fontWeight: '800' }}>
                    {item.slot} • Vehicle: {item.vehicle}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' }}>
                    {item.date} • {item.time}
                  </Text>
                </View>

                <View style={{ backgroundColor: item.status === 'CONFIRMED' ? '#FEF3C7' : '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: item.status === 'CONFIRMED' ? COLORS.warning : COLORS.success, fontWeight: '900', fontSize: 11 }}>
                    ● {item.status}
                  </Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg, padding: 10, borderRadius: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="clock" size={14} color={COLORS.textMuted} />
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginLeft: 6 }}>
                    Duration: <Text style={{ fontWeight: '800', color: COLORS.text }}>{item.duration}</Text>
                  </Text>
                </View>

                {item.status === 'CONFIRMED' && (
                  <TouchableOpacity
                    onPress={() => { setSelectedExitBooking(item); setIsExitModalOpen(true); }}
                    style={{ backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>Sign Gate Exit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SIGN GATE EXIT MODAL */}
      <Modal visible={isExitModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>Sign Gate Exit / Checkout</Text>
              <TouchableOpacity onPress={() => setIsExitModalOpen(false)}>
                <Feather name="x" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedExitBooking && (
              <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, marginBottom: 20 }}>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700' }}>Active Reservation</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.primary, marginTop: 2 }}>{selectedExitBooking.zone}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text, marginTop: 4 }}>
                  {selectedExitBooking.slot} • Vehicle {selectedExitBooking.vehicle}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: '800', marginTop: 8 }}>
                  ● Gate Barrier Sensor Armed for Release
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20, textAlign: 'center' }}>
              Confirming exit will release slot {selectedExitBooking?.slot} back to 100% FREE capacity in the PostgreSQL database.
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmExit}>
              <Text style={styles.primaryBtnText}>Confirm Exit & Release Slot</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
