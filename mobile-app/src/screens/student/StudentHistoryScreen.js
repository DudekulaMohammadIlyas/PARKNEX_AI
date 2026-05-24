import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function StudentHistoryScreen() {
  const historyData = [
    { id: '1', zone: 'Zone A', status: 'Completed', dateStr: 'Today • 09:00 AM - 01:30 PM', duration: '4h 30m' },
    { id: '2', zone: 'Zone B', status: 'Completed', dateStr: 'Yesterday • 10:15 AM - 12:00 PM', duration: '1h 45m' },
    { id: '3', zone: 'Zone A', status: 'Completed', dateStr: 'May 4, 2026 • 08:30 AM - 05:00 PM', duration: '8h 30m' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.greeting, { fontSize: 24 }]}>History</Text>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white }}>
          <Feather name="filter" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
          <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 13 }}>Filter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        {historyData.map(item => (
          <View key={item.id} style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>{item.zone}</Text>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: '500', lineHeight: 20, maxWidth: '90%' }}>{item.dateStr}</Text>
              </View>
              <View style={{ backgroundColor: COLORS.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 11 }}>{item.status}</Text>
              </View>
            </View>
            
            <View style={{ backgroundColor: COLORS.bg, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="clock" size={14} color={COLORS.textMuted} />
              <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '500', marginLeft: 8 }}>
                Duration: <Text style={{ fontWeight: '800', color: COLORS.text }}>{item.duration}</Text>
              </Text>
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
