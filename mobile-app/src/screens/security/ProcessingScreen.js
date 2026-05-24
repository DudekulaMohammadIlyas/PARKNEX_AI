import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, Dimensions, StyleSheet, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function ProcessingScreen({ navigation }) {
  const scanAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop scanning animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Auto-navigate to result after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('AccessGranted');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150] // Adjust based on box height
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      
      {/* Header */}
      <View style={{ alignItems: 'center', padding: 24, paddingTop: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 8 }}>Processing AI Scan...</Text>
        <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: '600' }}>Analyzing number plate</Text>
      </View>

      {/* Camera Viewfinder Mock with Scanning Overlay */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 40 }}>
        <View style={{ flex: 1, backgroundColor: '#E2E8F0', borderRadius: 32, overflow: 'hidden', borderWidth: 4, borderColor: COLORS.text, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 }}>
          
          <View style={{ flex: 1, backgroundColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="image" size={60} color={COLORS.textMuted} />
            
            {/* The Plate Overlay Box */}
            <View style={{ position: 'absolute', top: '40%', width: 240, height: 60, backgroundColor: 'rgba(16, 185, 129, 0.4)', borderWidth: 3, borderColor: COLORS.success, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: '900', letterSpacing: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 4 }}>KA 01 AB 1234</Text>
            </View>

            {/* Scanning Line Indicator */}
            <Animated.View style={{ position: 'absolute', top: '40%', width: 240, height: 2, backgroundColor: COLORS.success, shadowColor: COLORS.success, shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, shadowOpacity: 1, elevation: 10, transform: [{ translateY }] }} />
          </View>

          {/* Glassmorphism Confidence Card */}
          <View style={{ position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600' }}>Confidence Score</Text>
              <Text style={{ color: COLORS.success, fontSize: 18, fontWeight: '900' }}>98.5%</Text>
            </View>
            {/* Progress Bar */}
            <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: '98.5%', height: '100%', backgroundColor: COLORS.success, borderRadius: 4 }} />
            </View>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}
