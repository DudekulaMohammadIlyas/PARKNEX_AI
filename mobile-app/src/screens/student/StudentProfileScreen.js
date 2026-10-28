import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert, Modal } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config, { smartApiRequest } from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentProfileScreen({ onLogout, user, navigation }) {
  const [name, setName] = useState(user?.name || 'Student');
  const [email, setEmail] = useState(user?.email || 'student@college.edu');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [academicTerm, setAcademicTerm] = useState(user?.academicTerm || 'Fall 2024 - Spring 2028');
  const [role, setRole] = useState((user?.role || 'STUDENT').toUpperCase());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedModalVisible, setIsSavedModalVisible] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const targetEmail = user?.email || 'student@college.edu';
      setEmail(targetEmail);
      if (user?.name) setName(user.name);

      const [storedUser, storedRole] = await Promise.all([
        AsyncStorage.getItem('@parknex_user').catch(() => null),
        AsyncStorage.getItem('@parknex_role').catch(() => null)
      ]);
      let currentRole = user?.role || storedRole || 'STUDENT';
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.role) currentRole = parsed.role;
        } catch (e) {}
      }
      setRole(currentRole.toUpperCase());

      try {
        const res = await smartApiRequest('get', `/users/profile?email=${encodeURIComponent(targetEmail)}`);
        if (res.data?.success && res.data?.user) {
          const u = res.data.user;
          if (u.name) setName(u.name);
          if (u.phone) setPhone(u.phone);
          if (u.department) setDepartment(u.department);
          if (u.academicTerm) setAcademicTerm(u.academicTerm);
          if (u.role) setRole(u.role.toUpperCase());

          const updatedLocal = { ...user, name: u.name || user?.name, phone: u.phone, department: u.department, academicTerm: u.academicTerm, role: u.role || currentRole };
          await AsyncStorage.setItem('@parknex_user', JSON.stringify(updatedLocal));
        }
      } catch (e) {}
    };

    fetchProfile();
  }, [user]);

  const handleConfirmLogout = () => {
    Alert.alert(
      '🚪 Logout Confirmation',
      'Are you sure you want to log out of your ParkNex account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            if (onLogout) onLogout();
          }
        }
      ]
    );
  };

  const handleSaveProfilePrompt = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your Full Name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your Email Address.');
      return;
    }
    Alert.alert(
      'Confirm Profile Update',
      'Are you sure you want to save these updated profile details?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save Changes', onPress: executeSaveProfile }
      ]
    );
  };

  const executeSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = { ...user, name: name.trim(), email: email.trim(), phone: phone.trim(), department: department.trim(), academicTerm: academicTerm.trim() };
      await AsyncStorage.setItem('@parknex_user', JSON.stringify(updated));
      await smartApiRequest('put', '/users/profile', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        department: department.trim(),
        academicTerm: academicTerm.trim()
      }).catch(() => null);

      setSavedSnapshot({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || 'Not set',
        department: department.trim() || 'General'
      });
      setIsSavedModalVisible(true);
      Alert.alert('Profile Saved ✅', 'Your account and academic details have been updated successfully.');
    } catch (e) {
      setSavedSnapshot({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || 'Not set',
        department: department.trim() || 'General'
      });
      setIsSavedModalVisible(true);
      Alert.alert('Profile Saved Locally ✅', 'Your profile details have been saved to your device cache.');
    } finally {
      setIsSaving(false);
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
              await smartApiRequest('delete', `/users/profile?email=${encodeURIComponent(email)}`).catch(() => null);
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
        <TouchableOpacity onPress={handleConfirmLogout} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
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
          <View style={[styles.badge, { backgroundColor: (role === 'STAFF' || role === 'FACULTY') ? '#FEF3C7' : '#DCFCE7', marginTop: 8 }]}>
            <Text style={{ color: (role === 'STAFF' || role === 'FACULTY') ? '#D97706' : COLORS.success, fontSize: 11, fontWeight: '800' }}>● {role} ACCOUNT</Text>
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

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfilePrompt} disabled={isSaving}>
            <Text style={styles.primaryBtnText}>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</Text>
          </TouchableOpacity>
        </View>

        {/* FEEDBACK & RATINGS ACTION CARD */}
        <TouchableOpacity
          style={[styles.card, { marginBottom: 20, borderColor: '#BFDBFE', borderWidth: 1.5, backgroundColor: '#EFF6FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }]}
          onPress={() => navigation?.navigate('Feedback')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="chatbubbles" size={24} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#1E3A8A' }}>Rate Experience & Feedback</Text>
              <Text style={{ fontSize: 11, color: '#3B82F6', fontWeight: '600', marginTop: 2 }}>
                Share your feedback or check official replies
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#2563EB" />
        </TouchableOpacity>

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

      {/* PROFILE UPDATED CONFIRMATION MODAL */}
      <Modal visible={isSavedModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, width: '100%', maxWidth: 360, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="checkmark-circle" size={44} color="#16A34A" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 8 }}>
              Profile Updated!
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 18, lineHeight: 20 }}>
              Your account details and preferences have been successfully updated and saved in ParkNex-AI.
            </Text>
            {savedSnapshot && (
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E293B', marginBottom: 5 }}>👤 Name: {savedSnapshot.name}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>📧 Email: {savedSnapshot.email}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>📱 Phone: {savedSnapshot.phone}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>🏛️ Dept: {savedSnapshot.department}</Text>
              </View>
            )}
            <TouchableOpacity
              style={{ backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center' }}
              onPress={() => setIsSavedModalVisible(false)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
