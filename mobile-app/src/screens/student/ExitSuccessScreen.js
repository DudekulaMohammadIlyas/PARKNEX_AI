import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function ExitSuccessScreen({ navigation }) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Success Icon */}
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: COLORS.success, justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="check" size={32} color={COLORS.success} />
          </View>
        </View>

        <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 8, letterSpacing: -0.5 }}>Exit Successful</Text>
        <Text style={{ fontSize: 16, color: COLORS.textMuted, fontWeight: '500', marginBottom: 40 }}>Thank you for using ParkNex AI.</Text>

        {/* Receipt Card */}
        <View style={{ width: '100%', backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', padding: 24, marginBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
            <Text style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: '600' }}>Vehicle</Text>
            <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: '800' }}>KA-01-AB-1234</Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
            <Text style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: '600' }}>Duration</Text>
            <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: '800' }}>4h 30m</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
            <Text style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: '600' }}>Time</Text>
            <Text style={{ fontSize: 15, color: COLORS.text, fontWeight: '800' }}>09:00 AM - 01:30 PM</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 20 }}>
            <Text style={{ fontSize: 18, color: COLORS.text, fontWeight: '900' }}>Total Fee</Text>
            <Text style={{ fontSize: 22, color: COLORS.primary, fontWeight: '900' }}>$0.00</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryBtn, { width: '100%', height: 56 }]}
          onPress={() => navigation.navigate('StudentHome')}
        >
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
