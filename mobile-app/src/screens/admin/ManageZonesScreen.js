import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function ManageZonesScreen({ navigation }) {
  const zones = [
    { name: 'Zone A (Main)', capacity: '120 Slots', type: 'Mixed', status: 'Active' },
    { name: 'Zone B (Library)', capacity: '80 Slots', type: '4-Wheeler', status: 'Active' },
    { name: 'Zone C (Hostel)', capacity: '200 Slots', type: '2-Wheeler', status: 'Maintenance' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, flex: 1 }}>ParkNex AI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity style={{ position: 'relative' }}>
            <Feather name="bell" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>A</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, width: '60%' }}>Manage Zones &{'\n'}Slots</Text>
          <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="plus" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 14 }}>Add{'\n'}Zone</Text>
          </TouchableOpacity>
        </View>

        {/* Zones List */}
        <View style={{ gap: 16 }}>
          {zones.map((zone, index) => {
            const isActive = zone.status === 'Active';
            const statusBg = isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';
            const statusColor = isActive ? '#047857' : '#D97706';

            return (
              <View key={index} style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border }}>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>{zone.name}</Text>
                  <View style={{ backgroundColor: statusBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: statusColor, fontWeight: '700', fontSize: 12 }}>{zone.status}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: '600' }}>Capacity</Text>
                  <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '800' }}>{zone.capacity}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                  <Text style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: '600' }}>Type</Text>
                  <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '800' }}>{zone.type}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <Feather name="edit-2" size={16} color={COLORS.text} style={{ marginRight: 8 }} />
                    <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 14 }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <Feather name="trash-2" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>

              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
