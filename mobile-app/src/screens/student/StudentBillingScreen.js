import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, Modal, ActivityIndicator, Share } from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { smartApiRequest } from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function StudentBillingScreen({ onLogout, navigation }) {
  const [user, setUser] = useState(null);
  const [digitalPass, setDigitalPass] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('30'); // '1' | '30' | '180'

  const loadBillingData = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@parknex_user');
      const userObj = storedUser ? JSON.parse(storedUser) : { email: 'student@college.edu', name: 'Student User' };
      setUser(userObj);

      const userEmail = userObj.email || 'student@college.edu';
      const userRole = userObj.role || 'STUDENT';

      const passRes = await smartApiRequest(
        'get',
        `/passes/my-pass?email=${encodeURIComponent(userEmail)}&role=${encodeURIComponent(userRole)}`
      ).catch(() => null);

      if (passRes?.data) {
        setDigitalPass(passRes.data);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const handlePayAdvanceRenewal = async () => {
    setIsProcessing(true);
    try {
      const userEmail = user?.email || 'student@college.edu';
      const planDaysNum = parseInt(selectedPlan, 10);
      const planTitleStr = planDaysNum === 1
        ? '1-Day Daily Quick Pass'
        : planDaysNum === 180
        ? '180-Day Semester All-Access Pass'
        : '30-Day Monthly Commuter Pass';
      const amountStr = planDaysNum === 1 ? '₹50.00' : planDaysNum === 180 ? '₹1,499.00' : '₹499.00';

      const res = await smartApiRequest('post', '/passes/renew', {
        email: userEmail,
        planDays: planDaysNum,
        planTitle: planTitleStr,
        amount: amountStr,
        paymentMethod: 'Student Campus Pay'
      });

      if (res?.data?.success && res.data.pass) {
        setDigitalPass(res.data.pass);
        setIsPayModalOpen(false);
        Alert.alert(
          'Renewal Successful! 💳',
          `Your campus parking permit has been extended until ${res.data.pass.formattedValidUntil} (${res.data.pass.daysRemaining} Days remaining).`
        );
      }
    } catch (e) {
      Alert.alert('Renewal Failed', e?.response?.data?.error || e.message || 'Could not process renewal.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareReceipt = async (rec) => {
    try {
      await Share.share({
        title: `Parking Permit Invoice ${rec.invoiceId || rec.id}`,
        message: `🎫 Official ParkNex Parking Receipt\nInvoice: ${rec.invoiceId || rec.id}\nPlan: ${rec.planTitle || rec.plan}\nAmount: ${rec.amount}\nStatus: PAID ✅\nValid Until: ${new Date(rec.validUntil).toLocaleDateString()}`
      });
    } catch (e) {}
  };

  const receiptsList = digitalPass?.history || [];
  const daysLeft = digitalPass?.daysRemaining ?? 30;
  const isExp = digitalPass?.isExpired;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {navigation?.canGoBack?.() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6, marginLeft: -6, marginRight: 8 }}>
              <Feather name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.greeting, { fontSize: 22, marginTop: 0 }]}>Passes & Billing</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation?.navigate('Pass')}
          style={{ backgroundColor: '#EEF2FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#C7D2FE' }}
        >
          <Text style={{ fontSize: 11, color: '#4F46E5', fontWeight: '800' }}>View Digital Pass →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        
        {/* REAL-TIME EXPIRATION & ADVANCE RENEWAL BANNER */}
        <View style={{
          backgroundColor: isExp ? '#FEE2E2' : (daysLeft <= 3 ? '#FEF3C7' : '#FFFBE6'),
          borderColor: isExp ? '#EF4444' : (daysLeft <= 3 ? '#F59E0B' : '#F59E0B'),
          borderWidth: 1.5,
          borderRadius: 20,
          padding: 18,
          marginBottom: 20
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={isExp ? '#B91C1C' : '#78350F'} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: isExp ? '#B91C1C' : '#78350F' }}>
              Permit Validity: {isExp ? 'Expired' : `${daysLeft} Days Remaining`}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: isExp ? '#991B1B' : '#92400E', fontWeight: '700', lineHeight: 18, marginBottom: 14 }}>
            Your Digital Campus Parking Permit is valid until <Text style={{ textDecorationLine: 'underline', fontWeight: '900' }}>{digitalPass?.formattedValidUntil || 'Next Month'}</Text>. Advance renewal options available below.
          </Text>

          <TouchableOpacity 
            onPress={() => setIsPayModalOpen(true)}
            style={{
              backgroundColor: isExp ? '#DC2626' : '#D97706',
              paddingVertical: 12,
              paddingHorizontal: 18,
              borderRadius: 12,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
              {isExp ? 'Reactivate Permit Now' : 'Pay Advance Renewal'}
            </Text>
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
              Your campus parking permits are subsidized by default.
            </Text>
          </View>
        ) : (
          receiptsList.map((rec) => (
            <View key={rec.id || rec.invoiceId} style={[styles.card, { marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.text }}>{rec.planTitle || rec.plan}</Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                  {rec.invoiceId || rec.id} • {new Date(rec.issuedAt).toLocaleDateString()}
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.primary, marginTop: 2, fontWeight: '700' }}>
                  Valid Until: {new Date(rec.validUntil).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.primary }}>{rec.amount}</Text>
                <TouchableOpacity onPress={() => handleShareReceipt(rec)} style={{ padding: 4 }}>
                  <Feather name="share-2" size={15} color={COLORS.textMuted} />
                </TouchableOpacity>
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
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>Advance Pass Renewal</Text>
              <TouchableOpacity onPress={() => setIsPayModalOpen(false)}>
                <Feather name="x" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginBottom: 20 }}>
              {[
                { id: '1', title: '1-Day Quick Pass', amount: '₹50.00', desc: 'Valid 24 hours from current expiry' },
                { id: '30', title: '30-Day Monthly Commuter', amount: '₹499.00', desc: 'Standard monthly commuter extension' },
                { id: '180', title: '180-Day Semester Pass', amount: '₹1,499.00', desc: 'Full semester peace of mind + VIP EV bays' }
              ].map(plan => {
                const isSel = selectedPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: isSel ? 2 : 1,
                      borderColor: isSel ? COLORS.primary : COLORS.border,
                      backgroundColor: isSel ? '#EEF2FF' : '#F8FAFC',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.text }}>{plan.title}</Text>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{plan.desc}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.primary }}>{plan.amount}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handlePayAdvanceRenewal} disabled={isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Confirm Renewal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
