import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function UnauthorizedLogsScreen({ navigation }) {
  const logs = [
    { id: 1, plate: 'UNKNOWN', time: 'Today, 10:42 AM', loc: 'Main Gate Entry' },
    { id: 2, plate: 'UNKNOWN', time: 'Today, 10:42 AM', loc: 'Main Gate Entry' },
    { id: 3, plate: 'UNKNOWN', time: 'Today, 10:42 AM', loc: 'Main Gate Entry' },
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
        
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 24 }}>Unauthorized Entry Logs</Text>

        {/* Results Table Mock */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border }}>
          
          {/* Table Header */}
          <View style={{ flexDirection: 'row', padding: 20, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ flex: 1.2, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Snapshot</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Detected{'\n'}Plate</Text>
            <Text style={{ flex: 1.2, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Time &{'\n'}Location</Text>
          </View>

          {/* Table Rows */}
          {logs.map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', padding: 20, borderBottomWidth: index === logs.length - 1 ? 0 : 1, borderBottomColor: COLORS.border, alignItems: 'center' }}>
              <View style={{ flex: 1.2, paddingRight: 10 }}>
                {/* Mock Image Box */}
                <View style={{ width: '100%', height: 60, backgroundColor: COLORS.border, borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                   <Feather name="image" size={24} color={COLORS.textMuted} />
                   <View style={{ position: 'absolute', bottom: 0, width: '100%', height: '30%', backgroundColor: 'rgba(0,0,0,0.5)' }} />
                </View>
              </View>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '900', color: COLORS.text }}>{item.plate}</Text>
              <View style={{ flex: 1.2 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4 }}>{item.time}</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: COLORS.textMuted }}>{item.loc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
