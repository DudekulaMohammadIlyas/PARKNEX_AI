import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';
import config from '../../../config';

export default function StudentBillingScreen({ onLogout, session }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [passActive, setPassActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPassStatus();
    loadHistory();
  }, []);

  const checkPassStatus = async () => {
    try {
      const status = await AsyncStorage.getItem('@premium_pass');
      if (status === 'ACTIVE') setPassActive(true);
    } catch (e) {}
  };

  const loadHistory = async () => {
    try {
      // In a fully featured backend, this would pass the user's ID
      // For now, we fetch recent events from the backend to simulate history
      const res = await axios.get(`${config.BACKEND_URL}/events`);
      setHistory(res.data.slice(0, 10)); // Just show recent 10
    } catch (e) {
      console.warn('Failed to load history', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const email = session?.user?.email || 'test@example.com';
      const res = await axios.post(`${config.BACKEND_URL}/checkout`, {
        email,
        planId: 'premium_monthly_2500'
      });
      
      if (res.data.success) {
        setPassActive(true);
        await AsyncStorage.setItem('@premium_pass', 'ACTIVE');
        Alert.alert('Success', 'Monthly Pass activated for ₹2,500');
      }
    } catch (error) {
      Alert.alert('Error', 'Payment failed to process. Try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Billing & History</Text>
          <Text style={styles.subtitle}>Manage your subscriptions</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={[styles.iconBtn, { borderColor: COLORS.danger }]}>
          <Feather name="log-out" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 0 }}>
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
            {isProcessing ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 16 }}>
                {passActive ? 'Manage Subscription' : 'Upgrade to Monthly - ₹2,500'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 40 }]}>Parking History</Text>
        
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : history.length === 0 ? (
          <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 20, fontWeight: '600' }}>No recent parking history found.</Text>
        ) : (
          history.map(event => (
            <View key={event.id} style={[styles.card, { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 16 }]}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
                <Feather name={event.type === 'ENTRY' ? "arrow-down-left" : "arrow-up-right"} size={22} color={event.type === 'ENTRY' ? COLORS.success : COLORS.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.text }}>{event.zone?.name || 'Unknown Zone'} {event.type === 'ENTRY' ? 'Entry' : 'Exit'}</Text>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' }}>
                  {new Date(event.timestamp).toLocaleDateString()} • {new Date(event.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={{ fontWeight: '900', fontSize: 16, color: COLORS.text }}>₹0</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
