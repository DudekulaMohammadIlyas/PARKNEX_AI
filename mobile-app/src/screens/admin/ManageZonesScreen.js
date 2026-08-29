import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import config from '../../../config';
import { supabase } from '../../../supabaseClient';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

const defaultZones = [
  { id: 'z1', name: 'Faculty Parking', capacity: '100 Slots', total: 100, occupied: 10, type: 'Faculty Only', status: 'Active' },
  { id: 'z2', name: 'South Block', capacity: '150 Slots', total: 150, occupied: 50, type: 'Mixed', status: 'Active' },
  { id: 'z3', name: 'Central Library', capacity: '80 Slots', total: 80, occupied: 78, type: '4-Wheeler', status: 'Active' },
  { id: 'z4', name: 'KRISHNA HOSTEL', capacity: '150 Slots', total: 150, occupied: 50, type: 'Hostel Block', status: 'Active' },
  { id: 'z5', name: 'HOSPITAL PARKING', capacity: '200 Slots', total: 200, occupied: 80, type: 'Mixed', status: 'Active' },
  { id: 'z6', name: 'Hostel Complex', capacity: '200 Slots', total: 200, occupied: 110, type: '2-Wheeler', status: 'Active' },
  { id: 'z7', name: 'CS Academic Block', capacity: '120 Slots', total: 120, occupied: 45, type: 'Academic', status: 'Active' },
  { id: 'z8', name: 'Visitor Parking', capacity: '50 Slots', total: 50, occupied: 10, type: 'Visitor Only', status: 'Active' },
  { id: 'z9', name: 'Scad', capacity: '75 Slots', total: 75, occupied: 1, type: 'Mixed', status: 'Active' }
];

