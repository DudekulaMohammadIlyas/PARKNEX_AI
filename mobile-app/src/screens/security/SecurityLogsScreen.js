import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import config from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function SecurityLogsScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/security/logs`);
        if (Array.isArray(res.data)) {
          setLogs(res.data.map(l => ({
            time: l.createdAt ? new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            event: l.action || 'Security Action',
            plate: l.entityId || l.licensePlate || 'SYSTEM',
            type: (l.action || '').includes('DENIED') ? 'danger' : 'success',
            text: l.text || l.details || ''
          })));
        }
      } catch (e) {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F1F5F9' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, flex: 1 }}>ParkNex AI</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 8 }}>Security Logs</Text>
        <Text style={{ fontSize: 16, color: COLORS.textMuted, marginBottom: 32 }}>Review all entry and exit events across campus</Text>

        {/* Logs Table Mock */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border }}>
          
          {/* Table Header */}
          <View style={{ flexDirection: 'row', padding: 20, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Timestamp</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Event</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Plate</Text>
          </View>

          {/* Table Rows */}
          {logs.map((item, index) => {
            let dotColor = COLORS.textMuted;
            let textColor = COLORS.textMuted;
            if (item.type === 'danger') { dotColor = COLORS.danger; textColor = COLORS.danger; }
            if (item.type === 'success') { dotColor = COLORS.success; textColor = COLORS.success; }

            return (
              <View key={index} style={{ flexDirection: 'row', padding: 20, borderBottomWidth: index === logs.length - 1 ? 0 : 1, borderBottomColor: COLORS.border, alignItems: 'center' }}>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textMuted }}>{item.time}</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor, marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, flexShrink: 1 }}>{item.event.replace(' ', '\n')}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '900', color: COLORS.text }}>{item.plate}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
