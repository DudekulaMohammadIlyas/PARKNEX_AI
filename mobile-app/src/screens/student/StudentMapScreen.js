import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function StudentMapScreen() {
  const [selectedZone, setSelectedZone] = useState('Zone A');
  const zones = ['Zone A', 'Zone B', 'Zone C'];

  // Mocking the grid of slots from Screenshot 3
  const slots = Array.from({ length: 24 }, (_, i) => {
    const id = `A${i + 1}`;
    let status = 'Available'; // Default
    // Red Outline
    if (['A1', 'A4', 'A7', 'A10', 'A13', 'A16', 'A19', 'A22'].includes(id)) status = 'Occupied';
    // Blue Solid
    if (id === 'A15') status = 'Yours';
    
    return { id, status };
  });

  const getSlotStyle = (status) => {
    if (status === 'Occupied') return { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'rgba(239, 68, 68, 0.6)' };
    if (status === 'Yours') return { backgroundColor: 'rgba(37, 99, 235, 0.2)', borderColor: COLORS.primary, color: COLORS.primary };
    return { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: COLORS.success, color: '#047857' }; // Available
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.greeting, { fontSize: 24 }]}>Parking Map</Text>
        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
          <Text style={{ color: '#047857', fontWeight: '800', fontSize: 12 }}>Live</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {zones.map(zone => (
            <TouchableOpacity 
              key={zone} 
              onPress={() => setSelectedZone(zone)}
              style={{ backgroundColor: selectedZone === zone ? '#0F172A' : COLORS.white, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: selectedZone === zone ? '#0F172A' : COLORS.border }}
            >
              <Text style={{ color: selectedZone === zone ? COLORS.white : COLORS.textMuted, fontWeight: '700', fontSize: 14 }}>{zone}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          
          {/* Legend */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 6 }} />
              <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 13 }}>Available</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: COLORS.danger, marginRight: 6 }} />
              <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 13 }}>Occupied</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 6 }} />
              <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 13 }}>Yours</Text>
            </View>
          </View>

          {/* Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
            {slots.map(slot => {
              const s = getSlotStyle(slot.status);
              return (
                <TouchableOpacity 
                  key={slot.id} 
                  style={{ width: '21%', aspectRatio: 1, backgroundColor: s.backgroundColor, borderRadius: 12, borderWidth: 1.5, borderColor: s.borderColor, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text style={{ color: s.color, fontWeight: '800', fontSize: 14 }}>{slot.id}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

        </View>

        {/* Book Button */}
        <TouchableOpacity style={{ backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 32, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 4 }}>
          <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '800' }}>Book a Slot Here</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
