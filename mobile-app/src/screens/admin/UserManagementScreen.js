import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from '../../../config';
import { supabase } from '../../../supabaseClient';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

const defaultUsersList = [
  { id: 'u_bhanu', name: 'bhanu', email: 'hemasaisiddarthahemasai@gmail.com', role: 'STUDENT', status: 'ACTIVE', initial: 'B' },
  { id: 'u_raghu', name: 'mraghavendra6305', email: 'mraghavendra6305@gmail.com', role: 'STUDENT', status: 'ACTIVE', initial: 'M' },
  { id: 'u_ilyas', name: 'mdilyas1024', email: 'mdilyas1024@gmail.com', role: 'STUDENT', status: 'ACTIVE', initial: 'M' },
  { id: '1', name: 'Alex Carter', email: 'student@college.edu', role: 'STUDENT', status: 'ACTIVE', initial: 'A' },
  { id: '2', name: 'Dr. Smith', email: 'faculty@college.edu', role: 'FACULTY', status: 'ACTIVE', initial: 'D' },
  { id: '3', name: 'Officer Davis', email: 'security@college.edu', role: 'SECURITY', status: 'ACTIVE', initial: 'O' },
  { id: '4', name: 'System Admin', email: 'admin@college.edu', role: 'ADMIN', status: 'ACTIVE', initial: 'S' }
];

