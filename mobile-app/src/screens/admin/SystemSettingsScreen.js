import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function SystemSettingsScreen({ navigation }) {
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
        
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 24 }}>System Settings</Text>

        {/* General Settings Card */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Feather name="settings" size={20} color={COLORS.textMuted} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>General Settings</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 }}>Institution Name</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 50, justifyContent: 'center' }}>
                <TextInput 
                  value="State Universi"
                  style={{ fontSize: 15, color: COLORS.text, fontWeight: '500' }}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 }}>Timezone</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '500' }}>UTC-08:00 (P...</Text>
                <Feather name="chevron-down" size={16} color={COLORS.textMuted} />
              </View>
            </View>
          </View>

        </View>

        {/* AI & Security Card */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 24, marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Feather name="shield" size={20} color={COLORS.textMuted} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>AI & Security</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600', marginBottom: 16 }}>AI Confidence{'\n'}Threshold</Text>
              
              {/* Mock Slider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 40 }}>
                <View style={{ flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: '80%', height: '100%', backgroundColor: '#A18A75', borderRadius: 4 }} />
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#A18A75', marginLeft: -8, borderWidth: 2, borderColor: COLORS.white }} />
                </View>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 }}>Auto-Reject Below</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '500' }}>60% Confide...</Text>
                <Feather name="chevron-down" size={16} color={COLORS.textMuted} />
              </View>
            </View>
          </View>

        </View>

        {/* Save Button */}
        <TouchableOpacity style={[styles.primaryBtn, { width: '100%', height: 56 }]}>
          <Text style={styles.primaryBtnText}>Save All Changes</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
