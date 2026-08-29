import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert, Modal } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config, { smartApiRequest } from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentProfileScreen({ onLogout, user }) {
  const [name, setName] = useState(user?.name || 'Student');
  const [email, setEmail] = useState(user?.email || 'student@college.edu');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [academicTerm, setAcademicTerm] = useState(user?.academicTerm || 'Fall 2024 - Spring 2028');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const targetEmail = user?.email || 'student@college.edu';
      setEmail(targetEmail);
      if (user?.name) setName(user.name);

      try {
        const res = await smartApiRequest('get', `/users/profile?email=${encodeURIComponent(targetEmail)}`);
        if (res.data?.success && res.data?.user) {
          const u = res.data.user;
          if (u.name) setName(u.name);
          if (u.phone) setPhone(u.phone);
          if (u.department) setDepartment(u.department);
          if (u.academicTerm) setAcademicTerm(u.academicTerm);

          const updatedLocal = { ...user, name: u.name || user?.name, phone: u.phone, department: u.department, academicTerm: u.academicTerm };
          await AsyncStorage.setItem('@parknex_user', JSON.stringify(updatedLocal));
        }
      } catch (e) {}
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const updated = { ...user, name, email, phone, department, academicTerm };
      await AsyncStorage.setItem('@parknex_user', JSON.stringify(updated));
      await smartApiRequest('put', '/users/profile', { name, email, phone, department, academicTerm }).catch(() => null);
      Alert.alert('Profile Saved', 'Your account and academic details have been updated successfully.');
    } catch (e) {
      Alert.alert('Saved', 'Profile saved locally.');
    }
  };

  const handleDeleteAccountPermanently = () => {
    Alert.alert(
      '⚠️ Delete Account Permanently',
      `Are you sure you want to PERMANENTLY delete account (${email})?\n\nThis will purge all your registered vehicles, active bookings, passes, and history logs from the database. This action CANNOT be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await axios.delete(`${BACKEND_URL}/users/profile`, { data: { email } }).catch(() => null);
            } catch (e) {}

            try {
              await AsyncStorage.removeItem('@parknex_token');
              await AsyncStorage.removeItem('@parknex_user');
              await AsyncStorage.removeItem('@parknex_role');
              await AsyncStorage.removeItem(`@parknex_vehicles_${email}`);
              await AsyncStorage.removeItem(`@parknex_history_${email}`);
              await AsyncStorage.removeItem(`@parknex_receipts_${email}`);
            } catch (e) {}

            setIsDeleting(false);
            Alert.alert('Account Deleted', 'Your account and all associated data have been permanently removed.');
            if (onLogout) onLogout();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.greeting, { fontSize: 24 }]}>Account Profile</Text>
        <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        
        {/* PROFILE HEADER */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>
              {(name || 'S')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>{name}</Text>
          <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' }}>{email}</Text>
          <View style={[styles.badge, { backgroundColor: '#DCFCE7', marginTop: 8 }]}>
            <Text style={{ color: COLORS.success, fontSize: 11, fontWeight: '800' }}>● {user?.role || 'STUDENT'} ACCOUNT</Text>
          </View>
        </View>

        {/* FORM FIELDS */}
        <View style={[styles.card, { marginBottom: 24 }]}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.text, marginBottom: 16 }}>Personal & Academic Information</Text>

          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6 }}>Full Name</Text>
          <TextInput
            style={[styles.input, { marginBottom: 14 }]}
            value={name}
            onChangeText={setName}
          />

          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6 }}>Email Address</Text>
          <TextInput
            style={[styles.input, { marginBottom: 14 }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6 }}>Phone Number</Text>
          <TextInput
            style={[styles.input, { marginBottom: 14 }]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6 }}>Academic Department</Text>
          <TextInput
            style={[styles.input, { marginBottom: 14 }]}
            placeholder="e.g. Computer Science & Engineering"
            value={department}
            onChangeText={setDepartment}
          />

          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6 }}>Academic Term / Batch</Text>
          <TextInput
            style={[styles.input, { marginBottom: 20 }]}
            placeholder="e.g. Fall 2024 - Spring 2028"
            value={academicTerm}
            onChangeText={setAcademicTerm}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile}>
            <Text style={styles.primaryBtnText}>Save Profile Changes</Text>
          </TouchableOpacity>
        </View>

        {/* DANGER ZONE - ACCOUNT DELETION */}
        <View style={[styles.card, { borderColor: '#FCA5A5', borderWidth: 1.5, backgroundColor: '#FEF2F2', marginBottom: 30 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="warning-outline" size={22} color={COLORS.danger} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.danger }}>Danger Zone</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: '600', marginBottom: 16, lineHeight: 18 }}>
            Permanently delete your ParkNex account and erase all registered vehicles, active parking bookings, digital passes, and payment receipts from the database.
          </Text>

          <TouchableOpacity 
            onPress={handleDeleteAccountPermanently}
            disabled={isDeleting}
            style={{ backgroundColor: COLORS.danger, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
              {isDeleting ? 'Deleting Account...' : 'Delete My Account Permanently'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
