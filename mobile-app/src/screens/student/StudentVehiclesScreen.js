import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function StudentVehiclesScreen() {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.greeting, { fontSize: 24 }]}>Vehicles</Text>
        <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white }}>
          <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 13 }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        {/* Verified Vehicle */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <MaterialCommunityIcons name="car" size={24} color="#64748B" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Honda Civic</Text>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' }}>4-Wheeler</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#047857', fontWeight: '800', fontSize: 11 }}>Verified</Text>
            </View>
          </View>
          <View style={{ backgroundColor: COLORS.bg, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' }}>
            <Text style={{ fontSize: 15, fontWeight: '800', letterSpacing: 2, color: COLORS.text }}>KA-01-AB-1234</Text>
          </View>
        </View>

        {/* Pending Vehicle */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <MaterialCommunityIcons name="car-hatchback" size={24} color="#64748B" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Royal Enfield</Text>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' }}>2-Wheeler</Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#B45309', fontWeight: '800', fontSize: 11 }}>Pending</Text>
            </View>
          </View>
          <View style={{ backgroundColor: COLORS.bg, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' }}>
            <Text style={{ fontSize: 15, fontWeight: '800', letterSpacing: 2, color: COLORS.text }}>KA-05-XY-9876</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
