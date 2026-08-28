import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentBillingScreen({ onLogout }) {
  const [user, setUser] = useState(null);
  const [validUntilYear, setValidUntilYear] = useState('2026');
  const [receiptsList, setReceiptsList] = useState([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadBillingData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@parknex_user');
        const userObj = storedUser ? JSON.parse(storedUser) : { email: 'student@college.edu', name: 'Student' };
        setUser(userObj);

        const userEmail = userObj.email || 'student@college.edu';
        const isDemoUser = userEmail === 'student@college.edu' || userObj.name === 'Alex Carter';

        const savedReceipts = await AsyncStorage.getItem(`@parknex_receipts_${userEmail}`);
        if (savedReceipts) {
          try { setReceiptsList(JSON.parse(savedReceipts)); } catch (e) {}
        } else if (isDemoUser) {
          const demo = [
            { id: 'REC-2026-901', date: 'Jan 05, 2026', desc: 'Annual Campus Parking Permit (Subsidized)', amount: '₹0 (Subsidized)', status: 'PAID' },
            { id: 'REC-2025-442', date: 'Aug 10, 2025', desc: 'Semester 1 Gate Access Fee', amount: '₹500', status: 'PAID' }
          ];
          setReceiptsList(demo);
          await AsyncStorage.setItem(`@parknex_receipts_${userEmail}`, JSON.stringify(demo));
        } else {
          setReceiptsList([]);
        }
      } catch (e) {}
    };

    loadBillingData();
  }, []);

  const handlePayAdvanceRenewal = async () => {
    setIsProcessing(true);

    setTimeout(async () => {
      setValidUntilYear('2027');
      const userEmail = user?.email || 'student@college.edu';
      const newRec = {
        id: `REC-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        desc: 'Advance Campus Parking Permit Renewal (2027)',
        amount: '₹500',
        status: 'PAID'
      };

      const updated = [newRec, ...receiptsList];
      setReceiptsList(updated);
      await AsyncStorage.setItem(`@parknex_receipts_${userEmail}`, JSON.stringify(updated));

      setIsProcessing(false);
      setIsPayModalOpen(false);
      Alert.alert('Renewal Successful!', 'Your Digital Campus Parking Permit has been renewed until December 31, 2027.');
    }, 1200);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.greeting, { fontSize: 24 }]}>Passes & Billing</Text>
        <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700' }}>Active Subscription</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        
        {/* HIGH CONTRAST EXPIRED BANNER */}
        <View style={{ backgroundColor: '#FFFBE6', borderColor: '#F59E0B', borderWidth: 1.5, borderRadius: 20, padding: 18, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#78350F" />
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#78350F' }}>
              Permit Expiration Countdown: {validUntilYear === '2027' ? '493 Days Remaining' : '128 Days Remaining'}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '700', lineHeight: 18, marginBottom: 14 }}>
            Your Digital Campus Parking Permit is valid until <Text style={{ textDecorationLine: 'underline', fontWeight: '900' }}>December 31, {validUntilYear}</Text>. Advance renewal option available below.
          </Text>

          <TouchableOpacity 
            onPress={() => setIsPayModalOpen(true)}
            style={{ backgroundColor: '#D97706', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Pay Advance Renewal</Text>
          </TouchableOpacity>
        </View>

        {/* INVOICES & STATEMENTS */}
        <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 12 }}>
          Billing Invoices & Receipts
        </Text>

        {receiptsList.length === 0 ? (
          <View style={[styles.card, { padding: 30, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border }]}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={COLORS.textMuted} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 12 }}>No Billing Invoices Yet</Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 }}>
              Your campus parking permits are 100% free or subsidized by default.
            </Text>
          </View>
        ) : (
          receiptsList.map((rec) => (
            <View key={rec.id} style={[styles.card, { marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.text }}>{rec.desc}</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{rec.id} • {rec.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.primary }}>{rec.amount}</Text>
                <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.success, marginTop: 2 }}>● {rec.status}</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* ADVANCE RENEWAL PAYMENT MODAL */}
      <Modal visible={isPayModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>Pay Advance Renewal</Text>
              <TouchableOpacity onPress={() => setIsPayModalOpen(false)}>
                <Feather name="x" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700' }}>Renewal Extension</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.primary, marginTop: 2 }}>Campus Permit 2027</Text>
              <Text style={{ fontSize: 13, color: COLORS.text, fontWeight: '700', marginTop: 4 }}>
                Valid: Jan 01, 2027 — Dec 31, 2027
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.success, marginTop: 8 }}>₹500 (Subsidized Rate)</Text>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handlePayAdvanceRenewal} disabled={isProcessing}>
              <Text style={styles.primaryBtnText}>{isProcessing ? 'Processing Payment...' : 'Confirm & Pay ₹500'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
