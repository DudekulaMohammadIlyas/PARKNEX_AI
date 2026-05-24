import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function SecurityLogsScreen({ navigation }) {
  const logs = [
    { time: '10:42 AM', event: 'Entry Denied', plate: 'UNKNOWN', type: 'danger' },
    { time: '10:30 AM', event: 'Vehicle Exit', plate: 'MH-12-XY-9090', type: 'neutral' },
    { time: '09:42 AM', event: 'Vehicle Entry', plate: 'KA-01-AB-1234', type: 'success' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F1F5F9' }]}>
      
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
          <TouchableOpacity onPress={() => navigation.navigate('OfficerProfile')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>S</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, width: '40%' }}>Security Logs</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white }}>
              <Feather name="calendar" size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} />
              <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 13 }}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white }}>
              <Feather name="filter" size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} />
              <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 13 }}>All Events</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logs Table Mock */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border }}>
          
          {/* Table Header */}
          <View style={{ flexDirection: 'row', padding: 20, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Timestamp</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Event</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Plate</Text>
          </View>

          {/* Table Rows */}
          {logs.map((item, index) => {
            let dotColor = COLORS.textMuted;
            let textColor = COLORS.textMuted;
            if (item.type === 'danger') { dotColor = COLORS.danger; textColor = COLORS.danger; }
            if (item.type === 'success') { dotColor = COLORS.success; textColor = COLORS.success; }

            return (
              <View key={index} style={{ flexDirection: 'row', padding: 20, borderBottomWidth: index === logs.length - 1 ? 0 : 1, borderBottomColor: COLORS.border, alignItems: 'center' }}>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textMuted }}>{item.time}</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor, marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, flexShrink: 1 }}>{item.event.replace(' ', '\n')}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '900', color: COLORS.text }}>{item.plate}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
