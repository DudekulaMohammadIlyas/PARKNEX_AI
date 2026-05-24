import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function SystemActivityScreen({ navigation }) {
  const logs = [
    { time: '2026-05-06 14:32:11', user: 'Admin User', action: 'Updated Settings' },
    { time: '2026-05-06 12:15:00', user: 'Sgt. Davis', action: 'Manual Override' },
    { time: '2026-05-06 09:00:22', user: 'System', action: 'Broadcast Sent' },
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
          <TouchableOpacity onPress={() => navigation.navigate('AdminProfile')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 24 }}>System Activity Logs</Text>

        {/* Results Table Mock */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border }}>
          
          {/* Table Header */}
          <View style={{ flexDirection: 'row', padding: 20, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ flex: 1.2, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Timestamp</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>User</Text>
            <Text style={{ flex: 1.2, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Action</Text>
          </View>

          {/* Table Rows */}
          {logs.map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', padding: 20, borderBottomWidth: index === logs.length - 1 ? 0 : 1, borderBottomColor: COLORS.border, alignItems: 'center' }}>
              <View style={{ flex: 1.2, paddingRight: 10 }}>
                 <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textMuted }}>{item.time.split(' ')[0]}</Text>
                 <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textMuted }}>{item.time.split(' ')[1]}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '900', color: COLORS.text, paddingRight: 8 }}>{item.user.replace(' ', '\n')}</Text>
              <Text style={{ flex: 1.2, fontSize: 14, fontWeight: '600', color: COLORS.text }}>{item.action.replace(' ', '\n')}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
