import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function UserManagementScreen({ navigation }) {
  const users = [
    { name: 'Alex Carter', email: 'alex@college.edu', role: 'Student', initial: 'A' },
    { name: 'Dr. Smith', email: 'smith@college.edu', role: 'Faculty', initial: 'D' },
    { name: 'John Doe', email: 'john@college.edu', role: 'Student', initial: 'J' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, flex: 1 }}>ParkNex AI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity style={{ position: 'relative' }}>
            <Feather name="bell" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={{ width: 1, height: 24, backgroundColor: COLORS.border }} />
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>A</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, width: '60%' }}>User{'\n'}Management</Text>
          <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="user-plus" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 14 }}>Add{'\n'}User</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar Container */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, height: 50 }}>
              <Feather name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 12 }} />
              <TextInput 
                placeholder="Search users by n..."
                placeholderTextColor={COLORS.textMuted}
                style={{ flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' }}
              />
            </View>
            <TouchableOpacity style={{ backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', height: 50, flexDirection: 'row' }}>
              <Feather name="filter" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
              <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 15 }}>Filters</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Table Mock */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border }}>
          
          {/* Table Header */}
          <View style={{ flexDirection: 'row', padding: 20, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ flex: 2, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>User</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Role</Text>
          </View>

          {/* Table Rows */}
          {users.map((user, index) => (
            <View key={index} style={{ flexDirection: 'row', padding: 20, borderBottomWidth: index === users.length - 1 ? 0 : 1, borderBottomColor: COLORS.border, alignItems: 'center' }}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>{user.initial}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>{user.name}</Text>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '500' }}>{user.email}</Text>
                </View>
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textMuted }}>{user.role}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
