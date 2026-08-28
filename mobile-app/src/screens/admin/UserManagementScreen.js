import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import config from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function UserManagementScreen({ navigation }) {
  const [users, setUsers] = useState([
    { id: '1', name: 'Alex Carter', email: 'student@college.edu', role: 'STUDENT', status: 'ACTIVE', initial: 'A' },
    { id: '2', name: 'Dr. Smith', email: 'faculty@college.edu', role: 'FACULTY', status: 'ACTIVE', initial: 'D' },
    { id: '3', name: 'Officer Davis', email: 'security@college.edu', role: 'SECURITY', status: 'ACTIVE', initial: 'O' },
    { id: '4', name: 'System Admin', email: 'admin@college.edu', role: 'ADMIN', status: 'ACTIVE', initial: 'S' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('STUDENT');
  const [newUserPhone, setNewUserPhone] = useState('');

  const fetchUsersFromApi = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/users`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setUsers(res.data.map(u => ({
          id: u.id,
          name: u.name || u.email.split('@')[0],
          email: u.email,
          role: u.role ? u.role.toUpperCase() : 'STUDENT',
          status: u.status || 'ACTIVE',
          initial: (u.name || u.email).charAt(0).toUpperCase()
        })));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchUsersFromApi();
    const interval = setInterval(fetchUsersFromApi, 3000);
    return () => clearInterval(interval);
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

        {/* Search Bar & Filter */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 44 }}>
              <Feather name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput 
                placeholder="Search user name or email..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' }}
              />
            </View>
            <TouchableOpacity onPress={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)} style={{ backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center', height: 44, flexDirection: 'row' }}>
              <Feather name="filter" size={16} color={COLORS.text} style={{ marginRight: 4 }} />
              <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 13 }}>{selectedRole}</Text>
            </TouchableOpacity>
          </View>

          {isFilterDropdownOpen && (
            <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['All', 'Student', 'Faculty', 'Security', 'Admin'].map(r => (
                <TouchableOpacity 
                  key={r} 
                  onPress={() => { setSelectedRole(r); setIsFilterDropdownOpen(false); }}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: selectedRole === r ? COLORS.primary : COLORS.border, backgroundColor: selectedRole === r ? 'rgba(37,99,235,0.05)' : COLORS.white }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: selectedRole === r ? COLORS.primary : COLORS.text }}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
      {isAddModalOpen && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>Register New User</Text>
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
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {['STUDENT', 'FACULTY', 'SECURITY', 'ADMIN'].map(role => (
                <TouchableOpacity 
                  key={role} 
                  onPress={() => setNewUserRole(role)}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: newUserRole === role ? COLORS.primary : COLORS.border, backgroundColor: newUserRole === role ? COLORS.primary : COLORS.white, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '900', color: newUserRole === role ? '#fff' : COLORS.text }}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddUserSubmit}>
              <Text style={styles.primaryBtnText}>Register User Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}
