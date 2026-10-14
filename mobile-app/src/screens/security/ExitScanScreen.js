import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config, { smartApiRequest } from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function ExitScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [hasScannedCode, setHasScannedCode] = useState(false);

  const [qrToken, setQrToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [isReleasing, setIsReleasing] = useState(false);

  const handleBarCodeScanned = ({ data }) => {
    if (hasScannedCode || !data) return;
    setHasScannedCode(true);
    setQrToken(data);
    handleVerifyQR(data);
  };

  const handleVerifyQR = async (tokenOverride = null) => {
    const target = (tokenOverride || qrToken || '').trim();
    if (!target) {
      Alert.alert('Validation Error', 'Please enter or scan a valid QR pass code or license plate.');
      return;
    }

    try {
      const storedUser = await AsyncStorage.getItem('@parknex_user');
      const u = storedUser ? JSON.parse(storedUser) : null;
      if (!u || (u.role !== 'SECURITY' && u.role !== 'ADMIN' && u.role !== 'CAMPUS_ADMIN')) {
        Alert.alert('Security Auth Required', 'Only authenticated Security personnel or Administrators can perform vehicle releases. Please sign in to Security Portal.');
        if (navigation) navigation.navigate('Auth');
        return;
      }
    } catch (e) {}

    setIsScanning(true);
    setScannedResult(null);

    try {
      const res = await smartApiRequest('post', '/security/scan-qr', {
        qrData: target
      });

      if (res.data?.success) {
        setScannedResult(res.data);
      } else {
        Alert.alert('Scan Failed', res.data?.error || 'Unrecognized QR Code.');
      }
    } catch (err) {
      Alert.alert('Verification Error', err.response?.data?.error || 'Could not verify QR code.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmRelease = async () => {
    if (!scannedResult?.vehicle?.plateNumber) return;
    setIsReleasing(true);

    const plateNumber = scannedResult.vehicle.plateNumber;
    const bookingId = scannedResult.booking?.id || null;

    try {
      const storedUser = await AsyncStorage.getItem('@parknex_user').catch(() => null);
      const u = storedUser ? JSON.parse(storedUser) : null;
      const officerEmail = u?.email || 'security@college.edu';

      const res = await smartApiRequest('post', '/security/release-vehicle', {
        bookingId,
        plateNumber,
        officerEmail,
        role: 'SECURITY',
        remarks: 'Released via Mobile Security Scanner'
      });

      if (res.data?.success) {
        Alert.alert(
          '✅ Barrier Released',
          `Vehicle ${plateNumber} successfully verified and released by Security Officer.`,
          [{ text: 'OK', onPress: () => navigation.navigate('ExitCleared', { booking: res.data.booking, plateNumber }) }]
        );
      }
    } catch (err) {
      const errRes = err.response?.data;
      if (err.response?.status === 409 || errRes?.status === 'ALREADY_RELEASED') {
        Alert.alert(
          '⚠️ Duplicate Release Blocked',
          errRes?.error || `Vehicle ${plateNumber} was ALREADY released by another Security Officer.`
        );
        setScannedResult(prev => prev ? {
          ...prev,
          isEligible: false,
          status: 'ALREADY_RELEASED',
          eligibilityReason: `Vehicle ${plateNumber} has already been released.`
        } : null);
      } else {
        Alert.alert('Release Error', errRes?.error || 'Failed to execute vehicle release.');
      }
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6, marginRight: 12 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>Security QR Release</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Live Device Camera Viewfinder */}
        <View style={{ backgroundColor: '#0F172A', borderRadius: 24, overflow: 'hidden', height: 220, marginBottom: 20, borderColor: '#334155', borderWidth: 2, position: 'relative' }}>
          
          {!permission ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color="#10B981" size="large" />
              <Text style={{ color: '#94A3B8', marginTop: 8, fontSize: 12, fontWeight: '700' }}>Initializing Mobile Camera...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Feather name="camera-off" size={32} color="#EF4444" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900', textAlign: 'center' }}>Camera Permission Required</Text>
              <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'center', marginTop: 4, marginBottom: 14 }}>
                Please grant camera access to scan vehicle pass QR codes.
              </Text>
              <TouchableOpacity 
                onPress={requestPermission} 
                style={{ backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>Grant Camera Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1, position: 'relative' }}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing={facing}
                onBarcodeScanned={hasScannedCode ? undefined : handleBarCodeScanned}
              />
              
              <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 150, height: 110, borderRadius: 14, borderWidth: 2.5, borderColor: hasScannedCode ? '#10B981' : '#38BDF8', borderStyle: 'dashed' }} />
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900', marginTop: 8, backgroundColor: 'rgba(15,23,42,0.75)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  {hasScannedCode ? '✅ QR SCANNED' : 'ALIGN QR PASS CODE'}
                </Text>
              </View>

              <View style={{ position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', gap: 6 }}>
                {hasScannedCode && (
                  <TouchableOpacity onPress={() => setHasScannedCode(false)} style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>Scan Again</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')} style={{ backgroundColor: 'rgba(15,23,42,0.85)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                  <Feather name="refresh-cw" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>

        {/* Input & Quick Presets */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textMuted, marginBottom: 8 }}>QR Token / License Plate</Text>
          
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <TextInput
              style={[styles.input, { flex: 1, textTransform: 'uppercase', fontWeight: '800' }]}
              value={qrToken}
              onChangeText={(txt) => { setQrToken(txt); setHasScannedCode(false); }}
              placeholder="Enter QR token or vehicle plate"
            />
            <TouchableOpacity 
              style={{ backgroundColor: COLORS.primary, paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => handleVerifyQR()}
              disabled={isScanning}
            >
              {isScanning ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>Verify QR</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Verification Result Card */}
        {scannedResult && (
          <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: scannedResult.isEligible ? COLORS.success : COLORS.warning, marginBottom: 20 }]}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5 }}>SCANNED VEHICLE</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>{scannedResult.vehicle?.plateNumber}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>{scannedResult.vehicle?.brand} {scannedResult.vehicle?.model}</Text>
              </View>

              <View style={{ backgroundColor: scannedResult.isEligible ? '#DCFCE7' : '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: scannedResult.isEligible ? COLORS.success : COLORS.danger }}>
                  {scannedResult.isEligible ? 'ELIGIBLE' : scannedResult.status}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.textMuted }}>Owner: {scannedResult.owner?.name} ({scannedResult.owner?.email})</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.text, marginTop: 4 }}>Location: {scannedResult.booking?.zoneName || 'Main Campus'} — Slot {scannedResult.booking?.slotNumber || 'K-30'}</Text>
              <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{scannedResult.eligibilityReason}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: scannedResult.isEligible ? COLORS.success : '#94A3B8',
                  paddingVertical: 14
                }
              ]}
              disabled={!scannedResult.isEligible || isReleasing}
              onPress={handleConfirmRelease}
            >
              {isReleasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                  {scannedResult.isEligible ? '🚗 Confirm & Release Vehicle Barrier' : 'Ineligible for Barrier Release'}
                </Text>
              )}
            </TouchableOpacity>

          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

