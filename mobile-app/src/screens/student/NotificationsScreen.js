import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config, { smartApiRequest } from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function NotificationsScreen({ navigation, user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState('student@college.edu');
  const [userRole, setUserRole] = useState('STUDENT');

  const fetchNotifications = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      let targetEmail = user?.email || 'student@college.edu';
      let targetRole = user?.role || 'STUDENT';
      
      const userStr = await AsyncStorage.getItem('@parknex_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.email) targetEmail = u.email;
        if (u.role) targetRole = u.role;
      }

      setUserEmail(targetEmail);
      setUserRole(targetRole);

      const res = await smartApiRequest('get', `/notifications?email=${encodeURIComponent(targetEmail)}&role=${encodeURIComponent(targetRole)}`);
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await smartApiRequest('put', `/notifications/${id}/read`).catch(() => null);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await smartApiRequest('put', '/notifications/read-all', { email: userEmail }).catch(() => null);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      Alert.alert('Notifications Cleared', 'All alerts marked as read.');
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    try {
      await smartApiRequest('delete', `/notifications/${id}`).catch(() => null);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {}
  };

  const handleDeepLink = (deepLink, item) => {
    if (!item.isRead) handleMarkAsRead(item.id);
    if (!navigation) return;

    if (deepLink === 'StudentBookScreen' || item.category === 'PARKING_EXPIRY' || item.category === 'BOOKING') {
      navigation.navigate('Book');
    } else if (deepLink === 'StudentVehiclesScreen' || item.category === 'VEHICLE_ENTRY' || item.category === 'VEHICLE_EXIT') {
      navigation.navigate('Vehicles');
    } else if (deepLink === 'Emergency' || item.category === 'EMERGENCY') {
      Alert.alert('🚨 Emergency Alert', item.message);
    } else {
      navigation.navigate('Home');
    }
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.isRead;
    if (activeTab === 'EXPIRY') return n.category === 'PARKING_EXPIRY' || n.category === 'PARKING_EXPIRED' || n.category === 'BOOKING';
    if (activeTab === 'ALERTS') return n.priority === 'HIGH' || n.priority === 'CRITICAL' || n.category === 'SECURITY' || n.category === 'EMERGENCY';
    if (activeTab === 'ANNOUNCEMENT') return n.category === 'ANNOUNCEMENT';
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL': return { bg: '#FEE2E2', color: '#DC2626', label: 'CRITICAL' };
      case 'HIGH': return { bg: '#FEF3C7', color: '#D97706', label: 'HIGH' };
      case 'LOW': return { bg: '#F3F4F6', color: '#6B7280', label: 'LOW' };
      default: return { bg: '#DBEAFE', color: '#2563EB', label: 'NORMAL' };
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'PARKING_EXPIRY':
      case 'PARKING_EXPIRED': return { name: 'clock', color: '#D97706', bg: '#FEF3C7' };
      case 'VEHICLE_ENTRY':
      case 'VEHICLE_EXIT': return { name: 'truck', color: '#059669', bg: '#D1FAE5' };
      case 'SECURITY':
      case 'VIOLATION': return { name: 'shield-off', color: '#DC2626', bg: '#FEE2E2' };
      case 'EMERGENCY': return { name: 'alert-triangle', color: '#DC2626', bg: '#FEE2E2' };
      case 'ANNOUNCEMENT': return { name: 'volume-2', color: '#4F46E5', bg: '#E0E7FF' };
      default: return { name: 'bell', color: '#2563EB', bg: '#DBEAFE' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      
      {/* HEADER */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {navigation?.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6, marginRight: 8 }}>
              <Feather name="arrow-left" size={22} color={COLORS.text} />
            </TouchableOpacity>
          )}
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>Alert Center</Text>
          {unreadCount > 0 && (
            <View style={{ backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>{unreadCount} NEW</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={{ backgroundColor: 'rgba(37,99,235,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 12 }}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER TABS */}
      <View style={{ backgroundColor: COLORS.white, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {[
            { key: 'ALL', label: 'All' },
            { key: 'UNREAD', label: `Unread (${unreadCount})` },
            { key: 'EXPIRY', label: 'Expiries' },
            { key: 'ALERTS', label: 'Security & Alerts' },
            { key: 'ANNOUNCEMENT', label: 'News' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: activeTab === tab.key ? COLORS.primary : '#F1F5F9'
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: activeTab === tab.key ? '#FFF' : '#64748B' }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* NOTIFICATIONS LIST */}
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 20 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Feather name="bell-off" size={32} color="#94A3B8" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>No Notifications</Text>
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 }}>
              All your active parking expiries, gate scans, and security announcements will show up here in real time.
            </Text>
          </View>
        ) : (
          filtered.map(item => {
            const icon = getCategoryIcon(item.category);
            const badge = getPriorityBadge(item.priority);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => handleDeepLink(item.deepLink, item)}
                style={{
                  backgroundColor: item.isRead ? COLORS.white : '#EEF2FF',
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: item.isRead ? COLORS.border : '#C7D2FE',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: icon.bg, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Feather name={icon.name} size={20} color={icon.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A', flex: 1, marginRight: 6 }}>{item.title}</Text>
                      <View style={{ backgroundColor: badge.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: badge.color }}>{badge.label}</Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 8, fontWeight: '500' }}>
                      {item.message}
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                          <Feather name="trash-2" size={15} color="#94A3B8" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.primary, marginRight: 2 }}>Tap Action</Text>
                          <Feather name="chevron-right" size={14} color={COLORS.primary} />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
