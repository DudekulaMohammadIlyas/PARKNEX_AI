import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function OfficerProfileScreen({ navigation, onLogout, user }) {
  const [officerUser, setOfficerUser] = useState(user || null);

  useEffect(() => {
    const loadUser = async () => {
      if (!user) {
        try {
          const stored = await AsyncStorage.getItem('@parknex_user');
          if (stored) setOfficerUser(JSON.parse(stored));
        } catch (e) {}
      }
    };
    loadUser();
  }, [user]);

  const handleDeleteAccountPermanently = () => {
    const email = officerUser?.email || 'security@college.edu';
    Alert.alert(
      '⚠️ Delete Account Permanently',
      `Are you sure you want to PERMANENTLY delete security officer account (${email})?\n\nThis will purge your security credentials from the system database. This action CANNOT be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/users/profile`, { data: { email } }).catch(() => null);
            } catch (e) {}

            try {
              await AsyncStorage.removeItem('@parknex_token');
              await AsyncStorage.removeItem('@parknex_user');
              await AsyncStorage.removeItem('@parknex_role');
            } catch (e) {}

            Alert.alert('Account Deleted', 'Officer account permanently removed.');
            if (onLogout) onLogout();
          }
        }
      ]
    );
  };

  const name = officerUser?.name || 'Sgt. Michael Davis';
  const badgeId = officerUser?.email ? `SEC-${(officerUser.email).split('@')[0].toUpperCase()}` : 'SEC-8924';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F1F5F9' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>ParkNex AI Security</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 20 }}>Officer Profile</Text>

        {/* Profile Card */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, marginBottom: 16, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>{(name || 'O')[0]}</Text>
          </View>

          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 4 }}>{name}</Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600', marginBottom: 16 }}>Badge ID: {badgeId}</Text>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <View style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 12 }}>Senior Security Officer</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: '#047857', fontWeight: '800', fontSize: 12 }}>Active Shift</Text>
            </View>
          </View>
        </View>

        {/* DANGER ZONE - ACCOUNT DELETION */}
        <View style={[styles.card, { borderColor: '#FCA5A5', borderWidth: 1.5, backgroundColor: '#FEF2F2', marginBottom: 30 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="warning-outline" size={22} color={COLORS.danger} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.danger }}>Danger Zone</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: '600', marginBottom: 16, lineHeight: 18 }}>
            Permanently delete your security officer account and credentials from the system database.
          </Text>

          <TouchableOpacity 
            onPress={handleDeleteAccountPermanently}
            style={{ backgroundColor: COLORS.danger, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Delete My Account Permanently</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