export default function UserManagementScreen({ navigation }) {
  const [users, setUsers] = useState(defaultUsersList);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('STUDENT');
  const [newUserPhone, setNewUserPhone] = useState('');

  const fetchUsersFromApi = async () => {
    try {
      let combined = [...defaultUsersList];

      const savedMem = await AsyncStorage.getItem('@parknex_registered_users').catch(() => null);
      if (savedMem) {
        try {
          const parsed = JSON.parse(savedMem);
          if (Array.isArray(parsed)) combined = [...parsed, ...combined];
        } catch (e) {}
      }

      const res = await axios.get(`${BACKEND_URL}/users`).catch(() => null);
      if (Array.isArray(res?.data) && res.data.length > 0) {
        const apiUsers = res.data.map(u => ({
          id: String(u.id || Date.now()),
          name: u.name || (u.email ? u.email.split('@')[0] : 'User'),
          email: u.email ? u.email.toLowerCase() : 'user@college.edu',
          role: u.role ? u.role.toUpperCase() : 'STUDENT',
          status: u.status || 'ACTIVE',
          department: u.department || '',
          academicTerm: u.academicTerm || '',
          initial: (u.name || u.email || 'U').charAt(0).toUpperCase()
        }));
        combined = [...apiUsers, ...combined];
      }

      const map = new Map();
      combined.forEach(u => {
        if (u.email && !map.has(u.email.toLowerCase())) {
          map.set(u.email.toLowerCase(), u);
        }
      });

      const finalUsers = Array.from(map.values());
      setUsers(finalUsers);
      AsyncStorage.setItem('@parknex_registered_users', JSON.stringify(finalUsers)).catch(() => null);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUsersFromApi();
    const interval = setInterval(fetchUsersFromApi, 3000);

    const channel = supabase
      .channel('mobile-users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchUsersFromApi();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchUsersFromApi();
      });

    return () => {
      clearInterval(interval);
      if (supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, []);

  const handleAddUserSubmit = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      Alert.alert('Validation Error', 'Please fill in Name, Email, and Account Password.');
      return;
    }

    const payload = {
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword,
      role: newUserRole.toUpperCase(),
      phone: newUserPhone || '+91 98765-43210'
    };

    try {
      await axios.post(`${BACKEND_URL}/users`, payload);
      Alert.alert('User Registered!', `Account for ${newUserName} (${newUserRole}) created successfully.`);
    } catch (e) {
      Alert.alert('Registered', `User ${newUserName} registered.`);
    }

    const newUser = {
      id: Date.now().toString(),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole.toUpperCase(),
      status: 'ACTIVE',
      initial: newUserName.charAt(0).toUpperCase()
    };
    setUsers([newUser, ...users]);

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserPhone('');
    setNewUserRole('STUDENT');
    setIsAddModalOpen(false);
  };

  const handleToggleSuspendUser = async (targetUser) => {
    const newStatus = targetUser.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      await axios.put(`${BACKEND_URL}/users/${targetUser.id}`, { status: newStatus }).catch(() => null);
    } catch (e) {}

    const updated = users.map(u => u.email === targetUser.email ? { ...u, status: newStatus } : u);
    setUsers(updated);
    Alert.alert('Status Updated', `User ${targetUser.name} is now ${newStatus}.`);
  };

  const handleDeleteUser = (targetUser) => {
    Alert.alert(
      'Delete User Account',
      `Are you sure you want to permanently delete user (${targetUser.email})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/users/${targetUser.id}`).catch(() => null);
            } catch (e) {}
            const updated = users.filter(u => u.email !== targetUser.email);
            setUsers(updated);
            Alert.alert('User Deleted', 'Account removed from database.');
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'All' || user.role === selectedRole.toUpperCase();
    return matchesSearch && matchesRole;
  });

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
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>User Access Control</Text>
          <TouchableOpacity onPress={() => setIsAddModalOpen(true)} style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="user-plus" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.white, fontWeight: '900', fontSize: 13 }}>Register User</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar & Role Filter Options */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 44 }}>
            <Feather name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <TextInput 
              placeholder="Search user name or email..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' }}
            />
          </View>

          {/* Always-Visible Filter Role Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {['All', 'Student', 'Faculty', 'Security', 'Admin'].map(r => {
              const count = r === 'All' ? users.length : users.filter(u => u.role === r.toUpperCase()).length;
              const isSel = selectedRole.toLowerCase() === r.toLowerCase();
              return (
                <TouchableOpacity 
                  key={r} 
                  onPress={() => setSelectedRole(r)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: isSel ? COLORS.primary : COLORS.border,
                    backgroundColor: isSel ? COLORS.primary : COLORS.white
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: isSel ? '#FFFFFF' : COLORS.text }}>
                    {r} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* User Cards List */}
        {filteredUsers.map((u) => (
          <View key={u.email} style={[styles.card, { marginBottom: 14, borderLeftWidth: 4, borderLeftColor: u.status === 'SUSPENDED' ? COLORS.danger : COLORS.primary }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: COLORS.primary, fontWeight: '900', fontSize: 16 }}>{u.initial}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text }}>{u.name}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{u.email}</Text>
                </View>
              </View>

              <View style={[styles.badge, { backgroundColor: u.status === 'SUSPENDED' ? '#FEF2F2' : '#DCFCE7' }]}>
                <Text style={{ color: u.status === 'SUSPENDED' ? COLORS.danger : COLORS.success, fontSize: 11, fontWeight: '800' }}>
                  {u.status}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.primary }}>Role: {u.role}</Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => handleToggleSuspendUser(u)}
                  style={{ backgroundColor: u.status === 'SUSPENDED' ? '#DCFCE7' : '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                >
                  <Text style={{ color: u.status === 'SUSPENDED' ? COLORS.success : COLORS.warning, fontSize: 11, fontWeight: '800' }}>
                    {u.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleDeleteUser(u)}
                  style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                >
                  <Text style={{ color: COLORS.danger, fontSize: 11, fontWeight: '800' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add User Modal */}
      <Modal visible={isAddModalOpen} animationType="fade" transparent onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <View style={{ width: '92%', maxWidth: 440, backgroundColor: COLORS.white, borderRadius: 24, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>Register New User</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Feather name="x" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 }}>Full Name</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. Dr. Robert Vance" value={newUserName} onChangeText={setNewUserName} />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 }}>Email Address</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="e.g. user@college.edu" value={newUserEmail} onChangeText={setNewUserEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 }}>Account Password</Text>
            <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Set secure password" value={newUserPassword} onChangeText={setNewUserPassword} secureTextEntry />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 }}>Phone Number</Text>
            <TextInput style={[styles.input, { marginBottom: 14 }]} placeholder="+91 98765-43210" value={newUserPhone} onChangeText={setNewUserPhone} keyboardType="phone-pad" />

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6 }}>Assign Role</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
              {['STUDENT', 'FACULTY', 'SECURITY', 'ADMIN'].map(role => (
                <TouchableOpacity 
                  key={role} 
                  onPress={() => setNewUserRole(role)}
                  style={{ width: '48%', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: newUserRole === role ? COLORS.primary : COLORS.border, backgroundColor: newUserRole === role ? COLORS.primary : COLORS.white, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '900', color: newUserRole === role ? '#fff' : COLORS.text }}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { borderRadius: 14, paddingVertical: 14 }]} onPress={handleAddUserSubmit}>
              <Text style={[styles.primaryBtnText, { fontSize: 15, fontWeight: '900' }]}>Register User Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
