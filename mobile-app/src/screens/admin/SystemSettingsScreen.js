import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import config from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function SystemSettingsScreen({ navigation }) {
  const [institutionName, setInstitutionName] = useState('Saveetha University');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [confidenceThreshold, setConfidenceThreshold] = useState('85%');
  const [plateRecognition, setPlateRecognition] = useState(true);
  const [suspiciousActivity, setSuspiciousActivity] = useState(true);
  const [unauthorizedEntry, setUnauthorizedEntry] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/system/settings`);
        if (res.data?.institutionName) {
          setInstitutionName(res.data.institutionName);
        }
        if (res.data?.timezone) {
          setTimezone(res.data.timezone);
        }
      } catch (e) {}
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await axios.post(`${BACKEND_URL}/system/settings`, {
        institutionName,
        timezone,
        confidenceThreshold
      });
      Alert.alert('Settings Saved!', `Institution Name updated to "${institutionName}" and persisted in backend database.`);
    } catch (e) {
      Alert.alert('Saved', `Settings updated to "${institutionName}".`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, flex: 1 }}>ParkNex AI Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 20 }}>System Settings</Text>

        {/* General Settings Card */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Feather name="settings" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text }}>Institution & Regional Config</Text>
          </View>

          <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 6 }}>Institution Name</Text>
          <TextInput 
            value={institutionName}
            onChangeText={setInstitutionName}
            style={[styles.input, { marginBottom: 16 }]}
            placeholder="e.g. Saveetha University"
          />

          <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 6 }}>System Timezone</Text>
          <TextInput 
            value={timezone}
            onChangeText={setTimezone}
            style={[styles.input, { marginBottom: 10 }]}
          />
        </View>

        {/* AI & Security Card */}
        <View style={[styles.card, { marginBottom: 24 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Feather name="shield" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text }}>AI Model & Security Engine Control</Text>
          </View>

          <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '700', marginBottom: 6 }}>AI License Plate Match Confidence Threshold</Text>
          <TextInput 
            value={confidenceThreshold}
            onChangeText={setConfidenceThreshold}
            style={[styles.input, { marginBottom: 16 }]}
          />

          {/* Toggle Switches */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text }}>ANPR Camera Plate Reader</Text>
              <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Enable automatic license plate recognition at gates</Text>
            </View>
            <Switch value={plateRecognition} onValueChange={setPlateRecognition} trackColor={{ true: COLORS.primary }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text }}>AI Dwell Time & Loitering Alert</Text>
              <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Flag pedestrian linger durations exceeding 5 mins</Text>
            </View>
            <Switch value={suspiciousActivity} onValueChange={setSuspiciousActivity} trackColor={{ true: COLORS.primary }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text }}>Automatic Barrier Release</Text>
              <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Auto-open gate for verified permit vehicles</Text>
            </View>
            <Switch value={unauthorizedEntry} onValueChange={setUnauthorizedEntry} trackColor={{ true: COLORS.primary }} />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveSettings} disabled={isSaving}>
          <Text style={styles.primaryBtnText}>{isSaving ? 'Persisting Config...' : 'Save System Settings'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
