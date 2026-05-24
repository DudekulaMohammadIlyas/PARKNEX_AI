import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function ReportsScreen({ navigation }) {
  const reports = [
    { title: 'Daily Occupancy Summary', desc: 'Detailed breakdown of zone utilization over 24 hours.' },
    { title: 'Unauthorized Attempts', desc: 'Log of all denied entries and security alerts.' },
    { title: 'Revenue & Fees', desc: 'Financial report for paid visitor parking.' },
    { title: 'User Registration Trends', desc: 'New users and vehicle authorizations over time.' },
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
        
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 24 }}>Reports & Exports</Text>

        {/* Report Cards */}
        <View style={{ gap: 16 }}>
          {reports.map((report, index) => (
            <View key={index} style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border }}>
              
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Feather name="file-text" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 }}>{report.title}</Text>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '500', lineHeight: 20 }}>{report.desc}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                  <Feather name="activity" size={16} color={COLORS.text} style={{ marginRight: 8 }} />
                  <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 14 }}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                  <Feather name="download" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
                  <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 14 }}>Export PDF</Text>
                </TouchableOpacity>
              </View>

            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
