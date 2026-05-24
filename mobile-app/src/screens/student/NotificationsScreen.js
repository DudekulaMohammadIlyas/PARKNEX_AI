import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function NotificationsScreen() {
  const notifications = [
    { id: '1', title: 'Unauthorized Vehicle Alert', message: 'Unregistered vehicle detected in your booked slot A-14.', time: '10 mins ago', type: 'danger', read: false },
    { id: '2', title: 'Booking Reminder', message: 'Your booking for Zone A starts in 30 minutes.', time: '1 hour ago', type: 'warning', read: false },
    { id: '3', title: 'Entry Confirmed', message: 'Vehicle KA-01-AB-1234 entered campus.', time: 'Yesterday', type: 'success', read: true },
  ];

  const getIconData = (type) => {
    switch (type) {
      case 'danger': return { name: 'alert-triangle', color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.1)' };
      case 'warning': return { name: 'clock', color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.1)' };
      case 'success': return { name: 'check-circle', color: COLORS.success, bg: 'rgba(16, 185, 129, 0.1)' };
      default: return { name: 'bell', color: COLORS.primary, bg: 'rgba(37, 99, 235, 0.1)' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.greeting, { fontSize: 24 }]}>Notifications</Text>
        <TouchableOpacity>
          <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 14 }}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        {notifications.map(item => {
          const icon = getIconData(item.type);
          return (
            <View key={item.id} style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 16, flexDirection: 'row' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: icon.bg, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Feather name={icon.name} size={20} color={icon.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 6, flex: 1 }}>{item.title}</Text>
                  {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8 }} />}
                </View>
                <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '500', lineHeight: 22, marginBottom: 12 }}>{item.message}</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500' }}>{item.time}</Text>
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