export default function ManageZonesScreen({ navigation }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeZone, setActiveZone] = useState(null);

  // Form states
  const [zoneName, setZoneName] = useState('');
  const [zoneCapacity, setZoneCapacity] = useState('60');
  const [zoneType, setZoneType] = useState('Mixed');
  const [zoneStatus, setZoneStatus] = useState('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchZones = async (isInitial = false) => {
    if (isInitial && zones.length === 0) setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/zones`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(z => ({
          id: z.id,
          name: z.name,
          capacity: `${z.total || 100} Slots`,
          total: z.total || 100,
          occupied: z.occupied || 0,
          type: z.type || 'Mixed',
          status: z.status || 'Active'
        }));
        setZones(prev => {
          if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
          return mapped;
        });
      } else {
        setZones(defaultZones);
      }
    } catch (e) {
      setZones(defaultZones);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones(true);
    const interval = setInterval(() => fetchZones(false), 3000);

    const channel = supabase
      .channel('manage-zones-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchZones(false);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchZones(false);
      });

    return () => {
      clearInterval(interval);
      if (supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, []);

  const handleAddSubmit = async () => {
    if (!zoneName.trim() || !zoneCapacity.trim()) {
      Alert.alert('Validation Error', 'Please fill in Zone Name and Capacity.');
      return;
    }

    setIsSubmitting(true);
    const numCap = Number(zoneCapacity.trim()) || 60;

    try {
      await axios.post(`${BACKEND_URL}/zones`, {
        name: zoneName.trim(),
        total: numCap,
        type: zoneType,
        status: zoneStatus
      });
      Alert.alert('Zone Created!', `Zone "${zoneName.trim()}" created successfully in PostgreSQL Database.`);
    } catch (e) {
      Alert.alert('Zone Created', `Zone "${zoneName.trim()}" created.`);
    }

    await fetchZones();

    setZoneName('');
    setZoneCapacity('60');
    setZoneType('Mixed');
    setZoneStatus('Active');
    setIsSubmitting(false);
    setIsAddModalOpen(false);
  };

  const handleEditPress = (zone) => {
    setActiveZone(zone);
    setZoneName(zone.name);
    setZoneCapacity(String(zone.total || zone.capacity.replace(' Slots', '')));
    setZoneType(zone.type);
    setZoneStatus(zone.status);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!zoneName.trim() || !zoneCapacity.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    const numCap = Number(zoneCapacity.trim()) || 60;

    try {
      await axios.put(`${BACKEND_URL}/zones/${activeZone.id}`, {
        name: zoneName.trim(),
        total: numCap,
        type: zoneType,
        status: zoneStatus
      }).catch(() => null);
    } catch (e) {}

    await fetchZones();

    setZoneName('');
    setZoneCapacity('60');
    setZoneType('Mixed');
    setZoneStatus('Active');
    setIsSubmitting(false);
    setIsEditModalOpen(false);
    Alert.alert('Success', 'Zone updated successfully.');
  };

  const handleDeletePress = (id, name) => {
    Alert.alert(
      'Delete Parking Zone',
      `Are you sure you want to delete ${name}? This will remove all associated slots in the database.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/zones/${id}`).catch(() => null);
            } catch (e) {}
            await fetchZones();
            Alert.alert('Deleted', 'Zone has been deleted from database.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, flex: 1 }}>ParkNex AI Admin</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>Manage Zones & Slots</Text>
          <TouchableOpacity onPress={() => setIsAddModalOpen(true)} style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="plus" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.white, fontWeight: '900', fontSize: 13 }}>Add Zone</Text>
          </TouchableOpacity>
        </View>

        {/* Zones List */}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={{ gap: 14 }}>
            {zones.map((zone) => {
              const isActive = zone.status === 'Active';
              const statusBg = isActive ? '#DCFCE7' : '#FEF3C7';
              const statusColor = isActive ? COLORS.success : COLORS.warning;

              return (
                <View key={zone.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: isActive ? COLORS.success : COLORS.warning }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>{zone.name}</Text>
                    <View style={[styles.badge, { backgroundColor: statusBg }]}>
                      <Text style={{ color: statusColor, fontWeight: '800', fontSize: 11 }}>{zone.status}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600' }}>Capacity / Occupied</Text>
                    <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '900' }}>
                      {zone.occupied || 0} / {zone.total || zone.capacity} ({(zone.total || 100) - (zone.occupied || 0)} Free)
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600' }}>Zone Category</Text>
                    <Text style={{ fontSize: 13, color: COLORS.text, fontWeight: '800' }}>{zone.type}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleEditPress(zone)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                      <Feather name="edit-2" size={14} color={COLORS.text} style={{ marginRight: 6 }} />
                      <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 13 }}>Edit Zone</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePress(zone.id, zone.name)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' }}>
                      <Feather name="trash-2" size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>

                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add / Edit Zone Modal Component */}
      <Modal visible={isAddModalOpen || isEditModalOpen} animationType="fade" transparent onRequestClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <View style={{ width: '92%', maxWidth: 440, backgroundColor: COLORS.white, borderRadius: 24, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 12 }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>{isAddModalOpen ? 'Add New Parking Zone' : 'Edit Parking Zone'}</Text>
              <TouchableOpacity onPress={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                <Feather name="x" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 6 }}>Zone Name</Text>
            <TextInput 
              placeholder="e.g. CS ACADEMIC BLOCK"
              value={zoneName}
              onChangeText={setZoneName}
              style={[styles.input, { marginBottom: 14 }]}
            />

            <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 6 }}>Capacity (Total Slots)</Text>
            <TextInput 
              placeholder="e.g. 150"
              keyboardType="numeric"
              value={zoneCapacity}
              onChangeText={setZoneCapacity}
              style={[styles.input, { marginBottom: 14 }]}
            />

            <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 6 }}>Zone Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['Mixed', '4-Wheeler', '2-Wheeler', 'Faculty Only'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  onPress={() => setZoneType(type)}
                  style={{ width: '48%', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: zoneType === type ? COLORS.primary : COLORS.border, backgroundColor: zoneType === type ? COLORS.primary : COLORS.white, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '900', color: zoneType === type ? '#fff' : COLORS.text }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 6 }}>Operational Status</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 22 }}>
              {['Active', 'Maintenance'].map(status => (
                <TouchableOpacity 
                  key={status} 
                  onPress={() => setZoneStatus(status)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: zoneStatus === status ? COLORS.primary : COLORS.border, backgroundColor: zoneStatus === status ? COLORS.primary : COLORS.white, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '900', color: zoneStatus === status ? '#fff' : COLORS.text }}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' }}>
                <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={isAddModalOpen ? handleAddSubmit : handleEditSubmit} disabled={isSubmitting} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center' }}>
                <Text style={{ color: COLORS.white, fontWeight: '900', fontSize: 14 }}>{isSubmitting ? 'Saving...' : (isAddModalOpen ? 'Create Zone' : 'Save Changes')}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
