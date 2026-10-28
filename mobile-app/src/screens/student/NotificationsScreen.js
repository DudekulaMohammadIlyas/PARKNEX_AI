import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config, { smartApiRequest } from '../../../config';
import { supabase } from '../../../supabaseClient';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function NotificationsScreen({ navigation, route, user, userRole: propRole }) {
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
      let targetRole = route?.params?.userRole || route?.params?.role || '';
      let targetEmail = route?.params?.userEmail || route?.params?.email || user?.email || '';

      const [storedUser, storedRole] = await Promise.all([
        AsyncStorage.getItem('@parknex_user').catch(() => null),
        AsyncStorage.getItem('@parknex_role').catch(() => null)
      ]);

      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (!targetEmail && u.email) targetEmail = u.email;
          if (!targetRole && u.role) targetRole = u.role;
        } catch (e) {}
      }
      if (storedRole && !targetRole) {
        targetRole = storedRole;
      }
      if (!targetRole && propRole) {
        targetRole = propRole;
      }
      if (!targetRole && user?.role) {
        targetRole = user.role;
      }

      const formattedRole = (targetRole || 'STUDENT').toUpperCase();
      if (!targetEmail) {
        targetEmail = formattedRole === 'ADMIN' ? 'admin@college.edu' : formattedRole === 'SECURITY' ? 'security@college.edu' : 'student@college.edu';
      }

      setUserEmail(targetEmail);
      setUserRole(formattedRole);

      const res = await smartApiRequest('get', `/notifications?email=${encodeURIComponent(targetEmail)}&role=${encodeURIComponent(formattedRole)}`);
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
    const interval = setInterval(() => fetchNotifications(false), 3000);

    const chName = `notifications-screen-${Date.now()}`;
    const channel = supabase
      ?.channel?.(chName)
      ?.on?.('postgres_changes', { event: '*', schema: 'public', table: 'Notification' }, () => {
        fetchNotifications(false);
      });

    if (channel?.subscribe) {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchNotifications(false);
      });
    }

    return () => {
      clearInterval(interval);
      if (supabase && channel && supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, [route?.params?.userEmail, route?.params?.userRole]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await smartApiRequest('put', `/notifications/${id}/read`, { email: userEmail, role: userRole }).catch(() => null);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await smartApiRequest('put', '/notifications/read-all', { email: userEmail, role: userRole }).catch(() => null);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      Alert.alert('Notifications Read', 'All notifications marked as read.');
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    try {
      await smartApiRequest('delete', `/notifications/${id}?email=${encodeURIComponent(userEmail)}&role=${encodeURIComponent(userRole)}`).catch(() => null);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const target = notifications.find(n => n.id === id);
        return target && !target.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (e) {}
  };

  const handleDeepLink = (deepLink, item) => {
    if (!item.isRead) handleMarkAsRead(item.id);
    if (!navigation) return;

    const r = (userRole || 'STUDENT').toUpperCase();
    if (r === 'SECURITY') {
      if (deepLink === 'cctv' || item.category === 'CCTV' || item.category === 'GATE') {
        navigation.navigate('CCTV');
      } else if (deepLink === 'visitors' || item.category === 'VISITOR') {
        navigation.navigate('Visitors');
      } else if (deepLink === 'violations' || item.category === 'VIOLATION') {
        navigation.navigate('Violations');
      } else {
        navigation.navigate('Home');
      }
    } else if (r === 'ADMIN') {
      if (deepLink === 'ManageZones' || item.category === 'CAPACITY') {
        navigation.navigate('Zones');
      } else if (deepLink === 'Analytics' || item.category === 'SYSTEM') {
        navigation.navigate('Reports');
      } else {
        navigation.navigate('Home');
      }
    } else {
      if (deepLink === 'StudentBookScreen' || item.category === 'PARKING_EXPIRY' || item.category === 'BOOKING') {
        navigation.navigate('Book');
      } else if (deepLink === 'StudentVehiclesScreen' || item.category === 'VEHICLE_ENTRY' || item.category === 'VEHICLE_EXIT') {
        navigation.navigate('Vehicles');
      } else if (deepLink === 'StudentPassScreen' || item.category === 'PASS') {
        navigation.navigate('Pass');
      } else if (deepLink === 'Emergency' || item.category === 'EMERGENCY') {
        Alert.alert('🚨 Emergency Alert', item.message);
      } else {
        navigation.navigate('Home');
      }
    }
  };

  const getRoleTabs = () => {
    const r = (userRole || 'STUDENT').toUpperCase();
    if (r === 'STUDENT' || r === 'FACULTY') {
      return [
        { key: 'ALL', label: 'All' },
        { key: 'UNREAD', label: `Unread (${unreadCount})` },
        { key: 'BOOKINGS', label: 'Bookings & Expiry' },
        { key: 'VEHICLES', label: 'Vehicles & Pass' },
        { key: 'ANNOUNCEMENT', label: 'News' }
      ];
    } else if (r === 'SECURITY') {
      return [
        { key: 'ALL', label: 'All' },
        { key: 'UNREAD', label: `Unread (${unreadCount})` },
        { key: 'GATE', label: 'Gate & CCTV' },
        { key: 'VIOLATIONS', label: 'Violations' },
        { key: 'VISITORS', label: 'Visitors' },
        { key: 'EMERGENCY', label: 'Alerts' }
      ];
    } else {
      return [
        { key: 'ALL', label: 'All' },
        { key: 'UNREAD', label: `Unread (${unreadCount})` },
        { key: 'CAPACITY', label: 'Capacity' },
        { key: 'SYSTEM', label: 'System Health' },
        { key: 'ANNOUNCEMENT', label: 'Broadcasts' }
      ];
    }
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.isRead;
    if (activeTab === 'BOOKINGS') return n.category === 'PARKING_EXPIRY' || n.category === 'PARKING_EXPIRED' || n.category === 'BOOKING';
    if (activeTab === 'VEHICLES') return n.category === 'VEHICLE_ENTRY' || n.category === 'VEHICLE_EXIT' || n.category === 'PASS';
    if (activeTab === 'GATE') return n.category === 'GATE' || n.category === 'GATE_ALERT' || n.category === 'SECURITY' || n.category === 'CCTV';
    if (activeTab === 'VIOLATIONS') return n.category === 'VIOLATION';
    if (activeTab === 'VISITORS') return n.category === 'VISITOR';
    if (activeTab === 'CAPACITY') return n.category === 'CAPACITY' || n.category === 'PARKING';
    if (activeTab === 'SYSTEM') return n.category === 'SYSTEM' || n.category === 'AUDIT' || n.category === 'ANALYTICS';
    if (activeTab === 'EMERGENCY') return n.category === 'EMERGENCY' || n.priority === 'CRITICAL';
    if (activeTab === 'ANNOUNCEMENT') return n.category === 'ANNOUNCEMENT' || n.category === 'EMERGENCY';
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
      case 'BOOKING': return { name: 'calendar', color: '#4F46E5', bg: '#EEF2FF' };
      case 'VEHICLE_ENTRY':
      case 'VEHICLE_EXIT': return { name: 'truck', color: '#059669', bg: '#D1FAE5' };
      case 'PASS': return { name: 'credit-card', color: '#059669', bg: '#D1FAE5' };
      case 'SECURITY':
      case 'VIOLATION':
      case 'GATE_ALERT': return { name: 'shield-off', color: '#DC2626', bg: '#FEE2E2' };
      case 'CCTV':
      case 'GATE': return { name: 'video', color: '#2563EB', bg: '#DBEAFE' };
      case 'VISITOR': return { name: 'users', color: '#F59E0B', bg: '#FEF3C7' };
      case 'CAPACITY':
      case 'PARKING': return { name: 'activity', color: '#8B5CF6', bg: '#EDE9FE' };
      case 'SYSTEM':
      case 'AUDIT':
      case 'ANALYTICS': return { name: 'server', color: '#0284C7', bg: '#E0F2FE' };
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
          {getRoleTabs().map(tab => (
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
          notifications.length > 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 20 }}>
              <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Feather name="bell" size={32} color={COLORS.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>No "{activeTab}" Notifications</Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
                You have {notifications.length} notification{notifications.length > 1 ? 's' : ''} in other tabs.
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab('ALL')}
                style={{ backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>View All ({notifications.length})</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 20 }}>
              <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Feather name="bell-off" size={32} color="#94A3B8" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>No Notifications</Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 }}>
                All your active parking expiries, gate scans, and security announcements will show up here in real time.
              </Text>
            </View>
          )
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
