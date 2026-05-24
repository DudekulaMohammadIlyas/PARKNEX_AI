import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function SlotOccupiedAlertScreen({ navigation }) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <Feather name="alert-octagon" size={32} color={COLORS.danger} />
          </View>
          <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5, marginBottom: 12 }}>Slot Occupied!</Text>
          <Text style={{ fontSize: 16, color: COLORS.danger, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 }}>An unauthorized vehicle is in your booked slot.</Text>
        </View>

        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, overflow: 'hidden', marginBottom: 32 }}>
          {/* Mocking the car image from the screenshot */}
          <View style={{ height: 180, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="image" size={40} color={COLORS.textMuted} />
            <Text style={{ color: COLORS.textMuted, fontWeight: '600', marginTop: 8 }}>AI Camera Snapshot</Text>
          </View>
          
          <View style={{ padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
              <Text style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: '600' }}>Detected Plate</Text>
              <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '900' }}>UNKNOWN</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16 }}>
              <Text style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: '600' }}>Your Slot</Text>
              <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '900' }}>Zone A - 14</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity 
            style={{ flex: 1, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ fontSize: 16, color: '#0F172A', fontWeight: '700' }}>Ignore</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, padding: 18, borderRadius: 16, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}
          >
            <Text style={{ fontSize: 16, color: COLORS.white, fontWeight: '800' }}>Report to Security</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
