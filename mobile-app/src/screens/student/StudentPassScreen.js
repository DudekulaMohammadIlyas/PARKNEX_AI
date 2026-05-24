import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function StudentPassScreen({ session }) {
  const [primaryVehicle, setPrimaryVehicle] = useState('NO VEHICLE');
  const [passActive, setPassActive] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('@user_vehicles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) setPrimaryVehicle(parsed[0].plate);
      }
      
      const status = await AsyncStorage.getItem('@premium_pass');
      if (status === 'ACTIVE') setPassActive(true);
    } catch (e) {}
  };

  const qrValue = `PASS_${session?.user?.id || 'GUEST'}_${primaryVehicle}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Digital Pass</Text>
          <Text style={styles.subtitle}>Scan at the entry gate</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 0 }}>
        <View style={[styles.card, { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.white }]}>
          <View style={{ padding: 24, backgroundColor: 'white', borderRadius: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
            <QRCode value={qrValue} size={220} />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.text, marginTop: 32, letterSpacing: 1 }}>{primaryVehicle}</Text>
          <Text style={{ color: COLORS.textMuted, marginTop: 6, fontWeight: '600' }}>Valid until: {passActive ? 'Dec 2026' : 'Per Use'}</Text>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 40, width: '100%' }}>
            <View style={{ flex: 1, alignItems: 'center', padding: 20, backgroundColor: COLORS.bg, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 }}>STATUS</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.success, marginTop: 4 }}>ACTIVE</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', padding: 20, backgroundColor: COLORS.bg, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 }}>TYPE</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.primary, marginTop: 4 }}>{passActive ? 'MONTHLY' : 'DAILY'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
