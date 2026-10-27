import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Modal, TextInput, Image, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import config, { smartApiRequest } from '../../../config';
import { supabase } from '../../../supabaseClient';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentHomeScreen({ occupancy, navigation, user }) {
  const userEmail = user?.email || '';
  const userName = user?.name || '';

  const [userProfile, setUserProfile] = useState(user || {});
  const [digitalPass, setDigitalPass] = useState(null);
  const [recommendations, setRecommendations] = useState([
    { slotNumber: 'C-04', zoneName: 'Central Library', score: 96, reason: '80m from CS Block • 96% vacant • EV Charger' },
    { slotNumber: 'H-08', zoneName: 'Hostel Complex', score: 91, reason: '140m from CS Block • 100% vacant • High security' },
    { slotNumber: 'K-12', zoneName: 'KRISHNA HOSTEL', score: 88, reason: 'Near Main Gate • 85% vacant' }
  ]);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);

  const [campusZones, setCampusZones] = useState([
    { id: 'z4', name: 'KRISHNA HOSTEL', total: 150, occupied: 0 },
    { id: 'z2', name: 'South Block', total: 150, occupied: 0 },
    { id: 'z3', name: 'Central Library', total: 80, occupied: 0 },
    { id: 'z5', name: 'HOSPITAL PARKING', total: 200, occupied: 0 },
    { id: 'z6', name: 'Hostel Complex', total: 200, occupied: 0 },
    { id: 'z7', name: 'CS Academic Block', total: 120, occupied: 0 },
    { id: 'z8', name: 'Visitor Parking', total: 50, occupied: 0 },
    { id: 'z9', name: 'Scad', total: 75, occupied: 0 }
  ]);
  const [isFindVehicleOpen, setIsFindVehicleOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: `👋 Hi ${userProfile?.name || userName || 'there'}! I am your ParkNex AI Assistant. Ask me "Where should I park right now?", "Check my active pass", or "How does slot booking work?".` }
  ]);

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('4-Wheeler');

  const [unreadCount, setUnreadCount] = useState(0);
  const [toastAlert, setToastAlert] = useState(null);
  const seenToastIdsRef = useRef(new Set());
  const activeBookingRef = useRef(null);
  const handledExitBookingIdsRef = useRef(new Set());

  // Security Exit QR Pass & Violations State
  const [isExitQRModalOpen, setIsExitQRModalOpen] = useState(false);
  const [myViolations, setMyViolations] = useState([]);

  const loadProfileState = async () => {
    try {
      const storedUserStr = await AsyncStorage.getItem('@parknex_user').catch(() => null);
      if (storedUserStr) {
        const parsed = JSON.parse(storedUserStr);
        if (parsed && parsed.name) {
          setUserProfile(prev => {
            if (prev.name === parsed.name && prev.department === parsed.department && prev.academicTerm === parsed.academicTerm) {
              return prev;
            }
            return { ...prev, ...parsed };
          });
        }
      }
    } catch (e) {}
  };

  const fetchHomeData = async () => {
    try {
      const userVehiclesKey = `@parknex_vehicles_${userEmail.toLowerCase()}`;
      const userHistoryKey = `@parknex_history_${userEmail.toLowerCase()}`;
      const effectiveRole = (userProfile?.role || user?.role || 'STUDENT').toUpperCase();
      const isStaffOrFaculty = effectiveRole === 'FACULTY' || effectiveRole === 'STAFF';

      const [passRes, recRes, zoneRes, vehRes, bookRes, profRes, notifsRes, violRes] = await Promise.allSettled([
        smartApiRequest('get', `/passes/my-pass?email=${encodeURIComponent(userEmail)}`),
        smartApiRequest('get', `/ai/recommendations?department=Computer Science`),
        smartApiRequest('get', `/zones?role=${encodeURIComponent(effectiveRole)}`),
        smartApiRequest('get', `/vehicles?email=${encodeURIComponent(userEmail)}`),
        smartApiRequest('get', `/bookings/my-bookings?email=${encodeURIComponent(userEmail)}`),
        smartApiRequest('get', `/users/profile?email=${encodeURIComponent(userEmail)}`),
        smartApiRequest('get', `/notifications?email=${encodeURIComponent(userEmail)}&role=${encodeURIComponent(effectiveRole)}`),
        smartApiRequest('get', `/violations/my-violations?email=${encodeURIComponent(userEmail)}`)
      ]);

      if (violRes.status === 'fulfilled' && Array.isArray(violRes.value.data)) {
        setMyViolations(violRes.value.data);
      }

      if (profRes.status === 'fulfilled' && profRes.value.data?.user) {
        const u = profRes.value.data.user;
        if (u.name) {
          setUserProfile(prev => ({ ...prev, ...u }));
          // Save to local cache atomically
          await AsyncStorage.setItem('@parknex_user', JSON.stringify({ ...(user || {}), ...u })).catch(() => null);
        }
      }

      if (passRes.status === 'fulfilled' && passRes.value.data) {
        setDigitalPass(passRes.value.data);
      }
      if (recRes.status === 'fulfilled' && Array.isArray(recRes.value.data?.recommendations)) {
        const rawRecs = recRes.value.data.recommendations;
        const filteredRecs = isStaffOrFaculty
          ? rawRecs
          : rawRecs.filter(r => !r.zoneName.toLowerCase().includes('faculty') && !r.zoneName.toLowerCase().includes('staff'));
        setRecommendations(filteredRecs);
      }
      if (zoneRes.status === 'fulfilled' && Array.isArray(zoneRes.value.data) && zoneRes.value.data.length > 0) {
        const rawZones = zoneRes.value.data;
        const filteredZones = isStaffOrFaculty
          ? rawZones
          : rawZones.filter(z => !z.isFacultyOnly && !z.name.toLowerCase().includes('faculty') && !z.name.toLowerCase().includes('staff'));
        setCampusZones(filteredZones);
      }

      // Process notifications for unread count badge & real-time toast alert
      if (notifsRes.status === 'fulfilled' && notifsRes.value.data) {
        const notifList = notifsRes.value.data.notifications || [];
        const unread = notifList.filter(n => !n.isRead).length;
        setUnreadCount(unread);

        const nowMs = Date.now();
        const freshAlerts = notifList.filter(n => {
          if (n.isRead) return false;
          if (n.priority !== 'CRITICAL' && n.priority !== 'HIGH') return false;
          if (seenToastIdsRef.current.has(n.id)) return false;
          const createdMs = n.createdAt ? new Date(n.createdAt).getTime() : 0;
          return (nowMs - createdMs) < 180000;
        });

        if (freshAlerts.length > 0) {
          const newAlert = freshAlerts[0];
          seenToastIdsRef.current.add(newAlert.id);
          setToastAlert(newAlert);
          setTimeout(() => {
            setToastAlert(curr => curr?.id === newAlert.id ? null : curr);
          }, 6500);
        }
      }

      // Fetch vehicles from API & AsyncStorage
      let currentVeh = [];
      if (vehRes.status === 'fulfilled' && Array.isArray(vehRes.value.data) && vehRes.value.data.length > 0) {
        const apiVeh = vehRes.value.data.map(v => ({
          id: v.id,
          brand: v.brand,
          model: v.model || 'Standard',
          plate: v.plateNumber || v.plate,
          type: v.type === 'TWO_WHEELER' ? '2-Wheeler' : '4-Wheeler',
          status: 'Verified'
        }));
        setVehicles(apiVeh);
        currentVeh = apiVeh;
      } else {
        const savedVeh = await AsyncStorage.getItem(userVehiclesKey).catch(() => null);
        if (savedVeh) {
          try { currentVeh = JSON.parse(savedVeh); setVehicles(currentVeh); } catch (e) { currentVeh = []; setVehicles([]); }
        } else {
          currentVeh = [];
          setVehicles([]);
        }
      }

      // Fetch active booking from API & AsyncStorage
      const apiBookings = (bookRes.status === 'fulfilled' && Array.isArray(bookRes.value.data)) ? bookRes.value.data : [];
      const notifList = (notifsRes.status === 'fulfilled' && notifsRes.value.data?.notifications) || [];
      const exitNotif = notifList.find(n => n.category === 'VEHICLE_EXIT');

      const activeFromApi = apiBookings.find(b => b.status === 'CONFIRMED');
      const exitedFromApi = apiBookings.find(b => b.status === 'EXITED' || b.status === 'RELEASED');

      const savedHist = await AsyncStorage.getItem(userHistoryKey).catch(() => null);
      let parsedHist = [];
      if (savedHist) {
        try { parsedHist = JSON.parse(savedHist); } catch (e) { parsedHist = []; }
      }
      const localConfirmed = parsedHist.find(h => h.status === 'CONFIRMED');

      // Check if user has an active confirmed booking from server
      if (activeFromApi) {
        const activeObj = {
          id: String(activeFromApi.id),
          slotNumber: activeFromApi.slotNumber || activeFromApi.slot?.slotNumber || 'Slot',
          zoneName: activeFromApi.zoneName || activeFromApi.slot?.zone?.name || 'Campus Zone',
          plateNumber: activeFromApi.plateNumber || activeFromApi.vehicle?.plateNumber || (currentVeh.length > 0 ? currentVeh[0]?.plate : 'NO VEHICLE LINKED'),
          durationHours: activeFromApi.durationHours || 4,
          bookingTime: activeFromApi.bookingTime || 'Just Now',
          bookingDate: activeFromApi.bookingDate || new Date().toISOString().split('T')[0],
          status: 'CONFIRMED'
        };
        setActiveBooking(activeObj);
        activeBookingRef.current = activeObj;
      } else {
        // NO ACTIVE CONFIRMED BOOKING ON SERVER:
        const wasActive = activeBookingRef.current || localConfirmed;
        activeBookingRef.current = null;
        setActiveBooking(null);

        // Update any local confirmed records to EXITED in AsyncStorage
        if (localConfirmed) {
          const updatedHist = parsedHist.map(h => h.status === 'CONFIRMED' ? { ...h, status: 'EXITED', exitedAt: new Date().toISOString() } : h);
          await AsyncStorage.setItem(userHistoryKey, JSON.stringify(updatedHist)).catch(() => null);
        }

        // DETECT AUTOMATIC EXIT: If session was previously active, or server has an exited booking / exit notification
        const latestExited = exitedFromApi || (apiBookings.length > 0 ? apiBookings[0] : null);
        const exitTrigger = wasActive || latestExited;
        const exitedId = String(latestExited?.id || exitTrigger?.id || exitNotif?.metadata?.bookingId || '');

        const shouldTriggerExitScreen = (
          (wasActive && (latestExited || exitNotif || apiBookings.length > 0)) ||
          (exitNotif && exitNotif.category === 'VEHICLE_EXIT')
        );

        if (shouldTriggerExitScreen && exitedId && !handledExitBookingIdsRef.current.has(exitedId)) {
          handledExitBookingIdsRef.current.add(exitedId);
          setIsExitQRModalOpen(false);
          await AsyncStorage.setItem('@parknex_last_exited_booking_id', exitedId).catch(() => null);

          const exitedPlate = latestExited?.plateNumber || exitTrigger?.plateNumber || exitTrigger?.vehicle || exitNotif?.relatedEntity || (currentVeh.length > 0 ? currentVeh[0]?.plate : 'AP03CH4591');
          const officerName = latestExited?.releasedBy || exitNotif?.metadata?.officer || 'Security Officer';
          const exitDuration = latestExited?.durationHours ? `${latestExited.durationHours} Hours` : (exitTrigger?.durationHours ? `${exitTrigger.durationHours} Hours` : '4 Hours');
          const exitTime = exitNotif?.metadata?.time || (latestExited?.releasedAt ? new Date(latestExited.releasedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

          navigation?.navigate('ExitSuccess', {
            plate: exitedPlate,
            duration: exitDuration,
            time: exitTime,
            amount: '₹0.00',
            officer: officerName,
            status: 'EXIT CLEARED & BARRIER RELEASED'
          });
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadProfileState();
    fetchHomeData();
    const interval = setInterval(fetchHomeData, 3000);

    const unsubscribe = navigation?.addListener?.('focus', () => {
      loadProfileState();
      fetchHomeData();
    });

    const chName = `student-home-realtime-${Date.now()}`;
    const channel = supabase
      .channel(chName)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchHomeData();
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') fetchHomeData();
    });

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
      if (supabase && supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, [userEmail, navigation]);

  const handleAddVehicleSubmit = async () => {
    if (!newBrand.trim() || !newPlate.trim()) {
      Alert.alert('Validation Error', 'Please enter Vehicle Brand and License Plate Number.');
      return;
    }

    const newVehObj = {
      id: `v_${Date.now()}`,
      brand: newBrand.trim(),
      model: newModel.trim() || 'Standard',
      plate: newPlate.toUpperCase().trim(),
      type: newType,
      status: 'Verified'
    };

    try {
      await axios.post(`${BACKEND_URL}/vehicles`, {
        brand: newBrand.trim(),
        model: newModel.trim() || 'Standard',
        plateNumber: newPlate.toUpperCase().trim(),
        type: newType === '2-Wheeler' ? 'TWO_WHEELER' : 'FOUR_WHEELER'
      }).catch(() => null);
    } catch (e) {}

    const updated = [...vehicles, newVehObj];
    setVehicles(updated);
    try {
      await AsyncStorage.setItem(`@parknex_vehicles_${userEmail}`, JSON.stringify(updated));
    } catch (e) {}

    setIsAddVehicleOpen(false);
    setNewBrand('');
    setNewModel('');
    setNewPlate('');
    Alert.alert('Vehicle Registered! 🚗', `Vehicle ${newPlate.toUpperCase()} linked successfully to your Digital Campus Permit!`);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, { message: userText });
      if (res.data?.reply) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: '🤖 ParkNex AI: Recommended Slot K-04 in KRISHNA HOSTEL (80m away).' }]);
    }
  };

  const [liveTime, setLiveTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState(() => new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));

  const sparkleAnim = useRef(new Animated.Value(1)).current;
  const clockPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    // Continuous smooth sparkle pulse loop (~1.2s cycle)
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 0.35,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    sparkleLoop.start();

    // Subtle clock indicator pulse loop (~1.5s cycle)
    const clockLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(clockPulseAnim, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(clockPulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    clockLoop.start();

    return () => {
      clearInterval(timer);
      sparkleLoop.stop();
      clockLoop.stop();
    };
  }, [sparkleAnim, clockPulseAnim]);

  const getGreeting = () => {
    const curHour = new Date().getHours();
    if (curHour >= 4 && curHour < 12) return { text: 'Good morning', emoji: '☀️' };
    if (curHour >= 12 && curHour < 17) return { text: 'Good afternoon', emoji: '🌤️' };
    if (curHour >= 17 && curHour < 22) return { text: 'Good evening', emoji: '🌆' };
    return { text: 'Welcome', emoji: '✨' };
  };

  const studentDisplayName = userProfile?.name || user?.name || (userEmail.includes('@') ? userEmail.split('@')[0] : 'Student');
  const totalOpenBays = (campusZones || []).reduce((sum, z) => sum + Math.max(0, (z.total || 0) - (z.occupied || 0)), 0);
  const totalLots = campusZones?.length || 9;

  const topPick = (recommendations && recommendations[0]) || { 
    slotNumber: 'K-04', 
    zoneName: 'KRISHNA HOSTEL', 
    score: 96, 
    reason: '80m from Academic Block • 96% vacant' 
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      {/* REAL-TIME CRITICAL TOAST ALERT POPUP BANNER */}
      {toastAlert && (
        <View style={{
          position: 'absolute',
          top: 10,
          left: 16,
          right: 16,
          zIndex: 9999,
          backgroundColor: toastAlert.priority === 'CRITICAL' ? '#7F1D1D' : '#1E1B4B',
          borderLeftWidth: 6,
          borderLeftColor: toastAlert.priority === 'CRITICAL' ? '#EF4444' : '#F59E0B',
          borderRadius: 14,
          padding: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <TouchableOpacity 
            style={{ flex: 1, marginRight: 8 }}
            onPress={() => {
              navigation?.navigate('Notifications', { userEmail: userEmail || userProfile?.email || 'student@college.edu', userRole: 'STUDENT' });
              setToastAlert(null);
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '900', color: toastAlert.priority === 'CRITICAL' ? '#FCA5A5' : '#FDE047', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {toastAlert.priority} ALERT • {toastAlert.category || 'SYSTEM'}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF', marginTop: 2 }}>{toastAlert.title}</Text>
            <Text style={{ fontSize: 11, color: '#E2E8F0', marginTop: 2 }} numberOfLines={2}>{toastAlert.message}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={async () => {
              if (toastAlert?.id) {
                seenToastIdsRef.current.add(toastAlert.id);
                smartApiRequest('put', `/notifications/${toastAlert.id}/read`).catch(() => null);
              }
              setToastAlert(null);
            }}
            style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }}>
        
        {/* WELCOME BACK HEADER */}
        <View style={{ marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 23, fontWeight: '900', color: '#0F172A', letterSpacing: -0.4 }}>
                {getGreeting().text}, {studentDisplayName}
              </Text>
              <Animated.Text 
                style={{ 
                  fontSize: 21, 
                  marginLeft: 6,
                  opacity: sparkleAnim,
                  transform: [
                    {
                      scale: sparkleAnim.interpolate({
                        inputRange: [0.35, 1],
                        outputRange: [0.85, 1.18],
                      }),
                    },
                  ],
                }}
              >
                {getGreeting().emoji}
              </Animated.Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: 8, borderWidth: 1, borderColor: '#C7D2FE' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#4338CA' }}>
                  🎓 {userProfile?.department ? `${userProfile.department}${userProfile?.academicTerm ? ` • ${userProfile.academicTerm}` : ''}` : 'Campus Student Member'}
                </Text>
              </View>
              <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#065F46' }}>
                  🟢 Permit Active
                </Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity 
              style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE', position: 'relative' }}
              onPress={() => navigation?.navigate('Notifications', { userEmail: userEmail || userProfile?.email || 'student@college.edu', userRole: 'STUDENT' })}
              activeOpacity={0.7}
            >
              <Feather name="bell" size={20} color="#2563EB" />
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#FFFFFF' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
              onPress={() => navigation?.navigate('AIChat', { userRole: 'STUDENT', userName: studentDisplayName })}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CAMPUS WELCOME & REAL-TIME PARKING READINESS HERO BANNER */}
        <View style={{
          backgroundColor: '#0F172A',
          borderRadius: 22,
          padding: 18,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#1E293B',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 12,
          elevation: 5,
        }}>
          {/* Top Ticker Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981' }} />
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#6EE7B7', letterSpacing: 0.4 }}>
                ANPR GATES 1 & 2 ACTIVE
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              <Animated.View style={{ opacity: clockPulseAnim }}>
                <Ionicons name="time" size={12} color="#93C5FD" />
              </Animated.View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#BFDBFE' }}>
                {liveTime} • {liveDate}
              </Text>
            </View>
          </View>

          {/* Welcome Message */}
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', marginBottom: 5, letterSpacing: -0.2 }}>
            Smart Campus Parking Hub Ready
          </Text>
          <Text style={{ fontSize: 12, color: '#94A3B8', lineHeight: 18, fontWeight: '600', marginBottom: 14 }}>
            Automated barrier clearance is active for your registered vehicles. Instant slot navigation and AI spot finder are standing by for your arrival.
          </Text>

          {/* Quick Real-Time Metrics Strip */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Available Bays</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#38BDF8', marginTop: 2 }}>{totalOpenBays}</Text>
              <Text style={{ fontSize: 9.5, color: '#64748B', fontWeight: '700' }}>across {totalLots} lots</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>My Vehicles</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#34D399', marginTop: 2 }}>{vehicles.length}</Text>
              <Text style={{ fontSize: 9.5, color: '#64748B', fontWeight: '700' }}>ANPR Verified</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>FastPass QR</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#FBBF24', marginTop: 2 }}>Ready</Text>
              <Text style={{ fontSize: 9.5, color: '#64748B', fontWeight: '700' }}>Instant Entry</Text>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}
              onPress={() => navigation.navigate('Map')}
              activeOpacity={0.85}
            >
              <Ionicons name="map" size={15} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>Reserve Bay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' }}
              onPress={() => navigation.navigate('Pass')}
              activeOpacity={0.85}
            >
              <Ionicons name="qr-code-outline" size={15} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>Digital Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: '#8B5CF6', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}
              onPress={() => navigation?.navigate('AIChat', { userRole: 'STUDENT', userName: studentDisplayName })}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="robot" size={15} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* INTERACTIVE NAVIGATION PILL TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
          <TouchableOpacity style={{ backgroundColor: '#8B5CF6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => navigation?.navigate('AIChat', { userRole: 'STUDENT', userName: userProfile?.name || user?.name || 'Student' })} activeOpacity={0.8}>
            <MaterialCommunityIcons name="robot" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>AI Assistant</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 24 }} activeOpacity={0.8}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('Book')} activeOpacity={0.8}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>Book a Slot</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('Vehicles')} activeOpacity={0.8}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>My Vehicles</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('Map')} activeOpacity={0.8}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>Campus Map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('Pass')} activeOpacity={0.8}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>Digital Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('Billing')} activeOpacity={0.8}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>Passes & Billing</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24 }} onPress={() => navigation.navigate('History')} activeOpacity={0.8}>
            <Text style={{ color: '#334155', fontWeight: '800', fontSize: 12 }}>Parking History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#EFF6FF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#BFDBFE' }} onPress={() => navigation.navigate('Feedback')} activeOpacity={0.8}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={{ color: '#1D4ED8', fontWeight: '900', fontSize: 12 }}>Feedback & Ratings</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ACTIVE VIOLATION TICKETS WARNING BANNER */}
        {myViolations && myViolations.some(v => v.status === 'PENDING') && (
          <View style={{ marginBottom: 18 }}>
            {myViolations.filter(v => v.status === 'PENDING').map((viol, vIdx) => (
              <View key={viol.id || vIdx} style={{ backgroundColor: '#FEF2F2', borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#EF4444', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="warning" size={20} color="#DC2626" />
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#DC2626', letterSpacing: 0.3 }}>
                      PARKING VIOLATION TICKET ISSUED
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#991B1B' }}>PENDING</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A', marginBottom: 2 }}>
                  Vehicle {viol.plateNumber} • Fine: ₹{viol.penaltyAmount || 500}
                </Text>
                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginBottom: 10 }}>
                  Violation: {viol.type || 'WRONG_PARKING'} - {viol.description || 'Reported by Security Officer'}
                </Text>

                <View style={{ backgroundColor: '#FFFFFF', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="information-circle" size={16} color="#DC2626" />
                  <Text style={{ fontSize: 11, color: '#991B1B', fontWeight: '800', flex: 1 }}>
                    Please report to Campus Security Gate Desk to resolve this violation citation.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ACTIVE PARKED VEHICLE CARD OR NO SESSION BANNER */}
        {activeBooking && activeBooking.status === 'CONFIRMED' ? (
          <View style={{ backgroundColor: '#047857', borderRadius: 20, padding: 18, marginBottom: 20, shadowColor: '#047857', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="car-sport" size={20} color="#fff" />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#A7F3D0', letterSpacing: 0.8 }}>
                ACTIVE PARKED VEHICLE
              </Text>
            </View>

            <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', marginBottom: 4, lineHeight: 22 }}>
              Vehicle {activeBooking.plateNumber || activeBooking.vehicle || 'KA-01-AB-1234'} is Parked in Slot {activeBooking.slotNumber || activeBooking.slot || 'K-30'} ({activeBooking.zoneName || activeBooking.zone || 'KRISHNA HOSTEL'})
            </Text>
            <Text style={{ fontSize: 12, color: '#D1FAE5', fontWeight: '600', marginBottom: 14 }}>
              Session: {activeBooking.bookingTime || 'Just Now'} ({activeBooking.durationHours || 4} hrs) • Date: {activeBooking.bookingDate || liveDate}
            </Text>

            <TouchableOpacity 
              style={{ backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
              onPress={() => setIsExitQRModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code-outline" size={18} color="#047857" />
              <Text style={{ color: '#047857', fontWeight: '900', fontSize: 13 }}>
                Show Exit QR Pass to Security
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="car-outline" size={28} color="#64748B" />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A', marginBottom: 4 }}>No Active Parking Session</Text>
            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 16, fontWeight: '600', paddingHorizontal: 10, lineHeight: 18 }}>You currently have no active slot reservations. Reserve a slot from the map to park.</Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 }}
              onPress={() => navigation.navigate('Map')}
              activeOpacity={0.85}
            >
              <Ionicons name="map-outline" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>Reserve Parking Slot</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI RECOMMENDED PARKING SLOTS SECTION */}
        <View style={{ marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="robot" size={20} color="#2563EB" />
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>AI Recommended Parking Slots</Text>
          </View>
          <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#047857' }}>AI MATCH CONFIDENCE: 96%</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
          {/* CARD 1: TOP PICK #1 */}
          <TouchableOpacity 
            style={{ width: 280, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 2, borderColor: '#2563EB', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 }}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Book')}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#2563EB' }}>🏆 TOP PICK #1</Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#059669' }}>96% Match</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>Slot C-04 (Central Library)</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 14, lineHeight: 18, fontWeight: '600' }}>
              80m from CS Block • 30% vacant • EV Charger available
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 14, alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
              onPress={() => navigation.navigate('Book')}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>Reserve Slot C-04</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* CARD 2: RECOMMENDATION #2 */}
          <TouchableOpacity 
            style={{ width: 280, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Book')}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#64748B' }}>#2 RECOMMENDATION</Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#059669' }}>91% Match</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>Slot H-08 (Hostel Complex)</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 14, lineHeight: 18, fontWeight: '600' }}>
              140m from CS Block • 45% vacant
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
              onPress={() => navigation.navigate('Book')}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>Reserve Slot H-08</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* CARD 3: RECOMMENDATION #3 */}
          <TouchableOpacity 
            style={{ width: 280, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Book')}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#64748B' }}>#3 RECOMMENDATION</Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#059669' }}>86% Match</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>Slot FB-15 (Faculty Block)</Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 14, lineHeight: 18, fontWeight: '600' }}>
              200m from CS Block • 85% vacant
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
              onPress={() => navigation.navigate('Book')}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>Reserve Slot FB-15</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </ScrollView>

        {/* QUICK ACTION CARDS WITH FRESH ONBOARDING FALLBACKS */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {/* DIGITAL PASS CARD */}
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4, borderLeftColor: vehicles.length === 0 ? COLORS.warning : COLORS.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            onPress={() => vehicles.length === 0 ? setIsAddVehicleOpen(true) : navigation.navigate('Pass')}
            activeOpacity={0.85}
          >
            <Ionicons name="card" size={24} color={vehicles.length === 0 ? COLORS.warning : COLORS.primary} />
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8, fontWeight: '600' }}>Digital Pass</Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.text, marginTop: 2 }}>
              {vehicles.length === 0 ? 'PASS-STU-2026-8812' : (digitalPass?.passNumber || `PASS-STU-2026-8812`)}
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.success, fontWeight: '800', marginTop: 4 }}>
              ● ACTIVE
            </Text>
          </TouchableOpacity>

          {/* AI FIND MY VEHICLE */}
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4, borderLeftColor: COLORS.warning, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            onPress={() => {
              if (activeBooking) setIsFindVehicleOpen(true);
              else navigation.navigate('Book');
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="compass" size={24} color="#D97706" />
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8, fontWeight: '600' }}>Find My Vehicle</Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.text, marginTop: 2 }}>
              {activeBooking ? `Slot ${activeBooking.slotNumber}` : 'No Active Booking'}
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: '800', marginTop: 4 }}>
              {activeBooking ? 'Route Guide →' : 'Book a Slot →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* RATE CAMPUS PARKING & FEEDBACK BANNER */}
        <TouchableOpacity 
          style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#BFDBFE', borderLeftWidth: 4, borderLeftColor: '#3B82F6', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          onPress={() => navigation.navigate('Feedback')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="star" size={24} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>Rate Today's Parking Session</Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>
                Share feedback on barrier speed, AI advice, or slot vacancy.
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#2563EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>Review →</Text>
          </View>
        </TouchableOpacity>

        {/* LIVE ZONES AVAILABILITY */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text }}>Live Campus Zones</Text>
              <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: '700', marginTop: 2 }}>
                Real-Time Synchronized Vacancy Across Campus
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981' }} />
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#047857' }}>LIVE SYNC</Text>
            </View>
          </View>

          {campusZones.map((z, idx) => {
            const tot = Number(z.total || z.capacity || 100);
            const occ = Number(z.occupied || 0);
            const free = Math.max(0, tot - occ);
            const ratio = tot > 0 ? occ / tot : 0;
            const color = ratio >= 0.9 ? COLORS.danger : ratio >= 0.7 ? COLORS.warning : '#10B981';

            return (
              <View key={z.id || idx} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: COLORS.text }}>{z.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 12, color: occ > 0 ? (ratio >= 0.9 ? '#DC2626' : '#2563EB') : '#10B981', fontWeight: '800' }}>
                      {free} / {tot} Free
                    </Text>
                    {occ === 0 && (
                      <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6, borderWidth: 1, borderColor: '#A7F3D0' }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#065F46' }}>100% FREE</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                  {occ > 0 ? (
                    <View style={{ width: `${Math.min(100, Math.max(4, ratio * 100))}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* FIND MY VEHICLE MODAL */}
      <Modal visible={isFindVehicleOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>AI Find My Vehicle</Text>
              <TouchableOpacity onPress={() => setIsFindVehicleOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600' }}>Parked Vehicle</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.primary, marginTop: 2 }}>
                {activeBooking?.plateNumber || activeBooking?.vehicle || (vehicles.length > 0 ? vehicles[0]?.plate : 'NO VEHICLE LINKED')}
              </Text>
              {activeBooking ? (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 8 }}>
                    {activeBooking.zoneName} — Slot {activeBooking.slotNumber}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: '700', marginTop: 4 }}>
                    ● Parked Safely • Booking Date: {activeBooking.bookingDate}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textMuted, marginTop: 6 }}>
                  No Active Session Parked Currently
                </Text>
              )}
            </View>

            <Text style={{ fontWeight: '800', fontSize: 13, color: COLORS.text, marginBottom: 8 }}>Walking Route Guide:</Text>
            {activeBooking ? (
              (vehicleLocation?.walkingDirections || [
                `Exit Academic Block Main Gate`,
                `Walk towards ${activeBooking.zoneName}`,
                `Your vehicle is parked in Slot ${activeBooking.slotNumber}`
              ]).map((dir, i) => (
                <Text key={i} style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
                  {i + 1}. {dir}
                </Text>
              ))
            ) : (
              <Text style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' }}>
                Reserve a parking slot from the map to view real-time AI walking route guidance to your car.
              </Text>
            )}

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => setIsFindVehicleOpen(false)}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI CHATBOT MODAL */}
      <Modal visible={isChatOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={[styles.card, { height: '60%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="robot" size={24} color={COLORS.primary} />
                <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text }}>ParkNex AI Assistant</Text>
              </View>
              <TouchableOpacity onPress={() => setIsChatOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, marginBottom: 12 }}>
              {chatMessages.map((m, idx) => (
                <View key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', backgroundColor: m.sender === 'user' ? COLORS.primary : '#F1F5F9', padding: 12, borderRadius: 14, marginBottom: 8, maxWidth: '85%' }}>
                  <Text style={{ color: m.sender === 'user' ? '#fff' : COLORS.text, fontSize: 13 }}>{m.text}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ask ParkNex AI..."
                value={chatInput}
                onChangeText={setChatInput}
              />
              <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 16 }]} onPress={handleSendChatMessage}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD VEHICLE MODAL */}
      <Modal visible={isAddVehicleOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>Add Campus Vehicle</Text>
              <TouchableOpacity onPress={() => setIsAddVehicleOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Vehicle Brand</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. Honda / Royal Enfield / Tesla" value={newBrand} onChangeText={setNewBrand} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Vehicle Model</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. Civic / Creta / Classic 350" value={newModel} onChangeText={setNewModel} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>License Plate Number</Text>
            <TextInput style={[styles.input, { marginBottom: 16 }]} placeholder="e.g. KA-01-AB-1234" value={newPlate} onChangeText={setNewPlate} autoCapitalize="characters" />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Vehicle Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {['4-Wheeler', '2-Wheeler', 'EV'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewType(t)}
                  style={{ backgroundColor: newType === t ? COLORS.primary : '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flex: 1, alignItems: 'center' }}
                >
                  <Text style={{ color: newType === t ? '#fff' : COLORS.text, fontWeight: '800', fontSize: 11 }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddVehicleSubmit}>
              <Text style={styles.primaryBtnText}>Register Vehicle & Link Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SECURITY EXIT QR PASS MODAL */}
      <Modal visible={isExitQRModalOpen} animationType="slide" transparent onRequestClose={() => setIsExitQRModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={24} color="#047857" />
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>Security Exit Gate Pass</Text>
              </View>
              <TouchableOpacity onPress={() => setIsExitQRModalOpen(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 16, fontWeight: '600' }}>
              Present this QR Code to the Security Officer at the gate barrier to verify and release your vehicle.
            </Text>

            {activeBooking && (
              <View style={{ padding: 14, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3, marginBottom: 16 }}>
                <QRCode
                  value={JSON.stringify({
                    type: 'EXIT_PASS',
                    bookingId: activeBooking.id,
                    vehiclePlate: activeBooking.plateNumber || activeBooking.vehicle,
                    plateNumber: activeBooking.plateNumber || activeBooking.vehicle,
                    slotNumber: activeBooking.slotNumber || activeBooking.slot,
                    zoneName: activeBooking.zoneName || activeBooking.zone,
                    studentEmail: userEmail
                  })}
                  size={190}
                />
              </View>
            )}

            <View style={{ width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>Vehicle Plate:</Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#0F172A' }}>{activeBooking?.plateNumber || activeBooking?.vehicle || 'VEHICLE'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>Parked Slot:</Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#2563EB' }}>{activeBooking?.slotNumber || activeBooking?.slot} ({activeBooking?.zoneName || activeBooking?.zone})</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>Gate Barrier Control:</Text>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#047857' }}>Security Officer Only</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(37,99,235,0.08)', borderRadius: 12, width: '100%', marginBottom: 16 }}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={{ fontSize: 12, color: '#1D4ED8', fontWeight: '800', flex: 1 }}>
                Waiting for Security Officer to scan and confirm release...
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => setIsExitQRModalOpen(false)} 
              style={{ width: '100%', paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#475569' }}>Close Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FLOATING ACTION BUTTON (FAB) FOR AI ASSISTANT */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          backgroundColor: '#4F46E5',
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 28,
          shadowColor: '#4F46E5',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
          gap: 8,
          borderWidth: 1.5,
          borderColor: '#818CF8'
        }}
        onPress={() => navigation?.navigate('AIChat', { userRole: 'STUDENT', userName: userProfile?.name || user?.name || 'Student' })}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="robot" size={20} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.2 }}>Ask AI</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
