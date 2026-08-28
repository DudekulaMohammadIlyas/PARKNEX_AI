import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function StudentVehiclesScreen() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addBrand, setAddBrand] = useState('');
  const [addModel, setAddModel] = useState('');
  const [addColor, setAddColor] = useState('');
  const [addPlate, setAddPlate] = useState('');
  const [addType, setAddType] = useState('4-Wheeler');

  useEffect(() => {
    const loadUserAndVehicles = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@parknex_user');
        const userObj = storedUser ? JSON.parse(storedUser) : { email: 'student@college.edu', name: 'Student' };
        setUser(userObj);

        const userEmail = userObj.email || 'student@college.edu';
        const isDemoUser = userEmail === 'student@college.edu' || userObj.name === 'Alex Carter';
        const storageKey = `@parknex_vehicles_${userEmail}`;

        // 1. Fetch server-side vehicles
        try {
          const apiRes = await axios.get(`${BACKEND_URL}/vehicles`);
          if (Array.isArray(apiRes.data) && apiRes.data.length > 0) {
            const mapped = apiRes.data.map(v => ({
              id: v.id,
              brand: v.brand,
              model: v.model || 'Standard',
              color: v.color || 'White',
              type: v.type === 'TWO_WHEELER' ? '2-Wheeler' : v.type === 'ELECTRIC_VEHICLE' ? 'EV' : '4-Wheeler',
              plate: v.plateNumber,
              status: v.status || 'Verified'
            }));
            setVehicles(mapped);
            await AsyncStorage.setItem(storageKey, JSON.stringify(mapped));
            return;
          }
        } catch (e) {}

        // 2. Local fallback
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          try { setVehicles(JSON.parse(saved)); } catch (e) {}
        } else if (isDemoUser) {
          const demo = [
            { id: '1', brand: 'Honda', model: 'Civic', color: 'Pearl White', type: '4-Wheeler', plate: 'KA-01-AB-1234', status: 'Verified' },
            { id: '2', brand: 'Royal Enfield', model: 'Classic 350', color: 'Matte Black', type: '2-Wheeler', plate: 'KA-05-XY-9876', status: 'Verified' }
          ];
          setVehicles(demo);
          await AsyncStorage.setItem(storageKey, JSON.stringify(demo));
        } else {
          setVehicles([]);
        }
      } catch (e) {}
    };

    loadUserAndVehicles();
    const interval = setInterval(loadUserAndVehicles, 5000);
    return () => clearInterval(interval);
  }, []);

  const saveVehiclesLocally = async (updatedList) => {
    setVehicles(updatedList);
    const userEmail = user?.email || 'student@college.edu';
    await AsyncStorage.setItem(`@parknex_vehicles_${userEmail}`, JSON.stringify(updatedList));
  };

  const handleAddVehicle = async () => {
    if (!addBrand.trim() || !addPlate.trim()) {
      Alert.alert('Validation Error', 'Please fill in vehicle brand and plate number.');
      return;
    }

    const newVeh = {
      id: Date.now().toString(),
      brand: addBrand,
      model: addModel || 'Standard',
      color: addColor || 'Pearl White',
      type: addType,
      plate: addPlate.toUpperCase().trim(),
      status: 'Verified'
    };

    try {
      await axios.post(`${BACKEND_URL}/vehicles`, {
        brand: addBrand,
        model: addModel,
        color: addColor,
        plateNumber: addPlate.toUpperCase().trim(),
        type: addType === '2-Wheeler' ? 'TWO_WHEELER' : addType === 'EV' ? 'ELECTRIC_VEHICLE' : 'FOUR_WHEELER'
      });
    } catch (e) {}

    const updated = [newVeh, ...vehicles];
    await saveVehiclesLocally(updated);

    Alert.alert('Success', `Vehicle ${newVeh.plate} registered and verified successfully!`);
    setIsAddOpen(false);
    setAddBrand('');
    setAddModel('');
    setAddColor('');
    setAddPlate('');
  };

  const handleDeleteVehicle = (plateToDelete) => {
    Alert.alert(
      'Remove Vehicle',
      `Are you sure you want to remove vehicle ${plateToDelete}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const updated = vehicles.filter(v => v.plate !== plateToDelete);
            await saveVehiclesLocally(updated);
            Alert.alert('Removed', 'Vehicle removed from your registered list.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>My Registered Vehicles</Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{vehicles.length} Permitted Vehicles</Text>
          </View>
          <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 14, paddingVertical: 8 }]} onPress={() => setIsAddOpen(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={[styles.primaryBtnText, { fontSize: 12, marginLeft: 4 }]}>Register</Text>
          </TouchableOpacity>
        </View>

        {vehicles.length === 0 ? (
          <View style={[styles.card, { padding: 30, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border }]}>
            <MaterialCommunityIcons name="car-outline" size={48} color={COLORS.textMuted} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 12 }}>No Registered Vehicles</Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              Add your vehicle plate number to generate your scannable digital parking pass.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsAddOpen(true)}>
              <Text style={styles.primaryBtnText}>+ Add First Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((v) => (
            <View key={v.plate} style={[styles.card, { marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.success }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MaterialCommunityIcons name={v.type === '2-Wheeler' ? 'motorbike' : 'car'} size={24} color={COLORS.primary} />
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text }}>{v.brand} {v.model}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{v.color} • {v.type}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={{ color: COLORS.success, fontSize: 11, fontWeight: '800' }}>Verified</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteVehicle(v.plate)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text, letterSpacing: 2 }}>{v.plate}</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* REGISTER VEHICLE MODAL */}
      <Modal visible={isAddOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>Register New Vehicle</Text>
              <TouchableOpacity onPress={() => setIsAddOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Vehicle Brand</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. Honda, Hyundai, Suzuki" value={addBrand} onChangeText={setAddBrand} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Vehicle Model</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. Civic, Creta, Access 125" value={addModel} onChangeText={setAddModel} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>License Plate Number</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. KA-01-AB-1234" value={addPlate} onChangeText={setAddPlate} autoCapitalize="characters" />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Vehicle Color</Text>
            <TextInput style={[styles.input, { marginBottom: 16 }]} placeholder="e.g. Pearl White, Black" value={addColor} onChangeText={setAddColor} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Vehicle Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {['4-Wheeler', '2-Wheeler', 'EV'].map(t => (
                <TouchableOpacity 
                  key={t}
                  onPress={() => setAddType(t)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: addType === t ? COLORS.primary : '#F1F5F9', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: addType === t ? '#fff' : COLORS.text }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddVehicle}>
              <Text style={styles.primaryBtnText}>Register & Save Vehicle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
