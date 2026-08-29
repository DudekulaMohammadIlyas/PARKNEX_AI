import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config, { smartApiRequest } from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentPassScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState('');
  const [digitalPass, setDigitalPass] = useState(null);
  const [passStartDate, setPassStartDate] = useState(new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }));
  const [passValidityDate, setPassValidityDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }));
  const [passPlanDays, setPassPlanDays] = useState('30');
  const [countdownDays, setCountdownDays] = useState(30);

  useEffect(() => {
    const loadPassData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@parknex_user');
        const userObj = storedUser ? JSON.parse(storedUser) : { email: 'student@college.edu', name: 'Student' };
        setUser(userObj);

        const userEmail = userObj.email || 'student@college.edu';
        const isDemoUser = userEmail.toLowerCase() === 'student@college.edu';

        const savedStart = await AsyncStorage.getItem(`@parknex_start_${userEmail}`);
        const savedValid = await AsyncStorage.getItem(`@parknex_valid_${userEmail}`);
        const savedDays = await AsyncStorage.getItem(`@parknex_days_${userEmail}`);

        if (savedStart) setPassStartDate(savedStart);
        if (savedValid) setPassValidityDate(savedValid);
        if (savedDays) {
          setPassPlanDays(savedDays);
          setCountdownDays(Number(savedDays));
        }

        // Fetch vehicles from server using smartApiRequest
        try {
          const vehRes = await smartApiRequest('get', `/vehicles?email=${encodeURIComponent(userEmail)}`);
          if (Array.isArray(vehRes.data) && vehRes.data.length > 0) {
            const mapped = vehRes.data.map(v => ({
              id: v.id,
              brand: v.brand,
              model: v.model || 'Standard',
              color: v.color || 'White',
              type: v.type === 'TWO_WHEELER' ? '2-Wheeler' : v.type === 'ELECTRIC_VEHICLE' ? 'EV' : '4-Wheeler',
              plate: v.plateNumber || v.plate,
              status: v.status || 'Verified'
            }));
            setVehicles(mapped);
            setSelectedVehiclePlate(mapped[0].plate);
            await AsyncStorage.setItem(`@parknex_vehicles_${userEmail.toLowerCase()}`, JSON.stringify(mapped));
          } else {
            const savedVehicles = await AsyncStorage.getItem(`@parknex_vehicles_${userEmail.toLowerCase()}`);
            if (savedVehicles) {
              const parsed = JSON.parse(savedVehicles);
              setVehicles(parsed);
              if (parsed.length > 0) setSelectedVehiclePlate(parsed[0].plate);
            } else if (isDemoUser) {
              const demo = [
                { id: '1', brand: 'Honda', model: 'Civic', color: 'Pearl White', type: '4-Wheeler', plate: 'KA-09-ZZ-9999', status: 'Verified' },
                { id: '2', brand: 'Yamaha', model: 'R15', color: 'Racing Blue', type: '2-Wheeler', plate: 'AP02JT7894', status: 'Verified' }
              ];
              setVehicles(demo);
              setSelectedVehiclePlate('KA-09-ZZ-9999');
            } else {
              setVehicles([]);
              setSelectedVehiclePlate('');
            }
          }
        } catch (e) {
          setVehicles([]);
        }

        const passRes = await smartApiRequest('get', `/passes/my-pass?email=${encodeURIComponent(userEmail)}`).catch(() => null);
        if (passRes?.data) setDigitalPass(passRes.data);
      } catch (e) {}
    };

    loadPassData();
  }, []);

  const activeVehicle = vehicles.find(v => v.plate === selectedVehiclePlate) || vehicles[0];

  const getQRPayload = () => {
    if (!activeVehicle) return '';
    return JSON.stringify({
      system: "PARKNEX_AI_GATE_PASS",
      studentName: user?.name || 'Student',
      studentId: 'STU-2026-089',
      passSerial: digitalPass?.passNumber || `PASS-STU-${(user?.email || 'USER').split('@')[0].toUpperCase()}`,
      vehiclePlate: activeVehicle.plate,
      vehicleBrand: activeVehicle.brand,
      vehicleModel: activeVehicle.model || 'Standard',
      vehicleType: activeVehicle.type,
      color: activeVehicle.color || 'White',
      validUntil: 'December 31, 2026'
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        
        <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 4 }}>
          Digital Campus Parking Pass
        </Text>
        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
          Scan at Gate Barrier for Instant Entry & Exit Release
        </Text>

        {/* PERMIT EXPIRATION COUNTDOWN & ADVANCE RENEWAL BANNER */}
        <View style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1.5, borderRadius: 20, padding: 16, marginBottom: 20, width: '100%', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FBBF24', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="time" size={24} color="#78350F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#78350F' }}>
                Permit Validity: {countdownDays} Days Remaining
              </Text>
              <Text style={{ fontSize: 11, color: '#92400E', fontWeight: '600', marginTop: 2, lineHeight: 16 }}>
                Issued: {passStartDate} • Valid Until: {passValidityDate}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={{ backgroundColor: '#D97706', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            onPress={() => {
              Alert.alert(
                'Select Advance Renewal Plan 🎫',
                'Choose a dynamic validity duration plan:',
                [
                  {
                    text: '🗓️ 1-Day Daily (₹50)',
                    onPress: async () => {
                      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                      const validStr = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                      setPassStartDate(todayStr);
                      setPassValidityDate(validStr);
                      setPassPlanDays('1');
                      setCountdownDays(1);
                      const uEmail = user?.email || 'student@college.edu';
                      await AsyncStorage.setItem(`@parknex_start_${uEmail}`, todayStr);
                      await AsyncStorage.setItem(`@parknex_valid_${uEmail}`, validStr);
                      await AsyncStorage.setItem(`@parknex_days_${uEmail}`, '1');
                      Alert.alert('Pass Renewed! 🎫', `1-Day Daily Plan Active until ${validStr}`);
                    }
                  },
                  {
                    text: '🗓️ 30-Day Monthly (₹499)',
                    onPress: async () => {
                      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                      const validStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                      setPassStartDate(todayStr);
                      setPassValidityDate(validStr);
                      setPassPlanDays('30');
                      setCountdownDays(30);
                      const uEmail = user?.email || 'student@college.edu';
                      await AsyncStorage.setItem(`@parknex_start_${uEmail}`, todayStr);
                      await AsyncStorage.setItem(`@parknex_valid_${uEmail}`, validStr);
                      await AsyncStorage.setItem(`@parknex_days_${uEmail}`, '30');
                      Alert.alert('Pass Renewed! 🎫', `30-Day Monthly Plan Active until ${validStr}`);
                    }
                  },
                  {
                    text: '🎓 180-Day Semester (₹1,499)',
                    onPress: async () => {
                      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                      const validStr = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                      setPassStartDate(todayStr);
                      setPassValidityDate(validStr);
                      setPassPlanDays('180');
                      setCountdownDays(180);
                      const uEmail = user?.email || 'student@college.edu';
                      await AsyncStorage.setItem(`@parknex_start_${uEmail}`, todayStr);
                      await AsyncStorage.setItem(`@parknex_valid_${uEmail}`, validStr);
                      await AsyncStorage.setItem(`@parknex_days_${uEmail}`, '180');
                      Alert.alert('Pass Renewed! 🎫', `180-Day Semester Plan Active until ${validStr}`);
                    }
                  },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <Ionicons name="card" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>Select & Pay Plan Renewal</Text>
          </TouchableOpacity>
        </View>

        {vehicles.length === 0 ? (
          <View style={[styles.card, { padding: 30, alignItems: 'center', width: '100%', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border }]}>
            <MaterialCommunityIcons name="car-outline" size={54} color={COLORS.primary} />
            <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text, marginTop: 12, textAlign: 'center' }}>
              Pass Pending Vehicle Registration
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 18 }}>
              Welcome {user?.name || 'Student'}! Your permit is active. Please register your vehicle under 'My Vehicles' to activate your scannable entrance QR pass.
            </Text>
            <TouchableOpacity 
              style={[styles.primaryBtn, { paddingHorizontal: 24 }]}
              onPress={() => navigation.navigate('Vehicles')}
            >
              <Text style={styles.primaryBtnText}>+ Register Vehicle Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* VEHICLE SWITCHER PILLS */}
            <View style={{ width: '100%', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.textMuted, marginBottom: 8, textAlign: 'center' }}>
                Select Vehicle to Display Scannable QR Code:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {vehicles.map(v => {
                  const isSel = selectedVehiclePlate === v.plate;
                  return (
                    <TouchableOpacity
                      key={v.plate}
                      onPress={() => setSelectedVehiclePlate(v.plate)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: isSel ? COLORS.primary : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: isSel ? COLORS.primary : COLORS.border
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: isSel ? '#fff' : COLORS.text }}>
                        {v.type === '2-Wheeler' ? '🏍️' : '🚗'} {v.plate}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* PASS CARD */}
            <View style={{ width: '100%', backgroundColor: '#0F172A', borderRadius: 24, padding: 24, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: COLORS.primary }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.primary, letterSpacing: 1 }}>PARKNEX CAMPUS PASS</Text>
                <View style={[styles.badge, { backgroundColor: '#064E3B' }]}>
                  <Text style={{ color: '#34D399', fontSize: 10, fontWeight: '900' }}>● ACTIVE</Text>
                </View>
              </View>

              {/* QR CODE */}
              <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 16 }}>
                <QRCode value={getQRPayload()} size={150} />
              </View>
              <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '800', marginBottom: 14 }}>
                Unique Scannable QR for {selectedVehiclePlate}
              </Text>

              <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 4 }}>{user?.name || 'Student'}</Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>{user?.email || 'student@college.edu'}</Text>

              <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>Start Date</Text>
                  <Text style={{ fontSize: 11, color: '#fff', fontWeight: '800' }}>{passStartDate}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>Valid Until</Text>
                  <Text style={{ fontSize: 11, color: '#34D399', fontWeight: '800' }}>{passValidityDate}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>Renewal Plan</Text>
                  <Text style={{ fontSize: 11, color: '#fff', fontWeight: '800' }}>{passPlanDays === '1' ? 'Daily Plan (1 Day)' : passPlanDays === '180' ? 'Semester Plan (180 Days)' : 'Monthly Plan (30 Days)'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>Pass Serial</Text>
                  <Text style={{ fontSize: 11, color: '#fff', fontWeight: '800' }}>{digitalPass?.passNumber || `PASS-STU-${(user?.email || 'USER').split('@')[0].toUpperCase()}`}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>Category</Text>
                  <Text style={{ fontSize: 11, color: '#fff', fontWeight: '800' }}>Student Tier (Subsidized)</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>Active QR Vehicle</Text>
                  <Text style={{ fontSize: 11, color: '#38BDF8', fontWeight: '800' }}>{selectedVehiclePlate} ({activeVehicle?.brand})</Text>
                </View>
              </View>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
