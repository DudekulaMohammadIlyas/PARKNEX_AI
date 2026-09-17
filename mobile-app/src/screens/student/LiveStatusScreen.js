import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function LiveStatusScreen({ navigation, route }) {
  const slot = route?.params?.slot || 'Slot K-30';
  const zone = route?.params?.zone || 'KRISHNA HOSTEL';
  const plate = route?.params?.plate || 'NO VEHICLE LINKED';
  const time = route?.params?.time || 'Just Now';
  const duration = route?.params?.duration || '4 Hours';

  const qrPayload = JSON.stringify({
    system: "PARKNEX_AI_GATE_PASS",
    vehiclePlate: plate,
    slot: slot,
    zone: zone,
    time: time
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 16 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Session Status</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          
          {/* Blue Top Section */}
          <View style={{ backgroundColor: COLORS.primary, padding: 32, alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 16 }}>
              <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 13 }}>Currently Parked</Text>
            </View>
            <Text style={{ color: COLORS.white, fontSize: 26, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' }}>{zone} • {slot}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 8, fontWeight: '500' }}>Entered at {time}</Text>
          </View>

          {/* Details Section */}
          <View style={{ padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <Text style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: '600' }}>Vehicle</Text>
              <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '800' }}>{plate}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <Text style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: '600' }}>Duration</Text>
              <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '800' }}>{duration}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }}>
              <Text style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: '600' }}>AI Scan Confidence</Text>
              <Text style={{ fontSize: 15, color: COLORS.success, fontWeight: '900' }}>98.5%</Text>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <Text style={{ color: COLORS.textMuted, fontSize: 14, fontWeight: '500', marginBottom: 20 }}>Show this QR code at exit if AI scan fails</Text>
          <View style={{ padding: 20, backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
            <QRCode value={qrPayload} size={180} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
