import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function StudentBookScreen() {
  const [selectedZone, setSelectedZone] = useState('Zone A');
  const zones = [
    { id: 'A', name: 'Zone A (Near CS)' },
    { id: 'B', name: 'Zone B (Library)' },
    { id: 'C', name: 'Zone C (Hostel)' },
    { id: 'D', name: 'Zone D (Main)' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10 }]}>
        <Text style={[styles.greeting, { fontSize: 24 }]}>Book a Slot</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        {/* Select Vehicle */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8 }}>Select Vehicle</Text>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: COLORS.primary, marginBottom: 24 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
            <MaterialCommunityIcons name="car" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Honda Civic</Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' }}>KA-01-AB-1234</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Date and Time */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8 }}>Date</Text>
            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>06-05-2026</Text>
              <Feather name="calendar" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8 }}>Time</Text>
            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>09:00</Text>
              <Feather name="clock" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Select Zone */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8 }}>Select Zone</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
          {zones.map(z => {
            const isSelected = selectedZone === z.id || selectedZone === z.name.split(' ')[0] + ' ' + z.name.split(' ')[1];
            return (
              <TouchableOpacity 
                key={z.id}
                onPress={() => setSelectedZone(z.id)}
                style={{ width: '47.5%', backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isSelected ? COLORS.primary : COLORS.border, alignItems: 'center', justifyContent: 'center', minHeight: 70 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? COLORS.text : COLORS.text, textAlign: 'center' }}>{z.name}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity style={{ backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 4 }}>
          <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '800' }}>Confirm Booking</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
