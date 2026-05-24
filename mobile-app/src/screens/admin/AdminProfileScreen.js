import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function AdminProfileScreen({ navigation, onLogout }) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>ParkNex AI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 13 }}>Logout</Text>
          </TouchableOpacity>
          <View style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />
          <TouchableOpacity onPress={() => navigation.navigate('AdminHome')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 24 }}>Admin Profile</Text>

        {/* Profile Card */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(37, 99, 235, 0.1)', marginBottom: 24, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 48, fontWeight: '900', color: COLORS.primary }}>A</Text>
          </View>

          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 }}>Admin User</Text>
          <Text style={{ fontSize: 16, color: COLORS.textMuted, fontWeight: '500', marginBottom: 20 }}>admin@college.edu</Text>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
            <View style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 13 }}>Super Admin</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: '#047857', fontWeight: '700', fontSize: 13 }}>2FA Enabled</Text>
            </View>
          </View>

          <TouchableOpacity style={{ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="edit-2" size={16} color={COLORS.text} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 14 }}>Edit Profile</Text>
          </TouchableOpacity>

        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
