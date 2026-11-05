import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import config, { smartApiRequest } from '../../../config';
import { supabase } from '../../../supabaseClient';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentHistoryScreen() {
  const [user, setUser] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedExitBooking, setSelectedExitBooking] = useState(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const loadHistory = useCallback(async (isManualRefresh = false) => {
    try {
      const storedUser = await AsyncStorage.getItem('@parknex_user');
      const userObj = storedUser ? JSON.parse(storedUser) : { email: '', name: '' };
      setUser(userObj);

      const userEmail = (userObj.email || '').trim().toLowerCase();

      // Instantly populate from local offline cache
      if (userEmail) {
        const savedHist = await AsyncStorage.getItem(`@parknex_history_${userEmail}`).catch(() => null);
        if (savedHist) {
          try {
            const parsed = JSON.parse(savedHist);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHistoryData(parsed);
              setIsLoading(false);
            }
          } catch (e) {}
        }
      }

      // Query live synchronized history from backend
      const apiRes = await smartApiRequest('get', `/bookings/my-bookings?email=${encodeURIComponent(userEmail)}`).catch(() => null);
      if (Array.isArray(apiRes?.data)) {
        const apiMapped = apiRes.data.map(b => ({
          id: String(b.id || `b_${Date.now()}`),
          date: b.date || b.bookingDate || 'Today',
          time: b.time || b.bookingTime || '09:00 AM',
          zone: b.zoneName || b.slot?.zone?.name || 'Campus Lot',
          slot: b.slotNumber || b.slot?.slotNumber || 'K-30',
          vehicle: b.vehiclePlate || b.plateNumber || b.vehicle?.plateNumber || 'KA-09-ZZ-9999',
          duration: b.duration || `${b.durationHours || 4} Hours`,
          status: b.status || 'CONFIRMED',
          releasedAt: b.releasedAt,
          releasedBy: b.releasedBy
        }));

        setHistoryData(apiMapped);
        if (userEmail) {
          AsyncStorage.setItem(`@parknex_history_${userEmail}`, JSON.stringify(apiMapped)).catch(() => null);
        }
      }
    } catch (e) {
      console.warn('History load warning:', e.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(() => loadHistory(false), 10000);

    const chName = `student-history-realtime-${Date.now()}`;
    const channel = supabase
      .channel(chName)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadHistory(false);
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') loadHistory(false);
    });

    return () => {
      clearInterval(interval);
      if (supabase && supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, [loadHistory]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadHistory(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.greeting, { fontSize: 24 }]}>Parking History</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
          <Text style={{ color: COLORS.textMuted, fontWeight: '700', fontSize: 12 }}>{historyData.length} Logs</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            colors={[COLORS.primary]} 
            tintColor={COLORS.primary} 
          />
        }
      >
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
                    style={{ backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="qr-code-outline" size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>Show Exit QR Pass</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SECURITY EXIT QR PASS MODAL (SECURITY CLEARANCE ONLY) */}
      <Modal visible={isExitModalOpen} animationType="slide" transparent onRequestClose={() => setIsExitModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 22, alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={24} color="#047857" />
                <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>Security Exit Gate Pass</Text>
              </View>
              <TouchableOpacity onPress={() => setIsExitModalOpen(false)} style={{ padding: 6 }}>
                <Feather name="x" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: 16, fontWeight: '600' }}>
              Present this QR Code to the Security Officer at the gate barrier to verify and release your vehicle.
            </Text>

            {selectedExitBooking && (
              <View style={{ padding: 14, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3, marginBottom: 16 }}>
                <QRCode
                  value={JSON.stringify({
                    type: 'EXIT_PASS',
                    bookingId: selectedExitBooking.id,
                    vehiclePlate: selectedExitBooking.vehicle,
                    plateNumber: selectedExitBooking.vehicle,
                    slotNumber: selectedExitBooking.slot,
                    zoneName: selectedExitBooking.zone,
                    studentEmail: user?.email || 'student@college.edu'
                  })}
                  size={190}
                />
              </View>
            )}

            {selectedExitBooking && (
              <View style={{ width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700' }}>Vehicle Plate:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.text }}>{selectedExitBooking.vehicle}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700' }}>Parked Slot:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.primary }}>{selectedExitBooking.slot} ({selectedExitBooking.zone})</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700' }}>Gate Barrier Control:</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#047857' }}>Security Officer Only</Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(37,99,235,0.08)', borderRadius: 12, width: '100%', marginBottom: 16 }}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={{ fontSize: 12, color: '#1D4ED8', fontWeight: '800', flex: 1 }}>
                Waiting for Security Officer to scan and confirm release...
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => setIsExitModalOpen(false)} 
              style={{ width: '100%', paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#475569' }}>Close Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
