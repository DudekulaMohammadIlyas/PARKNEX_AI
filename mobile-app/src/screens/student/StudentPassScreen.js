import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Share
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { smartApiRequest } from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function StudentPassScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState('');
  const [digitalPass, setDigitalPass] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live countdown ticker state (exact days, hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    percent: 100
  });

  // Renewal Modal & Selection State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('30'); // '1' | '30' | '180'
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'WALLET' | 'CARD'
  const [isRenewing, setIsRenewing] = useState(false);

  // Receipts / Invoice History Modal
  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);

  // Renewal Success Modal
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Last synced timestamp
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

  // ================= LOAD & SYNC PASS DATA ================= //
  const fetchPassData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const storedUser = await AsyncStorage.getItem('@parknex_user');
      const userObj = storedUser ? JSON.parse(storedUser) : { email: 'student@college.edu', name: 'Student User' };
      setUser(userObj);

      const userEmail = userObj.email || 'student@college.edu';
      const userRole = userObj.role || 'STUDENT';
      const userName = userObj.name || 'Campus Student';

      // 1. Fetch live pass from server with real-time validity
      const passRes = await smartApiRequest(
        'get',
        `/passes/my-pass?email=${encodeURIComponent(userEmail)}&role=${encodeURIComponent(userRole)}&name=${encodeURIComponent(userName)}`
      ).catch(() => null);

      if (passRes?.data) {
        setDigitalPass(passRes.data);
        setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        await AsyncStorage.setItem(`@parknex_cached_pass_${userEmail}`, JSON.stringify(passRes.data));
      } else {
        // Fallback to cached pass
        const cached = await AsyncStorage.getItem(`@parknex_cached_pass_${userEmail}`);
        if (cached) setDigitalPass(JSON.parse(cached));
      }

      // 2. Fetch vehicles from server
      const vehRes = await smartApiRequest('get', `/vehicles?email=${encodeURIComponent(userEmail)}`).catch(() => null);
      if (Array.isArray(vehRes?.data) && vehRes.data.length > 0) {
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
        if (!selectedVehiclePlate || !mapped.some(m => m.plate === selectedVehiclePlate)) {
          setSelectedVehiclePlate(mapped[0].plate);
        }
      } else {
        const savedVehicles = await AsyncStorage.getItem(`@parknex_vehicles_${userEmail.toLowerCase()}`);
        if (savedVehicles) {
          try {
            const parsed = JSON.parse(savedVehicles);
            setVehicles(parsed);
            if (parsed.length > 0 && !selectedVehiclePlate) setSelectedVehiclePlate(parsed[0].plate);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Error fetching pass data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedVehiclePlate]);

  useEffect(() => {
    fetchPassData();
  }, [fetchPassData]);

  // Periodic real-time background sync (every 10s)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      fetchPassData(true);
    }, 10000);
    return () => clearInterval(syncInterval);
  }, [fetchPassData]);

  // Pull-to-refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPassData(false);
  };

  // ================= REAL-TIME COUNTDOWN TIMER (PER SECOND) ================= //
  useEffect(() => {
    if (!digitalPass?.validUntil) return;

    const updateCountdown = () => {
      const now = Date.now();
      const expiry = new Date(digitalPass.validUntil).getTime();
      const start = new Date(digitalPass.validFrom || digitalPass.issueDate).getTime();
      const diff = expiry - now;
      const totalDuration = Math.max(1000, expiry - start);

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          percent: 0
        });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const percent = Math.max(1, Math.min(100, Math.round((diff / totalDuration) * 100)));

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isExpired: false,
          percent
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [digitalPass?.validUntil, digitalPass?.validFrom, digitalPass?.issueDate]);

  // ================= AUTOMATIC EXIT MONITOR ================= //
  useEffect(() => {
    const userEmail = user?.email;
    if (!userEmail) return;

    const checkExitVerification = async () => {
      try {
        const bookRes = await smartApiRequest('get', `/bookings/my-bookings?email=${encodeURIComponent(userEmail)}`).catch(() => null);
        if (bookRes?.data && Array.isArray(bookRes.data)) {
          const hasConfirmed = bookRes.data.some(b => b.status === 'CONFIRMED');
          const exited = bookRes.data.find(b => b.status === 'EXITED' || b.status === 'RELEASED');
          if (!hasConfirmed && exited) {
            const lastHandled = await AsyncStorage.getItem('@parknex_last_exited_booking_id').catch(() => null);
            if (lastHandled !== String(exited.id)) {
              await AsyncStorage.setItem('@parknex_last_exited_booking_id', String(exited.id)).catch(() => null);

              navigation?.navigate('Home', {
                screen: 'ExitSuccess',
                params: {
                  plate: exited.plateNumber || selectedVehiclePlate || 'KA-01-AB-1234',
                  duration: `${exited.durationHours || 4} Hours`,
                  time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  amount: '₹0.00',
                  officer: exited.releasedBy || 'Security Officer',
                  status: 'EXIT CLEARED & BARRIER RELEASED'
                }
              });
            }
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(checkExitVerification, 3000);
    return () => clearInterval(interval);
  }, [user?.email, selectedVehiclePlate, navigation]);

  const activeVehicle = vehicles.find(v => v.plate === selectedVehiclePlate) || vehicles[0];

  // Scannable ANPR & Gate QR Payload
  const getQRPayload = () => {
    return JSON.stringify({
      system: 'PARKNEX_AI_GATE_PASS',
      passNumber: digitalPass?.passNumber || `PARKNEX-PASS-STU-${(user?.email || 'USER').split('@')[0].toUpperCase()}`,
      holderName: user?.name || digitalPass?.userName || 'Student',
      holderEmail: user?.email || digitalPass?.userEmail || 'student@college.edu',
      vehiclePlate: activeVehicle?.plate || digitalPass?.primaryVehiclePlate || 'KA-01-AB-1234',
      vehicleBrand: activeVehicle?.brand || 'Standard',
      vehicleType: activeVehicle?.type || '4-Wheeler',
      rfidTag: digitalPass?.rfidTag || 'RFID-STU-8849-OK',
      status: timeLeft.isExpired ? 'EXPIRED' : 'ACTIVE',
      validUntil: digitalPass?.validUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
      timestamp: new Date().toISOString()
    });
  };

  // ================= EXECUTE ADVANCE PASS RENEWAL ================= //
  const handleConfirmRenewal = async () => {
    setIsRenewing(true);
    try {
      const planDaysNum = parseInt(selectedPlan, 10);
      const planTitleStr = planDaysNum === 1
        ? '1-Day Daily Quick Pass'
        : planDaysNum === 180
        ? '180-Day Semester All-Access Pass'
        : '30-Day Monthly Commuter Pass';

      const amountStr = planDaysNum === 1
        ? '₹50.00'
        : planDaysNum === 180
        ? '₹1,499.00'
        : '₹499.00';

      const targetEmail = user?.email || 'student@college.edu';

      const response = await smartApiRequest('post', '/passes/renew', {
        email: targetEmail,
        planDays: planDaysNum,
        planTitle: planTitleStr,
        amount: amountStr,
        paymentMethod: paymentMethod === 'UPI' ? 'UPI (PhonePe/GPay)' : paymentMethod === 'WALLET' ? 'Student Campus Wallet' : 'Campus Card',
        vehiclePlate: activeVehicle?.plate || selectedVehiclePlate || 'KA-01-AB-1234'
      });

      if (response?.data?.success && response.data.pass) {
        setDigitalPass(response.data.pass);
        setLatestReceipt(response.data.receipt);
        await AsyncStorage.setItem(`@parknex_cached_pass_${targetEmail}`, JSON.stringify(response.data.pass));

        setIsRenewModalOpen(false);
        setIsSuccessModalOpen(true);
      } else {
        throw new Error(response?.data?.message || 'Server did not confirm renewal');
      }
    } catch (error) {
      console.error('Renewal Error:', error);
      Alert.alert(
        'Renewal Failed',
        error?.response?.data?.error || error.message || 'Could not reach renewal gateway. Please check your network and try again.'
      );
    } finally {
      setIsRenewing(false);
    }
  };

  // Share Receipt
  const handleShareReceipt = async (receipt) => {
    if (!receipt) return;
    try {
      await Share.share({
        title: `ParkNex Parking Pass Receipt - ${receipt.invoiceId || receipt.id}`,
        message: `🎫 Official ParkNex Parking Permit Receipt\nInvoice: ${receipt.invoiceId || receipt.id}\nPlan: ${receipt.planTitle || receipt.plan}\nAmount: ${receipt.amount}\nValid Until: ${new Date(receipt.validUntil).toLocaleDateString()}\nVehicle: ${receipt.vehiclePlate || 'Registered'}\nStatus: PAID ✅`
      });
    } catch (e) {}
  };

  // Determine Visual Health Color
  const getStatusColor = () => {
    if (timeLeft.isExpired) return '#EF4444';
    if (timeLeft.days <= 3) return '#F59E0B';
    return '#10B981';
  };

  const getStatusBadgeText = () => {
    if (timeLeft.isExpired) return '⛔ EXPIRED';
    if (timeLeft.days <= 3) return `⚠️ EXPIRING SOON (${timeLeft.days}d ${timeLeft.hours}h)`;
    return '● ACTIVE';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0B0F19' }]}>
      {/* HEADER */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
        backgroundColor: '#111827',
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {navigation?.canGoBack?.() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6, marginLeft: -6, marginRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#F3F4F6" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#F9FAFB', letterSpacing: 0.3 }}>
              Digital Campus Pass
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
              <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>
                Live RFID Gate Synced • {lastSyncTime}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#1F2937',
              paddingVertical: 7,
              paddingHorizontal: 11,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#374151',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}
            onPress={() => setIsReceiptsModalOpen(true)}
          >
            <MaterialCommunityIcons name="file-document-outline" size={15} color="#93C5FD" />
            <Text style={{ color: '#93C5FD', fontWeight: '800', fontSize: 11 }}>Invoices</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      >
        {isLoading && !digitalPass ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 12, fontWeight: '600' }}>
              Connecting to Campus Gate System...
            </Text>
          </View>
        ) : (
          <>
            {/* REAL-TIME VALIDITY & RENEWAL COMMAND BANNER */}
            <View style={{
              width: '100%',
              backgroundColor: timeLeft.isExpired ? '#2D1515' : timeLeft.days <= 3 ? '#2A1F0D' : '#0F231D',
              borderColor: getStatusColor(),
              borderWidth: 1.5,
              borderRadius: 22,
              padding: 18,
              marginBottom: 18,
              shadowColor: getStatusColor(),
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 4
            }}>
              {/* Header inside banner */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${getStatusColor()}25`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: getStatusColor()
                  }}>
                    <Ionicons name="time" size={22} color={getStatusColor()} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: '#F9FAFB' }}>
                      Permit Validity Status
                    </Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 1 }}>
                      Valid Until: {digitalPass?.formattedValidUntil || 'Active'}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={{
                  backgroundColor: `${getStatusColor()}20`,
                  paddingVertical: 5,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: getStatusColor()
                }}>
                  <Text style={{ color: getStatusColor(), fontSize: 11, fontWeight: '900' }}>
                    {getStatusBadgeText()}
                  </Text>
                </View>
              </View>

              {/* LIVE COUNTDOWN TICKER BOXES */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 14,
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 14,
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)'
              }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#F9FAFB' }}>
                    {String(timeLeft.days).padStart(2, '0')}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginTop: 2 }}>DAYS</Text>
                </View>
                <Text style={{ fontSize: 18, color: '#4B5563', alignSelf: 'center' }}>:</Text>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#F9FAFB' }}>
                    {String(timeLeft.hours).padStart(2, '0')}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginTop: 2 }}>HOURS</Text>
                </View>
                <Text style={{ fontSize: 18, color: '#4B5563', alignSelf: 'center' }}>:</Text>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#F9FAFB' }}>
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginTop: 2 }}>MINS</Text>
                </View>
                <Text style={{ fontSize: 18, color: '#4B5563', alignSelf: 'center' }}>:</Text>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: getStatusColor() }}>
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginTop: 2 }}>SECS</Text>
                </View>
              </View>

              {/* DYNAMIC PROGRESS BAR */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '700' }}>
                    Validity Lifeline Meter
                  </Text>
                  <Text style={{ fontSize: 11, color: getStatusColor(), fontWeight: '800' }}>
                    {timeLeft.isExpired ? '0% (Expired)' : `${timeLeft.percent}% Remaining`}
                  </Text>
                </View>
                <View style={{
                  height: 8,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  overflow: 'hidden'
                }}>
                  <View style={{
                    width: `${Math.max(2, timeLeft.percent)}%`,
                    height: '100%',
                    backgroundColor: getStatusColor(),
                    borderRadius: 6
                  }} />
                </View>
              </View>

              {/* ACTION BUTTONS (RENEW + INVOICE) */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1.2,
                    backgroundColor: '#4F46E5',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                    shadowColor: '#4F46E5',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 3
                  }}
                  onPress={() => setIsRenewModalOpen(true)}
                >
                  <Ionicons name="card" size={17} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>
                    {timeLeft.isExpired ? 'Reactivate Permit ⚡' : 'Extend / Renew Pass'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 0.8,
                    backgroundColor: '#1E293B',
                    borderWidth: 1.5,
                    borderColor: '#374151',
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onPress={() => setIsReceiptsModalOpen(true)}
                >
                  <MaterialCommunityIcons name="receipt" size={16} color="#94A3B8" />
                  <Text style={{ color: '#E2E8F0', fontWeight: '800', fontSize: 12 }}>Receipts</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* VEHICLE SELECTOR PILLS */}
            {vehicles.length > 0 && (
              <View style={{ width: '100%', marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', marginBottom: 8, letterSpacing: 0.5 }}>
                  ACTIVE VEHICLE QR CODE SWITCHER:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {vehicles.map(v => {
                    const isSel = selectedVehiclePlate === v.plate;
                    return (
                      <TouchableOpacity
                        key={v.plate}
                        onPress={() => setSelectedVehiclePlate(v.plate)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 12,
                          backgroundColor: isSel ? '#4F46E5' : '#1F2937',
                          borderWidth: 1.5,
                          borderColor: isSel ? '#818CF8' : '#374151',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <Text style={{ fontSize: 12 }}>
                          {v.type === '2-Wheeler' ? '🏍️' : v.type === 'EV' ? '⚡' : '🚗'}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: isSel ? '#fff' : '#E5E7EB' }}>
                          {v.plate}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* DIGITAL HOLOGRAPHIC PASS CARD */}
            <View style={{
              width: '100%',
              backgroundColor: '#0F172A',
              borderRadius: 26,
              padding: 22,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: 'rgba(99, 102, 241, 0.4)',
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Card Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
                marginBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.08)',
                paddingBottom: 12
              }}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#818CF8', letterSpacing: 1.2 }}>
                    PARKNEX CAMPUS PERMIT
                  </Text>
                  <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700' }}>
                    {digitalPass?.tier || 'Student Commuter Pass'}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: `${getStatusColor()}20`,
                  borderColor: getStatusColor(),
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingVertical: 4,
                  paddingHorizontal: 8
                }}>
                  <Text style={{ color: getStatusColor(), fontSize: 10, fontWeight: '900' }}>
                    {getStatusBadgeText()}
                  </Text>
                </View>
              </View>

              {/* QR Code Container */}
              <View style={{
                backgroundColor: '#FFFFFF',
                padding: 16,
                borderRadius: 22,
                marginBottom: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 5
              }}>
                <QRCode
                  value={getQRPayload()}
                  size={160}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>

              <Text style={{ fontSize: 12, color: '#818CF8', fontWeight: '900', marginBottom: 2 }}>
                ANPR & RFID Tag: {digitalPass?.rfidTag || 'RFID-STU-8849-OK'}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 16 }}>
                Active for Vehicle: <Text style={{ color: '#F1F5F9', fontWeight: '800' }}>{selectedVehiclePlate || 'All Registered'}</Text>
              </Text>

              {/* Pass Details Table */}
              <View style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.06)',
                gap: 9
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Holder Name</Text>
                  <Text style={{ fontSize: 11, color: '#F8FAFC', fontWeight: '800' }}>
                    {user?.name || digitalPass?.userName || 'Campus Student'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Pass Serial #</Text>
                  <Text style={{ fontSize: 11, color: '#818CF8', fontWeight: '800' }}>
                    {digitalPass?.passNumber || 'PARKNEX-PASS-STU-8849'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Validity Period</Text>
                  <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '800' }}>
                    {digitalPass?.formattedValidFrom || 'Start'} → {digitalPass?.formattedValidUntil || 'Valid'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Plan Tier</Text>
                  <Text style={{ fontSize: 11, color: '#F8FAFC', fontWeight: '800' }}>
                    {digitalPass?.planType === 'DAILY' ? '1-Day Daily' : digitalPass?.planType === 'SEMESTER' ? '180-Day Semester' : '30-Day Monthly'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Gate Barrier</Text>
                  <Text style={{ fontSize: 11, color: '#38BDF8', fontWeight: '800' }}>
                    ⚡ Instant RFID Auto-Lift Active
                  </Text>
                </View>
              </View>

              {/* Authorized Zones Strip */}
              <View style={{
                width: '100%',
                marginTop: 12,
                padding: 10,
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(99, 102, 241, 0.2)'
              }}>
                <Text style={{ fontSize: 10, color: '#A5B4FC', fontWeight: '800', marginBottom: 4 }}>
                  🅿️ AUTHORIZED CAMPUS ZONES:
                </Text>
                <Text style={{ fontSize: 11, color: '#E0E7FF', fontWeight: '700', lineHeight: 16 }}>
                  {digitalPass?.authorizedZones?.join(' • ') || 'Krishna Hostel • South Block • Central Library • CS Academic Block'}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ================= MODAL 1: ADVANCE RENEWAL SELECTION ================= */}
      <Modal visible={isRenewModalOpen} animationType="slide" transparent>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.75)',
          justifyContent: 'flex-end'
        }}>
          <View style={{
            backgroundColor: '#111827',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 22,
            borderTopWidth: 1.5,
            borderTopColor: '#374151',
            maxHeight: '90%'
          }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#F9FAFB' }}>
                  Advance Pass Renewal 🎫
                </Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  Extends from your current expiry with zero lost days
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsRenewModalOpen(false)}
                style={{ padding: 6, backgroundColor: '#1F2937', borderRadius: 12 }}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Current Status Pill */}
            <View style={{
              backgroundColor: '#1F2937',
              borderRadius: 14,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <View>
                <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700' }}>CURRENT VALIDITY</Text>
                <Text style={{ fontSize: 12, color: '#F3F4F6', fontWeight: '800', marginTop: 1 }}>
                  Expires: {digitalPass?.formattedValidUntil || 'N/A'}
                </Text>
              </View>
              <View style={{
                backgroundColor: `${getStatusColor()}20`,
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 8
              }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: getStatusColor() }}>
                  {timeLeft.days} Days Left
                </Text>
              </View>
            </View>

            {/* PLAN OPTIONS */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9CA3AF', marginBottom: 10 }}>
              SELECT DURATION PLAN:
            </Text>

            {/* Plan 1: 1-Day Daily */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('1')}
              style={{
                backgroundColor: selectedPlan === '1' ? 'rgba(99, 102, 241, 0.15)' : '#1F2937',
                borderColor: selectedPlan === '1' ? '#6366F1' : '#374151',
                borderWidth: 2,
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#F9FAFB' }}>
                    🗓️ 1-Day Daily Quick Pass
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>
                  Single-day visitor / event parking • Active 24 Hours
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#10B981' }}>₹50.00</Text>
            </TouchableOpacity>

            {/* Plan 2: 30-Day Monthly (Recommended) */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('30')}
              style={{
                backgroundColor: selectedPlan === '30' ? 'rgba(99, 102, 241, 0.18)' : '#1F2937',
                borderColor: selectedPlan === '30' ? '#6366F1' : '#374151',
                borderWidth: 2,
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#F9FAFB' }}>
                    🗓️ 30-Day Monthly Commuter
                  </Text>
                  <View style={{ backgroundColor: '#4F46E5', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, color: '#fff', fontWeight: '900' }}>POPULAR</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>
                  Standard subsidized plan • Covers all 4 campus zones
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#818CF8' }}>₹499.00</Text>
            </TouchableOpacity>

            {/* Plan 3: 180-Day Semester */}
            <TouchableOpacity
              onPress={() => setSelectedPlan('180')}
              style={{
                backgroundColor: selectedPlan === '180' ? 'rgba(168, 85, 247, 0.18)' : '#1F2937',
                borderColor: selectedPlan === '180' ? '#A855F7' : '#374151',
                borderWidth: 2,
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#F9FAFB' }}>
                    🎓 180-Day Semester All-Access
                  </Text>
                  <View style={{ backgroundColor: '#9333EA', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, color: '#fff', fontWeight: '900' }}>BEST VALUE</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>
                  Full academic semester peace of mind + VIP EV bays
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#C084FC' }}>₹1,499.00</Text>
            </TouchableOpacity>

            {/* Payment Method Selector */}
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', marginBottom: 8 }}>
              PAYMENT METHOD:
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'UPI', label: '⚡ UPI / GPay' },
                { id: 'WALLET', label: '💳 Student Wallet' },
                { id: 'CARD', label: '🏦 Campus Card' }
              ].map(pm => (
                <TouchableOpacity
                  key={pm.id}
                  onPress={() => setPaymentMethod(pm.id)}
                  style={{
                    flex: 1,
                    backgroundColor: paymentMethod === pm.id ? '#374151' : '#1F2937',
                    borderColor: paymentMethod === pm.id ? '#818CF8' : '#374151',
                    borderWidth: 1.5,
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: paymentMethod === pm.id ? '#818CF8' : '#9CA3AF'
                  }}>
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Confirm Renewal Button */}
            <TouchableOpacity
              onPress={handleConfirmRenewal}
              disabled={isRenewing}
              style={{
                backgroundColor: '#4F46E5',
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#4F46E5',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4
              }}
            >
              {isRenewing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                    Processing Gate Extension...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={19} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                    Confirm & Activate Renewal
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: RENEWAL SUCCESS MODAL ================= */}
      <Modal visible={isSuccessModalOpen} animationType="fade" transparent>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.85)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 22
        }}>
          <View style={{
            backgroundColor: '#111827',
            borderRadius: 26,
            padding: 24,
            width: '100%',
            maxWidth: 420,
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: '#10B981',
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8
          }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 14
            }}>
              <Ionicons name="checkmark-done" size={34} color="#10B981" />
            </View>

            <Text style={{ fontSize: 20, fontWeight: '900', color: '#F9FAFB', textAlign: 'center' }}>
              Pass Renewed Successfully! 🎉
            </Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 4, marginBottom: 18 }}>
              Real-time gate barrier permissions extended immediately.
            </Text>

            {latestReceipt && (
              <View style={{
                width: '100%',
                backgroundColor: '#1F2937',
                borderRadius: 16,
                padding: 14,
                marginBottom: 20,
                gap: 8
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Invoice Number</Text>
                  <Text style={{ fontSize: 11, color: '#818CF8', fontWeight: '800' }}>
                    {latestReceipt.invoiceId || latestReceipt.id}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Plan</Text>
                  <Text style={{ fontSize: 11, color: '#F3F4F6', fontWeight: '800' }}>
                    {latestReceipt.planTitle || latestReceipt.plan}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Amount Paid</Text>
                  <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '900' }}>
                    {latestReceipt.amount}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Extended Until</Text>
                  <Text style={{ fontSize: 11, color: '#F3F4F6', fontWeight: '800' }}>
                    {new Date(latestReceipt.validUntil).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity
                onPress={() => handleShareReceipt(latestReceipt)}
                style={{
                  flex: 1,
                  backgroundColor: '#1F2937',
                  borderWidth: 1,
                  borderColor: '#374151',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Feather name="share-2" size={15} color="#94A3B8" />
                <Text style={{ color: '#E2E8F0', fontWeight: '800', fontSize: 12 }}>Share Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsSuccessModalOpen(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#10B981',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: INVOICES & BILLING HISTORY ================= */}
      <Modal visible={isReceiptsModalOpen} animationType="slide" transparent>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.75)',
          justifyContent: 'flex-end'
        }}>
          <View style={{
            backgroundColor: '#111827',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 22,
            borderTopWidth: 1.5,
            borderTopColor: '#374151',
            maxHeight: '85%'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#F9FAFB' }}>
                  Billing & Permit Receipts 📄
                </Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  Official university parking statements
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsReceiptsModalOpen(false)}
                style={{ padding: 6, backgroundColor: '#1F2937', borderRadius: 12 }}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
              {!digitalPass?.history || digitalPass.history.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="receipt" size={44} color="#4B5563" />
                  <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 10 }}>No past renewal receipts recorded</Text>
                </View>
              ) : (
                digitalPass.history.map((item, idx) => (
                  <View
                    key={item.id || idx}
                    style={{
                      backgroundColor: '#1F2937',
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: '#374151'
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#F3F4F6' }}>
                        {item.planTitle || `${item.plan} Pass`}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: '#10B981' }}>
                        {item.amount}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#9CA3AF' }}>
                        Invoice: <Text style={{ color: '#818CF8' }}>{item.invoiceId || item.id}</Text> • {new Date(item.issuedAt).toLocaleDateString()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleShareReceipt(item)}
                        style={{ padding: 4 }}
                      >
                        <Feather name="share-2" size={14} color="#93C5FD" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
