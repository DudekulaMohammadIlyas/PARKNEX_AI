import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function AdminProfileScreen({ navigation, onLogout, user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'System Admin');
  const [email, setEmail] = useState(user?.email || 'admin@college.edu');
  const [tempName, setTempName] = useState(user?.name || 'System Admin');
  const [tempEmail, setTempEmail] = useState(user?.email || 'admin@college.edu');

  useEffect(() => {
    if (user) {
      setName(user.name || 'System Admin');
      setEmail(user.email || 'admin@college.edu');
    }
  }, [user]);

  const handleEditPress = () => {
    setTempName(name);
    setTempEmail(email);
    setIsEditing(true);
  };

  const handleSavePress = async () => {
    if (!tempName.trim() || !tempEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setName(tempName);
    setEmail(tempEmail);
    setIsEditing(false);

    try {
      await AsyncStorage.setItem('@parknex_user', JSON.stringify({ ...user, name: tempName, email: tempEmail }));
      await axios.put(`${BACKEND_URL}/users/profile`, { name: tempName, email: tempEmail }).catch(() => null);
      Alert.alert('Success', 'Admin profile updated.');
    } catch (e) {}
  };

  const handleDeleteAccountPermanently = () => {
    Alert.alert(
      '⚠️ Delete Account Permanently',
      `Are you sure you want to PERMANENTLY delete administrator account (${email})?\n\nThis will purge your administrative credentials from the database. This action CANNOT be undone.`,
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

            Alert.alert('Account Deleted', 'Admin account permanently removed.');
            if (onLogout) onLogout();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, flex: 1 }}>ParkNex AI Admin</Text>
        <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 20 }}>Admin Profile</Text>

        {/* Profile Card */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 }}>
          
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, marginBottom: 16, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>{name.charAt(0)}</Text>
          </View>

          {!isEditing ? (
            <>
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 4 }}>{name}</Text>
              <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '500', marginBottom: 16 }}>{email}</Text>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <View style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                  <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 12 }}>Super Admin</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                  <Text style={{ color: '#047857', fontWeight: '800', fontSize: 12 }}>2FA Active</Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleEditPress} style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="edit-2" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
                <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 13 }}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ width: '100%', gap: 14 }}>
              <View>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 6 }}>Full Name</Text>
                <TextInput
                  value={tempName}
                  onChangeText={setTempName}
                  style={styles.input}
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 6 }}>Email Address</Text>
                <TextInput
                  value={tempEmail}
                  onChangeText={setTempEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => setIsEditing(false)} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSavePress} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 13 }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>

        {/* DANGER ZONE - ACCOUNT DELETION */}
        <View style={[styles.card, { borderColor: '#FCA5A5', borderWidth: 1.5, backgroundColor: '#FEF2F2', marginBottom: 30 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="warning-outline" size={22} color={COLORS.danger} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.danger }}>Danger Zone</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: '600', marginBottom: 16, lineHeight: 18 }}>
            Permanently delete your administrator account and credentials from the system database.
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
