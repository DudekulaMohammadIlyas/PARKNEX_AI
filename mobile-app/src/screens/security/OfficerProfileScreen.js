import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function OfficerProfileScreen({ navigation, onLogout }) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F1F5F9' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>ParkNex AI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 13 }}>Logout</Text>
          </TouchableOpacity>
          <View style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />
          <TouchableOpacity onPress={() => navigation.navigate('SecurityHome')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>S</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 24 }}>Officer Profile</Text>

        {/* Profile Card */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.border, marginBottom: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <Feather name="user" size={60} color={COLORS.textMuted} />
            {/* Real app would use Image component here */}
          </View>

          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 }}>Sgt. Michael Davis</Text>
          <Text style={{ fontSize: 16, color: COLORS.textMuted, fontWeight: '500', marginBottom: 20 }}>Badge ID: SEC-8924</Text>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
            <View style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 13 }}>Senior Officer</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
              <Text style={{ color: '#047857', fontWeight: '700', fontSize: 13 }}>Active Shift</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 16, width: '100%' }}>
            <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>Current Shift</Text>
              <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '800', textAlign: 'center' }}>08:00 AM - 04:00 PM</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>Assigned Post</Text>
              <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '800', textAlign: 'center' }}>Main Gate Entry</Text>
            </View>
          </View>
        </View>

        {/* Metrics */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 4 }}>142</Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '500' }}>Scans Today</Text>
        </View>

        <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 4 }}>5</Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '500' }}>Alerts Handled</Text>
        </View>

        <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 4 }}>99.8%</Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '500' }}>Scan Accuracy</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
