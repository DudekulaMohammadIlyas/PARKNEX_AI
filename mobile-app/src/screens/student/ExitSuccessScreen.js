import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function ExitSuccessScreen({ navigation, route }) {
  const plate = route?.params?.plate || 'NO VEHICLE LINKED';
  const duration = route?.params?.duration || '4 Hours';
  const time = route?.params?.time || 'Just Now';
  const amount = route?.params?.amount || '₹0.00';
  const officer = route?.params?.officer || 'Security Officer';
  const reason = route?.params?.reason || 'Verified via Mobile Security Scanner';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Success Icon */}
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: COLORS.success, justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="check" size={32} color={COLORS.success} />
          </View>
        </View>

        <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.text, marginBottom: 6, letterSpacing: -0.5 }}>Exit Verified & Released</Text>
        <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600', marginBottom: 24, textAlign: 'center' }}>
          Your vehicle exit has been officially verified by campus security.
        </Text>

        {/* Security Verification Badge */}
        <View style={{ backgroundColor: '#DCFCE7', borderColor: '#86EFAC', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <Feather name="shield" size={16} color="#15803D" />
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#15803D' }}>
            VERIFIED BY: {officer}
          </Text>
        </View>

        {/* Receipt Card */}
        <View style={{ width: '100%', backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', padding: 22, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
            <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600' }}>Vehicle Plate</Text>
            <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '800' }}>{plate}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
            <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600' }}>Barrier Gate</Text>
            <Text style={{ fontSize: 14, color: '#15803D', fontWeight: '900' }}>✅ Barrier Released / Opened</Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
            <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600' }}>Parking Session</Text>
            <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '800' }}>{duration}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
            <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600' }}>Exit Time</Text>
            <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '800' }}>{time}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16 }}>
            <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: '900' }}>Total Fee</Text>
            <Text style={{ fontSize: 18, color: COLORS.primary, fontWeight: '900' }}>{amount} (Permit Included)</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryBtn, { width: '100%', height: 52 }]}
          onPress={() => navigation.navigate('StudentHome')}
        >
          <Text style={styles.primaryBtnText}>Return to Home Dashboard</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
