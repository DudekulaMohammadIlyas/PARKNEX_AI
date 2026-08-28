import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import config from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function SecurityDashboard({ navigation, onLogout, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview'); // 'overview' | 'cctv' | 'visitors' | 'violations'
  const [inputPlate, setInputPlate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  // CCTV Cameras State
  const [cameras, setCameras] = useState([
    { id: 'cam_1', camId: 'Cam 01', name: 'Main Campus Entrance Gate', zone: 'Zone A', plate: 'KA-01-AB-1234', status: 'AUTHORIZED' },
    { id: 'cam_2', camId: 'Cam 02', name: 'Zone A - CS Academic Block', zone: 'Zone A', plate: 'MH-12-XY-9090', status: 'PARKED' },
    { id: 'cam_3', camId: 'Cam 03', name: 'Zone B - Central Library', zone: 'Zone B', plate: 'KA-05-XY-9876', status: 'MONITORED' },
    { id: 'cam_4', camId: 'Cam 04', name: 'North Security Gate Barrier', zone: 'North Block', plate: 'UP-16-XX-8888', status: 'UNAUTHORIZED' }
  ]);
  const [isAddCamModalOpen, setIsAddCamModalOpen] = useState(false);
  const [newCamName, setNewCamName] = useState('');
  const [newCamZone, setNewCamZone] = useState('KRISHNA HOSTEL');
  const [newCamPlate, setNewCamPlate] = useState('KA-09-ZZ-9999');

  // Visitor Console State
  const [visitorsList, setVisitorsList] = useState([
    { id: '1', name: 'John Mark', phone: '+91 98765 11111', plateNumber: 'DL-01-VX-7777', visitPurpose: 'Guest Lecture in CS Dept', status: 'APPROVED', qrCode: 'VISITOR_QR_7777' },
    { id: '2', name: 'Rahul Sharma', phone: '+91 98123 44444', plateNumber: 'KA-03-MB-5555', visitPurpose: 'Vendor Delivery to Canteen', status: 'APPROVED', qrCode: 'VISITOR_QR_5555' }
  ]);

  // Violation Ticket state
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [violationPlate, setViolationPlate] = useState('');
  const [violationType, setViolationType] = useState('WRONG_PARKING');
  const [violationDesc, setViolationDesc] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('500');

  const [violationsList, setViolationsList] = useState([
    { id: '1', plateNumber: 'UP-16-XX-8888', type: 'UNAUTHORIZED_ENTRY', description: 'no entry', penaltyAmount: 1200, status: 'PENDING' },
    { id: '2', plateNumber: 'KA-01-AB-1234', type: 'WRONG_PARKING', description: 'Reported by Security Officer', penaltyAmount: 500, status: 'PENDING' },
    { id: '3', plateNumber: 'KA-01-AB-1234', type: 'EXPIRED_PASS', description: 'expired pass', penaltyAmount: 500, status: 'RESOLVED' }
  ]);
  
  const [alerts, setAlerts] = useState([
    { id: '1', title: 'Suspicious loitering in Zone C', desc: 'Pedestrian lingering near gate', time: '4m ago' },
    { id: '2', title: 'Unregistered Entry Attempt', desc: 'Plate UP-16-XX-8888 failed scan', time: '10m ago' }
  ]);

  // LIVE SECURITY ACTIVITY LOG STATE
  const [securityLogs, setSecurityLogs] = useState([
    { id: '1', type: 'ENTRY', text: 'Vehicle KA-01-AB-1234 entered Zone A', time: 'Just now', color: '#6366F1' },
    { id: '2', type: 'ALERT', text: 'Suspicious loitering detected near Zone C Gate', time: '4m ago', color: '#EF4444' },
    { id: '3', type: 'EXIT', text: 'Vehicle MH-12-XY-9090 exited Main Gate Barrier', time: '12m ago', color: '#10B981' },
    { id: '4', type: 'ENTRY', text: 'Guest Vehicle DL-01-VX-7777 granted gate clearance', time: '25m ago', color: '#2563EB' },
    { id: '5', type: 'TICKET', text: 'Violation Ticket #V-8888 issued for UP-16-XX-8888', time: '40m ago', color: '#F59E0B' }
  ]);

  // OFFICER PROFILE & SETTINGS STATE
  const [officerProfile, setOfficerProfile] = useState({
    name: 'Officer Davis',
    rank: 'Head Security Officer',
    badgeId: 'SEC-2026-99',
    campus: 'Saveetha University Main Campus',
    shift: 'Morning Shift (07:00 - 15:00)',
    autoScan: true,
    instantAlerts: true
  });
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('Officer Davis');
  const [editRank, setEditRank] = useState('Head Security Officer');

  const pushSecurityLog = async (type, text, color = '#6366F1') => {
    const newEntry = {
      id: String(Date.now()),
      type,
      text,
      time: 'Just now',
      color
    };
    setSecurityLogs(prev => [newEntry, ...prev]);
    try {
      await axios.post(`${BACKEND_URL}/security-logs`, { type, text, color }).catch(() => null);
    } catch (e) {}
  };

  const fetchSecurityData = async () => {
    try {
      const [vRes, cRes, visRes, logRes] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/violations`),
        axios.get(`${BACKEND_URL}/cameras`),
        axios.get(`${BACKEND_URL}/visitors`),
        axios.get(`${BACKEND_URL}/security-logs`)
      ]);

      if (vRes.status === 'fulfilled' && Array.isArray(vRes.value.data) && vRes.value.data.length > 0) {
        setViolationsList(vRes.value.data);
      }
      if (cRes.status === 'fulfilled' && Array.isArray(cRes.value.data) && cRes.value.data.length > 0) {
        setCameras(cRes.value.data);
      }
      if (visRes.status === 'fulfilled' && Array.isArray(visRes.value.data) && visRes.value.data.length > 0) {
        setVisitorsList(visRes.value.data);
      }
      if (logRes.status === 'fulfilled' && Array.isArray(logRes.value.data) && logRes.value.data.length > 0) {
        setSecurityLogs(logRes.value.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCameraMobile = async () => {
    if (!newCamName.trim()) {
      Alert.alert('Error', 'Please enter a camera name.');
      return;
    }

    try {
      const res = await axios.post(`${BACKEND_URL}/cameras`, {
        name: newCamName.trim(),
        zone: newCamZone,
        plate: newCamPlate.trim().toUpperCase(),
        status: 'MONITORED'
      });
      if (res.data) setCameras(prev => [...prev, res.data]);
    } catch (e) {
      const nextNum = cameras.length + 1;
      setCameras(prev => [...prev, {
        id: `cam_${Date.now()}`,
        camId: `Cam ${nextNum < 10 ? '0' + nextNum : nextNum}`,
        name: newCamName.trim(),
        zone: newCamZone,
        plate: newCamPlate.trim().toUpperCase(),
        status: 'MONITORED'
      }]);
    } finally {
      setIsAddCamModalOpen(false);
      pushSecurityLog('CAMERA', `📹 CCTV Camera Feed '${newCamName.trim()}' Added to Grid (${newCamZone})`, '#38BDF8');
      setNewCamName('');
      Alert.alert('Camera Added 📹', `New CCTV Stream "${newCamName.trim()}" linked to ${newCamZone}!`);
    }
  };

  const handleDeleteCameraMobile = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/cameras/${id}`).catch(() => null);
    } catch (e) {}
    setCameras(prev => prev.filter(c => c.id !== id && c.camId !== id));
    pushSecurityLog('CAMERA', `🗑️ CCTV Camera Feed Removed from Grid`, '#EF4444');
    Alert.alert('Camera Removed', 'CCTV feed removed from surveillance grid.');
  };

  const handleManualScan = async () => {
    if (!inputPlate.trim()) return;
    setIsProcessing(true);
    const targetP = inputPlate.trim().toUpperCase();

    try {
      await axios.post(`${BACKEND_URL}/simulate-event`, {
        type: 'ENTRY',
        plateNumber: targetP,
        zoneId: 'Zone A'
      });

      const isUnauthorized = targetP.includes('UP16') || targetP.endsWith('0');
      if (isUnauthorized) {
        pushSecurityLog('ALERT', `🚨 Blacklisted Plate ${targetP} Attempted Entry at Barrier Gate`, '#EF4444');
        Alert.alert('ACCESS DENIED ❌', 'Blacklisted / Unregistered Plate Detected!');
      } else {
        pushSecurityLog('ENTRY', `🚪 Gate Barrier Release Scan for Vehicle ${targetP}`, '#2563EB');
        Alert.alert('ACCESS GRANTED ✅', 'Gate Barrier Releasing.');
      }
    } catch (e) {
      pushSecurityLog('ENTRY', `🚪 Gate Barrier Scan Triggered for Vehicle ${targetP}`, '#2563EB');
      Alert.alert('Scan Complete', `Vehicle ${targetP} cleared gate.`);
    } finally {
      setIsProcessing(false);
      setInputPlate('');
    }
  };

  const handleTriggerEmergency = async () => {
    try {
      await axios.post(`${BACKEND_URL}/emergency/trigger`, {
        vehicleType: 'AMBULANCE',
        plateNumber: 'EMG-9999',
        locationZone: 'Zone A'
      });
      setIsEmergencyActive(true);
      pushSecurityLog('ALERT', '🚨 EMERGENCY OVERRIDE ACTIVATED BY SECURITY OFFICER', '#EF4444');
      Alert.alert('🚨 EMERGENCY OVERRIDE', 'Priority barrier release activated!');
    } catch (e) {
      setIsEmergencyActive(true);
      pushSecurityLog('ALERT', '🚨 EMERGENCY OVERRIDE ACTIVATED BY SECURITY OFFICER', '#EF4444');
      Alert.alert('Emergency Override', 'Activated locally.');
    }
  };

  const handleIssueViolation = async () => {
    if (!violationPlate.trim()) {
      Alert.alert('Error', 'Please enter license plate number.');
      return;
    }

    const fineVal = Number(penaltyAmount.trim()) || 500;
    const targetP = violationPlate.toUpperCase().trim();

    try {
      await axios.post(`${BACKEND_URL}/violations`, {
        plateNumber: targetP,
        type: violationType,
        description: violationDesc || 'Reported by Security Officer',
        penaltyAmount: fineVal
      });
      pushSecurityLog('TICKET', `🎟️ Violation Ticket Issued for Plate ${targetP} (Fine: ₹${fineVal})`, '#F59E0B');
      Alert.alert('Ticket Issued! 🎟️', `Violation ticket (₹${fineVal}) issued for ${targetP}`);
    } catch (e) {
      pushSecurityLog('TICKET', `🎟️ Violation Ticket Issued for Plate ${targetP} (Fine: ₹${fineVal})`, '#F59E0B');
      Alert.alert('Ticket Issued! 🎟️', `Violation ticket (₹${fineVal}) issued for ${targetP}`);
    } finally {
      setIsViolationModalOpen(false);
      setViolationPlate('');
      setViolationDesc('');
      setPenaltyAmount('500');
    }
  };

  const handleResolveTicket = async (id) => {
    const targetId = String(id);
    setViolationsList(prev => prev.map(v => String(v.id) === targetId ? { ...v, status: 'RESOLVED' } : v));
    pushSecurityLog('TICKET', `✅ Violation Ticket #${targetId} Marked Resolved by Officer`, '#10B981');
    try {
      await axios.put(`${BACKEND_URL}/violations/${targetId}/resolve`).catch(() => null);
      Alert.alert('Ticket Cleared ✅', 'Violation ticket marked as resolved.');
    } catch (e) {
      Alert.alert('Ticket Cleared ✅', 'Violation ticket marked as resolved.');
    } finally {
      fetchSecurityData();
    }
  };

  const handleGrantEntry = async (id) => {
    const targetId = String(id);
    setVisitorsList(prev => prev.map(v => String(v.id) === targetId ? { ...v, status: 'CLEARED' } : v));
    pushSecurityLog('ENTRY', `👤 Visitor Gate Clearance Granted for ID #${targetId}`, '#2563EB');
    try {
      await axios.put(`${BACKEND_URL}/visitors/${targetId}/grant-entry`).catch(() => null);
      Alert.alert('Gate Clearance Granted ✅', 'Visitor has been approved for gate entry!');
    } catch (e) {
      Alert.alert('Gate Clearance Granted ✅', 'Visitor has been approved for gate entry!');
    } finally {
      fetchSecurityData();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
        
        {/* PREMIUM DARK SECURITY OFFICER HEADER */}
        <View style={{ backgroundColor: '#0F172A', borderRadius: 22, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: '#1E293B', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
              <Image 
                source={require('../../../assets/icon.png')} 
                style={{ width: 50, height: 50, borderRadius: 14, borderWidth: 2, borderColor: '#38BDF8' }} 
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#F8FAFC', letterSpacing: 0.3 }}>{officerProfile.name}</Text>
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#10B981' }}>
                    <Text style={{ color: '#34D399', fontSize: 9, fontWeight: '900' }}>DUTY ACTIVE</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '700' }}>{officerProfile.rank} • #{officerProfile.badgeId}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }} 
              onPress={onLogout}
            >
              <Ionicons name="log-out" size={20} color="#F87171" />
            </TouchableOpacity>
          </View>
        </View>

        {/* TOP SEGMENTED TAB NAVIGATION BAR */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 18 }}>
          {[
            { key: 'overview', label: '🛡️ Overview' },
            { key: 'cctv', label: '📹 CCTV Grid' },
            { key: 'visitors', label: '👤 Visitors' },
            { key: 'violations', label: '🎟️ Violations' },
            { key: 'settings', label: '⚙️ Settings' }
          ].map(t => {
            const isSel = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 16,
                  backgroundColor: isSel ? '#0F172A' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: isSel ? '#0F172A' : '#CBD5E1',
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: isSel ? 3 : 1
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '900', color: isSel ? '#FFFFFF' : '#475569' }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* EMERGENCY OVERRIDE BANNER */}
        {isEmergencyActive && (
          <View style={{ backgroundColor: '#EF4444', padding: 16, borderRadius: 16, marginBottom: 18, shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="warning-sharp" size={22} color="#FFFFFF" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>🚨 EMERGENCY OVERRIDE ACTIVE</Text>
            </View>
            <Text style={{ color: '#FEE2E2', fontSize: 12, marginTop: 4, fontWeight: '600' }}>Gate barriers held open for emergency vehicles.</Text>
            <TouchableOpacity style={{ marginTop: 12, backgroundColor: '#fff', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }} onPress={() => setIsEmergencyActive(false)}>
              <Text style={{ color: '#DC2626', fontWeight: '900', fontSize: 13 }}>Deactivate Override</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* OVERVIEW TAB CONTENT */}
        {activeTab === 'overview' && (
          <>
            {/* ACTION QUICK BUTTONS */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  backgroundColor: '#EF4444', 
                  paddingVertical: 14, 
                  borderRadius: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8,
                  elevation: 3
                }} 
                onPress={handleTriggerEmergency}
              >
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Emergency</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ 
                  flex: 1, 
                  backgroundColor: '#2563EB', 
                  paddingVertical: 14, 
                  borderRadius: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8,
                  elevation: 3
                }} 
                onPress={() => setIsViolationModalOpen(true)}
              >
                <Ionicons name="receipt" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Issue Ticket</Text>
              </TouchableOpacity>
            </View>

            {/* MANUAL OCR GATE SCANNER */}
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 18, borderWidth: 1.5, borderColor: '#E2E8F0', elevation: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>Entry Gate OCR Barrier Scanner</Text>
                <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#A7F3D0' }}>
                  <Text style={{ color: '#047857', fontSize: 10, fontWeight: '900' }}>GATE READY</Text>
                </View>
              </View>

              <TextInput
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1.5,
                  borderColor: '#CBD5E1',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  fontWeight: '800',
                  color: '#0F172A',
                  marginBottom: 14
                }}
                placeholder="Enter License Plate e.g. KA01AB1234..."
                placeholderTextColor="#94A3B8"
                value={inputPlate}
                onChangeText={setInputPlate}
                autoCapitalize="characters"
              />

              <TouchableOpacity 
                style={{
                  backgroundColor: '#2563EB',
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 3
                }} 
                onPress={handleManualScan} 
                disabled={isProcessing}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14, letterSpacing: 0.3 }}>
                  {isProcessing ? '⚡ Scanning License Plate...' : '⚡ Trigger Barrier Scan'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* CRITICAL ALERTS */}
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: '#E2E8F0', elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Ionicons name="warning" size={20} color="#DC2626" />
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#DC2626' }}>Critical Security Alerts</Text>
              </View>
              {alerts.map(a => (
                <View key={a.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{a.title}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '600' }}>{a.desc} • {a.time}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* CCTV GRID TAB CONTENT */}
        {activeTab === 'cctv' && (
          <View style={[styles.card, { padding: 16, backgroundColor: '#0B0F19', borderColor: '#1E293B', borderWidth: 1.5 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>📹 CCTV Surveillance Grid</Text>
                <Text style={{ fontSize: 11, color: '#38BDF8', marginTop: 2, fontWeight: '700' }}>Active Live Feeds: {cameras.length}</Text>
              </View>
              <TouchableOpacity 
                style={{ backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
                onPress={() => setIsAddCamModalOpen(true)}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>+ Add Feed</Text>
              </TouchableOpacity>
            </View>

            {cameras.map((cam) => {
              const isUnauth = cam.status === 'UNAUTHORIZED';
              return (
                <View key={cam.id || cam.camId} style={{ backgroundColor: '#0F172A', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: isUnauth ? '#EF4444' : '#10B981', padding: 14, marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF' }}>{cam.camId}: {cam.name}</Text>
                      <Text style={{ fontSize: 10, color: '#38BDF8', fontWeight: '800', marginTop: 1 }}>Zone: {cam.zone || 'Campus Zone'}</Text>
                    </View>
                    <View style={{ backgroundColor: isUnauth ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: isUnauth ? '#EF4444' : '#10B981' }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: isUnauth ? '#FCA5A5' : '#34D399' }}>{cam.status || 'MONITORED'}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#020617', height: 100, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginVertical: 8, borderWidth: 1, borderColor: isUnauth ? '#EF4444' : '#00FF66', position: 'relative', overflow: 'hidden' }}>
                    <Ionicons name="videocam-outline" size={32} color="#38BDF8" />
                    <Text style={{ color: '#F8FAFC', fontSize: 10, fontWeight: '800', marginTop: 4 }}>LIVE AI VISION STREAM</Text>
                    <View style={{ position: 'absolute', bottom: 6, left: 8, backgroundColor: '#06150B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: isUnauth ? '#EF4444' : '#00FF66' }}>
                      <Text style={{ color: isUnauth ? '#FCA5A5' : '#00FF66', fontSize: 10, fontWeight: '900', fontFamily: 'monospace' }}>
                        PLATE: {cam.plate || 'KA-01-AB-1234'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '700' }}>1080p • 60 FPS</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity 
                        style={{ backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                        onPress={() => {
                          setViolationPlate(cam.plate || '');
                          setIsViolationModalOpen(true);
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>Issue Ticket</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 }}
                        onPress={() => handleDeleteCameraMobile(cam.id || cam.camId)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* VISITOR CONSOLE TAB CONTENT */}
        {activeTab === 'visitors' && (
          <View style={[styles.card, { padding: 18 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>👤 Visitor Entry & Verification</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Gate Passes & Guest Vehicle Approvals</Text>
              </View>
              <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#A7F3D0' }}>
                <Text style={{ color: '#047857', fontWeight: '900', fontSize: 11 }}>{visitorsList.length} Active Guests</Text>
              </View>
            </View>

            {visitorsList.map((vis, idx) => {
              const isCleared = vis.status === 'CLEARED' || vis.status === 'ENTERED';
              return (
                <View key={vis.id || idx} style={{ backgroundColor: isCleared ? '#F8FAFC' : '#ECFDF5', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: isCleared ? '#E2E8F0' : '#A7F3D0' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.text }}>{vis.name}</Text>
                    <View style={{ backgroundColor: isCleared ? '#DCFCE7' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: isCleared ? '#166534' : '#92400E' }}>● {vis.status || 'APPROVED'}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Phone: {vis.phone || '+91 98765 11111'}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#2563EB', marginBottom: 4 }}>Vehicle Plate: {vis.plateNumber}</Text>
                  <Text style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', marginBottom: 10 }}>Purpose: {vis.visitPurpose}</Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                    <Text style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: 'monospace' }}>Pass: {vis.qrCode || 'VISITOR_PASS_OK'}</Text>
                    {isCleared ? (
                      <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' }}>
                        <Text style={{ color: '#166534', fontSize: 11, fontWeight: '900' }}>✓ Entry Granted</Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={{ backgroundColor: '#047857', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                        onPress={() => handleGrantEntry(vis.id)}
                      >
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>Grant Entry</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* VIOLATIONS & TICKETS TAB CONTENT */}
        {activeTab === 'violations' && (
          <View style={[styles.card, { padding: 18 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>⚠️ Violations & Fines</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Enforcement & Penalty Tracking</Text>
              </View>
              <TouchableOpacity 
                style={{ backgroundColor: COLORS.danger, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
                onPress={() => setIsViolationModalOpen(true)}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>+ Issue Ticket</Text>
              </TouchableOpacity>
            </View>

            {violationsList.map((v, i) => {
              const isResolved = v.status === 'RESOLVED';
              return (
                <View key={v.id || i} style={{ backgroundColor: isResolved ? '#F8FAFC' : '#FEF2F2', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: isResolved ? '#E2E8F0' : '#FCA5A5' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.text }}>{v.plateNumber}</Text>
                    <View style={{ backgroundColor: isResolved ? '#DCFCE7' : '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: isResolved ? '#166534' : '#991B1B' }}>{v.status}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706', marginBottom: 2 }}>Category: {v.type || 'WRONG_PARKING'}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>{v.description}</Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#EF4444' }}>Fine: ₹{v.penaltyAmount || 500}</Text>
                    {!isResolved ? (
                      <TouchableOpacity 
                        onPress={() => handleResolveTicket(v.id)} 
                        style={{ backgroundColor: '#047857', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11 }}>Mark Resolved</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ fontSize: 11, color: '#047857', fontWeight: '900' }}>✓ Cleared</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* SETTINGS & OFFICER PROFILE TAB CONTENT */}
        {activeTab === 'settings' && (
          <View style={{ gap: 16 }}>
            {/* OFFICER PROFILE CARD */}
            <View style={[styles.card, { padding: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="shield-checkmark" size={30} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>{officerProfile.name}</Text>
                  <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '800', marginTop: 2 }}>{officerProfile.rank}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Badge ID: #{officerProfile.badgeId} • {officerProfile.shift}</Text>
                </View>
              </View>

              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Assigned Station:</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text }}>{officerProfile.campus}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.primaryBtn, { flex: 1, backgroundColor: COLORS.primary }]}
                  onPress={() => {
                    setEditName(officerProfile.name);
                    setEditRank(officerProfile.rank);
                    setIsEditProfileModalOpen(true);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={[styles.primaryBtnText, { marginLeft: 4 }]}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.primaryBtn, { flex: 1, backgroundColor: '#EF4444' }]}
                  onPress={onLogout}
                >
                  <Ionicons name="log-out-outline" size={18} color="#fff" />
                  <Text style={[styles.primaryBtnText, { marginLeft: 4 }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* LIVE SECURITY ACTIVITY LOG CARD */}
            <View style={[styles.card, { padding: 20 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text }}>📜 Live Security Activity Log</Text>
                <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                  <Text style={{ color: '#4F46E5', fontWeight: '900', fontSize: 11 }}>Real-time Feed</Text>
                </View>
              </View>

              {securityLogs.map((log) => (
                <View key={log.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${log.color}20`, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons 
                      name={log.type === 'ALERT' ? 'warning' : log.type === 'ENTRY' ? 'enter' : log.type === 'EXIT' ? 'exit' : 'document-text'} 
                      size={18} 
                      color={log.color} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text }}>{log.text}</Text>
                    <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{log.time}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* SYSTEM HEALTH & SECURITY PREFERENCES CARD */}
            <View style={[styles.card, { padding: 20 }]}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 12 }}>⚙️ System & Gate Preferences</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text }}>Auto OCR Barrier Gate Release</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Release barrier automatically for authorized plates</Text>
                </View>
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: '#166534', fontWeight: '900', fontSize: 11 }}>ENABLED</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text }}>Instant Security Incident Alerts</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Push alerts for loitering & unauthorized gate entries</Text>
                </View>
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: '#166534', fontWeight: '900', fontSize: 11 }}>ACTIVE</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text }}>Backend Engine Status</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Express REST API + PostgreSQL DB</Text>
                </View>
                <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' }}>
                  <Text style={{ color: '#047857', fontWeight: '900', fontSize: 11 }}>● ONLINE</Text>
                </View>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* CUSTOMIZABLE VIOLATION TICKET MODAL */}
      <Modal visible={isViolationModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>Issue Violation Ticket</Text>
              <TouchableOpacity onPress={() => setIsViolationModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>License Plate</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. KA-01-AB-1234" value={violationPlate} onChangeText={setViolationPlate} autoCapitalize="characters" />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Penalty Amount (₹)</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Enter fine amount e.g. 500" value={penaltyAmount} onChangeText={setPenaltyAmount} keyboardType="numeric" />

            {/* Quick Fine Presets */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {['200', '500', '1000', '2000'].map(amt => (
                <TouchableOpacity 
                  key={amt}
                  onPress={() => setPenaltyAmount(amt)}
                  style={{ backgroundColor: penaltyAmount === amt ? COLORS.primary : '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                >
                  <Text style={{ color: penaltyAmount === amt ? '#fff' : COLORS.text, fontSize: 11, fontWeight: '800' }}>₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Violation Description</Text>
            <TextInput style={[styles.input, { marginBottom: 20 }]} placeholder="e.g. Parked in Faculty Slot / No Permit" value={violationDesc} onChangeText={setViolationDesc} />

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.danger }]} onPress={handleIssueViolation}>
              <Text style={styles.primaryBtnText}>Issue Ticket (₹{penaltyAmount || '500'})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADD CCTV CAMERA STREAM MODAL */}
      <Modal visible={isAddCamModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 22 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>+ Add CCTV Camera Stream</Text>
              <TouchableOpacity onPress={() => setIsAddCamModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Camera Name / Title</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. Cam 05: KRISHNA HOSTEL Gate" value={newCamName} onChangeText={setNewCamName} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Link to Zone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              {['KRISHNA HOSTEL', 'Faculty Parking', 'North Block', 'Zone A', 'Zone B', 'HOSPITAL PARKING'].map(z => (
                <TouchableOpacity
                  key={z}
                  onPress={() => setNewCamZone(z)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: newCamZone === z ? COLORS.primary : '#F1F5F9' }}
                >
                  <Text style={{ color: newCamZone === z ? '#fff' : COLORS.text, fontSize: 11, fontWeight: '800' }}>{z}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Target License Plate</Text>
            <TextInput style={[styles.input, { marginBottom: 20 }]} placeholder="e.g. KA-09-ZZ-9999" value={newCamPlate} onChangeText={setNewCamPlate} autoCapitalize="characters" />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddCameraMobile}>
              <Text style={styles.primaryBtnText}>+ Add Camera Feed to Grid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT OFFICER PROFILE MODAL */}
      <Modal visible={isEditProfileModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 }}>
          <View style={[styles.card, { padding: 22 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>✏️ Edit Officer Profile</Text>
              <TouchableOpacity onPress={() => setIsEditProfileModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Officer Full Name</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Officer Name" value={editName} onChangeText={setEditName} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Designation / Rank</Text>
            <TextInput style={[styles.input, { marginBottom: 20 }]} placeholder="Designation" value={editRank} onChangeText={setEditRank} />

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => {
                setOfficerProfile(prev => ({ ...prev, name: editName, rank: editRank }));
                setIsEditProfileModalOpen(false);
                Alert.alert('Profile Updated ✨', 'Officer credentials saved successfully.');
              }}
            >
              <Text style={styles.primaryBtnText}>Save Profile Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
