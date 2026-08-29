import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, TextInput } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config, { smartApiRequest } from '../../../config';
import { supabase } from '../../../supabaseClient';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

const getTodayDateStr = () => new Date().toISOString().split('T')[0];
const getCurrentTimeStr = () => {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
};

export default function StudentBookScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedZone, setSelectedZone] = useState('KRISHNA HOSTEL');
  const [selectedSlot, setSelectedSlot] = useState('K-04');
  const [bookingDate, setBookingDate] = useState(getTodayDateStr());
  const [bookingTime, setBookingTime] = useState(getCurrentTimeStr());
  const [durationHours, setDurationHours] = useState(4);
  const [historyList, setHistoryList] = useState([]);

  // Popup overlay states
  const [isVehiclePickerOpen, setIsVehiclePickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [zonesList, setZonesList] = useState([
    { id: 'z1', name: 'Faculty Parking', capacity: 100, isFaculty: true },
    { id: 'z2', name: 'South Block', capacity: 150, isFaculty: false },
    { id: 'z3', name: 'Central Library', capacity: 80, isFaculty: false },
    { id: 'z4', name: 'KRISHNA HOSTEL', capacity: 150, isFaculty: false },
    { id: 'z5', name: 'HOSPITAL PARKING', capacity: 200, isFaculty: false },
    { id: 'z6', name: 'Hostel Complex', capacity: 200, isFaculty: false },
    { id: 'z7', name: 'CS Academic Block', capacity: 120, isFaculty: false },
    { id: 'z8', name: 'Visitor Parking', capacity: 50, isFaculty: false },
    { id: 'z9', name: 'Scad', capacity: 75, isFaculty: false }
  ]);

  // Render 150 slot matrix for Krishna Hostel
  const krishnaSlots = Array.from({ length: 150 }, (_, i) => {
    const num = (i + 1).toString().padStart(2, '0');
    return `K-${num}`;
  });

  useEffect(() => {
    const fetchZonesApi = async () => {
      try {
        const res = await smartApiRequest('get', '/zones');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setZonesList(res.data.map(z => ({
            id: z.id,
            name: z.name,
            capacity: z.capacity || z.total || 100,
            isFaculty: z.isFaculty || z.name?.toLowerCase().includes('faculty')
          })));
        }
      } catch (e) {}
    };
    fetchZonesApi();
    const interval = setInterval(fetchZonesApi, 5000);

    const channel = supabase
      .channel('student-book-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchZonesApi();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchZonesApi();
      });

    return () => {
      clearInterval(interval);
      if (supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const loadBookingContext = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@parknex_user');
        const userObj = storedUser ? JSON.parse(storedUser) : { email: 'student@college.edu', name: 'Student' };
        setUser(userObj);

        const userEmail = userObj.email || 'student@college.edu';
        const isDemoUser = userEmail === 'student@college.edu' || userObj.name === 'Alex Carter';

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
            setSelectedVehicle(mapped[0]);
          } else {
            const savedVeh = await AsyncStorage.getItem(`@parknex_vehicles_${userEmail.toLowerCase()}`);
            if (savedVeh) {
              const parsedVeh = JSON.parse(savedVeh);
              setVehicles(parsedVeh);
              if (parsedVeh.length > 0) setSelectedVehicle(parsedVeh[0]);
            } else if (isDemoUser) {
              const demoVeh = [
                { brand: 'Honda', model: 'Civic', plate: 'KA-01-AB-1234' },
                { brand: 'Royal Enfield', model: 'Classic 350', plate: 'KA-05-XY-9876' }
              ];
              setVehicles(demoVeh);
              setSelectedVehicle(demoVeh[0]);
            } else {
              setVehicles([]);
              setSelectedVehicle(null);
            }
          }
        } catch (e) {
          setVehicles([]);
        }

        const savedHist = await AsyncStorage.getItem(`@parknex_history_${userEmail.toLowerCase()}`);
        if (savedHist) {
          try { setHistoryList(JSON.parse(savedHist)); } catch (e) {}
        } else if (isDemoUser) {
          setHistoryList([
            { id: 'h1', date: getTodayDateStr(), time: `${getCurrentTimeStr()} (4 hrs)`, zone: 'KRISHNA HOSTEL', slot: 'K-30', vehicle: 'KA-01-AB-1234', duration: '4 Hours', status: 'CONFIRMED' }
          ]);
        }
      } catch (e) {}
    };

    loadBookingContext();
  }, []);

  const handleConfirmBooking = async () => {
    if (isSubmitting) return;

    if (!selectedVehicle) {
      Alert.alert('No Vehicle Linked', 'Please register your vehicle under My Vehicles first before reserving a slot.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Register Vehicle', onPress: () => navigation.navigate('Vehicles') }
      ]);
      return;
    }

    const targetPlate = selectedVehicle.plate;

    // 1. Check if this specific slot in this zone is ALREADY booked for the selected date!
    const isSlotBooked = historyList.some(b => {
      const bSlot = (b.slot || '').replace(/^Slot\s*/, '');
      const bZone = (b.zone || '').replace(/^Zone\s*/, '');
      const selSlot = selectedSlot.replace(/^Slot\s*/, '');
      const selZone = selectedZone.replace(/^Zone\s*/, '');
      return bSlot === selSlot && (bZone === selZone || b.zone === selectedZone) && b.date === bookingDate && b.status === 'CONFIRMED';
    });

    if (isSlotBooked) {
      Alert.alert('Slot Unavailable', `Slot ${selectedSlot} in ${selectedZone} is ALREADY booked on ${bookingDate}.\n\nPlease select another slot or choose a different date.`);
      return;
    }

    // 2. Check if the SAME VEHICLE already has an active reservation on the SAME DATE!
    const existingVehicleBooking = historyList.find(b => 
      b.vehicle === targetPlate && 
      b.date === bookingDate && 
      b.status === 'CONFIRMED'
    );

    if (existingVehicleBooking) {
      Alert.alert(
        'Vehicle Conflict Warning', 
        `Vehicle ${targetPlate} already has an active reservation at ${existingVehicleBooking.zone} (${existingVehicleBooking.slot}) on ${bookingDate}.\n\nA single vehicle cannot occupy multiple parking spots simultaneously before exit.`
      );
      return;
    }

    setIsSubmitting(true);

    const newBookingRecord = {
      id: `h_${Date.now()}`,
      date: bookingDate,
      time: `${bookingTime} (${durationHours} hrs)`,
      zone: selectedZone,
      slot: selectedSlot,
      vehicle: targetPlate,
      duration: `${durationHours} Hours`,
      status: 'CONFIRMED'
    };

    try {
      await axios.post(`${BACKEND_URL}/bookings`, {
        slotNumber: selectedSlot,
        zoneName: selectedZone,
        vehiclePlate: targetPlate,
        bookingDate,
        bookingTime,
        durationHours
      });
    } catch (e) {}

    const updatedHistory = [newBookingRecord, ...historyList];
    setHistoryList(updatedHistory);

    const userEmail = user?.email || 'student@college.edu';
    await AsyncStorage.setItem(`@parknex_history_${userEmail}`, JSON.stringify(updatedHistory));

    setIsSubmitting(false);

    Alert.alert(
      'Reservation Confirmed!',
      `Slot ${selectedSlot} in ${selectedZone} reserved for ${targetPlate} on ${bookingDate} at ${bookingTime}.`,
      [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6, marginLeft: -6, marginRight: 8 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.greeting, { fontSize: 20, marginTop: 0 }]}>Reserve Campus Parking Slot</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        
        {/* Select Vehicle */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textMuted, marginBottom: 6 }}>Select Vehicle</Text>
        <TouchableOpacity onPress={() => setIsVehiclePickerOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: COLORS.primary, marginBottom: 20 }}>
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <MaterialCommunityIcons name="car" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.text }}>{selectedVehicle ? `${selectedVehicle.brand || 'Vehicle'} (${selectedVehicle.plate})` : 'No Vehicle Linked'}</Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' }}>{vehicles.length} Permitted Vehicles</Text>
          </View>
          <Feather name="chevron-down" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Date and Time Pickers */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textMuted, marginBottom: 6 }}>Booking Date</Text>
            <TouchableOpacity onPress={() => setIsDatePickerOpen(true)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{bookingDate}</Text>
              <Feather name="calendar" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textMuted, marginBottom: 6 }}>Entry Time</Text>
            <TouchableOpacity onPress={() => setIsTimePickerOpen(true)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{bookingTime}</Text>
              <Feather name="clock" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Select Zone */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textMuted, marginBottom: 6 }}>Select Parking Zone</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {zonesList.map(z => {
            const isSelected = selectedZone === z.name;
            return (
              <TouchableOpacity 
                key={z.id}
                onPress={() => {
                  setSelectedZone(z.name);
                  if (z.name === 'KRISHNA HOSTEL') setSelectedSlot('K-04');
                  else if (z.name.includes('Zone A')) setSelectedSlot('A-08');
                  else if (z.name.includes('Zone B')) setSelectedSlot('B-12');
                  else setSelectedSlot('C-01');
                }}
                style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : COLORS.white,
                  borderRadius: 14,
                  padding: 12,
                  borderWidth: 1.5,
                  borderColor: isSelected ? COLORS.primary : COLORS.border
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.text }}>{z.name}</Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{z.capacity} Total Slots</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* SLOT SELECTION MATRIX FOR KRISHNA HOSTEL */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textMuted, marginBottom: 8 }}>
          Select Available Slot in {selectedZone}
        </Text>
        <View style={{ backgroundColor: COLORS.white, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.primary, marginBottom: 10 }}>
            Selected Slot: {selectedSlot}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
              {(() => {
                const selectedZoneObj = zonesList.find(z => z.name === selectedZone);
                const cap = selectedZoneObj?.capacity || 30;
                let p = 'A-';
                if (selectedZone.includes('KRISHNA')) p = 'K-';
                else if (selectedZone.includes('Zone A')) p = 'A-';
                else if (selectedZone.includes('Zone B')) p = 'B-';
                else if (selectedZone.includes('Zone C')) p = 'C-';
                else if (selectedZone.includes('Zone D')) p = 'D-';
                else if (selectedZone.includes('Zone E')) p = 'E-';
                else p = `${selectedZone.charAt(0).toUpperCase()}-`;

                const zoneSlots = Array.from({ length: Math.min(60, cap) }, (_, i) => `${p}${(i + 1).toString().padStart(2, '0')}`);

                return zoneSlots.map(s => {
                  const isSelected = selectedSlot === s;
                  const isTaken = historyList.some(h => (h.slot === s || h.slot === `Slot ${s}`) && h.date === bookingDate && h.status === 'CONFIRMED');
                  return (
                    <TouchableOpacity
                      key={s}
                      disabled={isTaken}
                      onPress={() => setSelectedSlot(s)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: isTaken ? '#F1F5F9' : isSelected ? COLORS.primary : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: isTaken ? '#CBD5E1' : isSelected ? COLORS.primary : COLORS.border
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '900', color: isTaken ? '#94A3B8' : isSelected ? '#fff' : COLORS.text }}>
                        {s} {isTaken ? '(Taken)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
          </ScrollView>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity 
          onPress={handleConfirmBooking} 
          disabled={isSubmitting}
          style={{ backgroundColor: COLORS.primary, padding: 16, borderRadius: 16, alignItems: 'center' }}
        >
          <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '900' }}>
            {isSubmitting ? 'Confirming Reservation...' : `Confirm & Book Slot ${selectedSlot}`}
          </Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Vehicle Picker Overlay */}
      {isVehiclePickerOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 14 }}>Select Vehicle</Text>
            {vehicles.map(v => (
              <TouchableOpacity 
                key={v.plate}
                onPress={() => { setSelectedVehicle(v); setIsVehiclePickerOpen(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: selectedVehicle?.plate === v.plate ? COLORS.primary : COLORS.border, borderRadius: 12, marginBottom: 10 }}
              >
                <MaterialCommunityIcons name="car" size={22} color={COLORS.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.text }}>{v.brand} {v.model}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{v.plate}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setIsVehiclePickerOpen(false)} style={{ padding: 12, alignItems: 'center', marginTop: 6 }}>
              <Text style={{ color: COLORS.textMuted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Date Picker Overlay */}
      {isDatePickerOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 12 }}>Booking Date (YYYY-MM-DD)</Text>
            <TextInput 
              value={bookingDate}
              onChangeText={setBookingDate}
              style={[styles.input, { marginBottom: 16 }]}
            />
            <TouchableOpacity onPress={() => setIsDatePickerOpen(false)} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Time Picker Overlay */}
      {isTimePickerOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 12 }}>Entry Time (e.g. 09:30 AM)</Text>
            <TextInput 
              value={bookingTime}
              onChangeText={setBookingTime}
              style={[styles.input, { marginBottom: 16 }]}
            />
            <TouchableOpacity onPress={() => setIsTimePickerOpen(false)} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Confirm Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}
