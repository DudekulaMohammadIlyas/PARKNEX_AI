import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image, Platform } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function StudentHomeScreen({ navigation, occupancy, events }) {
  const userName = "Alex Carter"; // Mocked, would come from session
  const totalAvailable = occupancy?.totalSlots - occupancy?.occupiedSlots || 142;
  const totalZones = occupancy?.zones?.length || 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: Platform.OS === 'android' ? 50 : 20 }} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <View>
            <Text style={{ fontSize: 16, color: COLORS.textMuted, fontWeight: '600' }}>Good morning,</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5, marginTop: 2 }}>{userName}</Text>
          </View>
          <TouchableOpacity 
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Feather name="bell" size={20} color={COLORS.text} />
            <View style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger }} />
          </TouchableOpacity>
        </View>

        {/* Top Cards Row */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
          {/* Blue Card */}
          <TouchableOpacity 
            style={{ flex: 1.2, backgroundColor: COLORS.primary, borderRadius: 24, padding: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 }}
            onPress={() => navigation.navigate('ExitSuccess')}
          >
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' }}>Available Slots</Text>
            <Text style={{ color: '#fff', fontSize: 36, fontWeight: '900', marginVertical: 8 }}>{totalAvailable}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' }}>Across {totalZones} zones</Text>
          </TouchableOpacity>
          
          {/* White Card */}
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}
            onPress={() => navigation.navigate('Vehicles')}
          >
            <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: '600' }}>My Vehicles</Text>
            <Text style={{ color: COLORS.text, fontSize: 36, fontWeight: '900', marginVertical: 8 }}>2</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="check-circle" size={12} color={COLORS.success} />
              <Text style={{ color: COLORS.success, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>All verified</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}
            onPress={() => navigation.navigate('Book')}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="car-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text }}>Book Slot</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Feather name="map-pin" size={22} color={COLORS.success} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text }}>View Map</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}
            onPress={() => navigation.navigate('LiveStatus')}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Feather name="clock" size={22} color={COLORS.warning} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, textAlign: 'center' }}>Entry Status</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 14 }}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 12 }}>
          {/* Mocked Event 1 */}
          <TouchableOpacity 
            style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}
            onPress={() => navigation.navigate('SlotOccupied')}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <MaterialCommunityIcons name="car" size={20} color={COLORS.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>Vehicle Exited</Text>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' }}>KA-01-AB-1234 left Zone A</Text>
            </View>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '500' }}>Today, 2:30 PM</Text>
          </TouchableOpacity>

          {/* Mocked Event 2 */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Feather name="check-circle" size={20} color={COLORS.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>Booking Confirmed</Text>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' }}>Slot A-12 reserved</Text>
            </View>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '500', width: 65, textAlign: 'right' }}>Yesterday, 9:00 AM</Text>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
