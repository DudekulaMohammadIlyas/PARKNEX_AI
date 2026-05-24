import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const screenWidth = Dimensions.get('window').width;

export default function SecurityDashboard({ navigation }) {
  const chartData = {
    labels: ['08:00', '10:00', '12:00', '14:00'],
    datasets: [{ data: [20, 85, 90, 75, 80] }] // Adjusted to match the curve
  };

  const feed = [
    { id: '1', plate: 'KA-01-AB-1234', status: 'Entered', time: 'Just now', color: COLORS.success },
    { id: '2', plate: 'MH-12-XY-9090', status: 'Exited', time: '2 mins ago', color: COLORS.textMuted },
    { id: '3', plate: 'UNKNOWN', status: 'Denied', time: '5 mins ago', color: COLORS.danger },
    { id: '4', plate: 'DL-04-CZ-1111', status: 'Entered', time: '12 mins ago', color: COLORS.success },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F1F5F9' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>ParkNex AI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={() => navigation.navigate('VehicleSearch')}>
            <Feather name="search" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={{ position: 'relative' }}>
            <Feather name="bell" size={20} color={COLORS.textMuted} />
            <View style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger }} />
          </TouchableOpacity>
          <View style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />
          <TouchableOpacity onPress={() => navigation.navigate('OfficerProfile')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>S</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        {/* Metric Cards Row 1 */}
        <TouchableOpacity style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <View>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 }}>Vehicles In</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.text }}>342</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>+12%</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
          onPress={() => navigation.navigate('ExitScan')}
        >
          <View>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 }}>Vehicles Out (Tap to Scan Exit)</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.text }}>128</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.success }}>+5%</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <View>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 }}>Active Alerts</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.text }}>3</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.danger }}>-2</Text>
        </View>

        <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <View>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 }}>Occupancy</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.text }}>85%</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.warning }}>High</Text>
        </View>

        {/* Live Occupancy Trend Chart */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 20 }}>Live Occupancy Trend</Text>
          
          <View style={{ height: 200, justifyContent: 'flex-end', paddingBottom: 10, marginTop: 10 }}>
            {/* Guidelines & Y-Axis */}
            {[100, 75, 50, 25, 0].map((val, idx) => (
              <View key={idx} style={{ position: 'absolute', left: 0, right: 0, bottom: idx * 36 + 20, borderBottomWidth: 1, borderBottomColor: idx === 4 ? COLORS.border : 'rgba(226, 232, 240, 0.5)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 9, color: COLORS.textMuted, backgroundColor: COLORS.white, paddingRight: 4 }}>{val}%</Text>
              </View>
            ))}

            {/* Bars */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, paddingLeft: 30, zIndex: 10 }}>
              {[
                { label: '08:00', val: 20 },
                { label: '10:00', val: 85 },
                { label: '12:00', val: 90 },
                { label: '14:00', val: 75 },
                { label: '16:00', val: 80 }
              ].map((item, idx) => (
                <View key={idx} style={{ alignItems: 'center' }}>
                  <View style={{ height: 120, justifyContent: 'flex-end' }}>
                    <View 
                      style={{ 
                        width: 18, 
                        height: `${item.val}%`, 
                        backgroundColor: COLORS.primary, 
                        borderRadius: 9,
                        shadowColor: COLORS.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 2
                      }} 
                    />
                  </View>
                  <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 6, fontWeight: '700' }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Live Feed */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={() => navigation.navigate('SecurityLogs')}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.primary, textDecorationLine: 'underline' }}>View Full Security Logs</Text>
            </TouchableOpacity>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#047857', fontWeight: '800', fontSize: 11 }}>Live</Text>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            {feed.map(item => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}>{item.plate}</Text>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' }}>{item.status}</Text>
                </View>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '500' }}>{item.time}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button for Scan */}
      <View style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
        <TouchableOpacity 
          style={{ backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 }}
          onPress={() => navigation.navigate('Scan')}
        >
          <Feather name="camera" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '800' }}>Manual Scan</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
