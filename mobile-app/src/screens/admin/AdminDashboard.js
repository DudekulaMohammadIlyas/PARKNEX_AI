import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart, ProgressChart } from 'react-native-chart-kit';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboard({ navigation, onLogout }) {
  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [380, 290, 560, 440, 610, 190, 150] }]
  };

  const donutData = {
    labels: ["Students", "Faculty", "Visitors"],
    data: [0.65, 0.25, 0.10],
    colors: [COLORS.primary, COLORS.success, COLORS.warning]
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>ParkNex AI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity style={{ position: 'relative' }}>
            <Feather name="bell" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />
          <TouchableOpacity onPress={onLogout} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        {/* Metric Cards */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Feather name="users" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 }}>Total Users</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text }}>2,845</Text>
            </View>
          </View>

          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <MaterialCommunityIcons name="car-multiple" size={24} color={COLORS.success} />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 }}>Active Vehicles</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text }}>1,432</Text>
            </View>
          </View>

          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(168, 85, 247, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Feather name="check-circle" size={24} color="#A855F7" />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 }}>Today's Entries</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text }}>892</Text>
            </View>
          </View>

          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Feather name="alert-triangle" size={24} color={COLORS.danger} />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 }}>Security Alerts</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text }}>12</Text>
            </View>
          </View>
        </View>

        {/* Weekly Parking Volume Chart */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, width: '60%' }}>Weekly Parking Volume</Text>
            <View style={{ backgroundColor: COLORS.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
              <Text style={{ color: COLORS.textMuted, fontWeight: '700', fontSize: 12 }}>Last 7 Days</Text>
            </View>
          </View>
          
          <BarChart
            data={barData}
            width={screenWidth - 88}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            withInnerLines={true}
            showBarTops={false}
            showValuesOnTopOfBars={false}
            chartConfig={{
              backgroundColor: COLORS.white,
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              decimalPlaces: 0,
              color: (opacity = 1) => COLORS.primary,
              labelColor: (opacity = 1) => COLORS.textMuted,
              barPercentage: 0.6,
            }}
            style={{ borderRadius: 16, marginLeft: -20 }}
          />
        </View>

        {/* User Demographics */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 20 }}>User Demographics</Text>
          
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <ProgressChart
              data={donutData}
              width={screenWidth - 88}
              height={180}
              strokeWidth={16}
              radius={60}
              chartConfig={{
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                color: (opacity = 1, index) => donutData.colors[index] || COLORS.primary,
              }}
              hideLegend={true}
            />
            {/* Center Text mock */}
            <View style={{ position: 'absolute', top: 65, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text }}>100%</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600' }}>Total</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginRight: 8 }} />
                <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 14 }}>Students</Text>
              </View>
              <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 14 }}>65%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success, marginRight: 8 }} />
                <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 14 }}>Faculty</Text>
              </View>
              <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 14 }}>25%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.warning, marginRight: 8 }} />
                <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 14 }}>Visitors</Text>
              </View>
              <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 14 }}>10%</Text>
            </View>
          </View>
        </View>

        {/* Quick Links for Admin Navigation */}
        <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 }}>Management Portals</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <TouchableOpacity onPress={() => navigation.navigate('UserManagement')} style={{ width: '47%', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <Feather name="users" size={24} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: '700', color: COLORS.text }}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AuthorizedVehicles')} style={{ width: '47%', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <MaterialCommunityIcons name="car" size={24} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: '700', color: COLORS.text }}>Vehicles</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ManageZones')} style={{ width: '47%', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <Feather name="map" size={24} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: '700', color: COLORS.text }}>Zones & Slots</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Reports')} style={{ width: '47%', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <Feather name="file-text" size={24} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: '700', color: COLORS.text }}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* System & Security Links */}
        <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 }}>System & Security</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <TouchableOpacity onPress={() => navigation.navigate('UnauthorizedLogs')} style={{ width: '47%', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <Feather name="alert-triangle" size={24} color={COLORS.danger} style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: '700', color: COLORS.text }}>Unauthorized</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SystemActivity')} style={{ width: '47%', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <Feather name="activity" size={24} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: '700', color: COLORS.text }}>Activity Logs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('RoleManagement')} style={{ width: '47%', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <Feather name="shield" size={24} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: '700', color: COLORS.text }}>Roles</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SystemSettings')} style={{ width: '47%', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <Feather name="settings" size={24} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: '700', color: COLORS.text }}>Settings</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
