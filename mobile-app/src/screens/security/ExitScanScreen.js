import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function ExitScanScreen({ navigation }) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text, marginLeft: 16 }}>Vehicle Exit Scan</Text>
      </View>
      <Text style={{ fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 }}>Point camera at exiting vehicle plate</Text>

      {/* Camera Viewfinder Mock */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 40 }}>
        <View style={{ flex: 1, backgroundColor: '#E2E8F0', borderRadius: 32, overflow: 'hidden', borderWidth: 4, borderColor: COLORS.text, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 }}>
          
          {/* Mocking the car image from screenshot */}
          <View style={{ flex: 1, backgroundColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="image" size={60} color={COLORS.textMuted} />
            <Text style={{ color: COLORS.textMuted, fontWeight: '600', marginTop: 12 }}>Camera Feed</Text>
          </View>

          {/* Viewfinder Corners (White) */}
          <View style={[localStyles.corner, localStyles.topLeft]} />
          <View style={[localStyles.corner, localStyles.topRight]} />
          <View style={[localStyles.corner, localStyles.bottomLeft]} />
          <View style={[localStyles.corner, localStyles.bottomRight]} />

          {/* Scan Button Overlay */}
          <View style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
            <TouchableOpacity 
              style={{ backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
              onPress={() => {
                // Simulate processing then exit
                navigation.navigate('ExitCleared');
              }}
            >
              <Feather name="camera" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '800' }}>Process Exit</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.white,
  },
  topLeft: {
    top: 32,
    left: 32,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 32,
    right: 32,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 120, // Above button
    left: 32,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 120,
    right: 32,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  }
});
