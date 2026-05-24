import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function RoleManagementScreen({ navigation }) {
  const roles = [
    { name: 'Super Admin', manageUsers: true, viewReports: true },
    { name: 'Security Officer', manageUsers: false, viewReports: true },
    { name: 'Student', manageUsers: false, viewReports: false },
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
          <TouchableOpacity onPress={() => navigation.navigate('AdminProfile')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, flex: 1, marginRight: 16 }}>Role Management</Text>
          <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="plus" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 14 }}>Add Role</Text>
          </TouchableOpacity>
        </View>

        {/* Results Table Mock */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border }}>
          
          {/* Table Header */}
          <View style={{ flexDirection: 'row', padding: 20, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ flex: 1.5, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Role{'\n'}Name</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' }}>Manage{'\n'}Users</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' }}>View{'\n'}Reports</Text>
          </View>

          {/* Table Rows */}
          {roles.map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', padding: 20, borderBottomWidth: index === roles.length - 1 ? 0 : 1, borderBottomColor: COLORS.border, alignItems: 'center' }}>
              <Text style={{ flex: 1.5, fontSize: 15, fontWeight: '900', color: COLORS.text }}>{item.name.replace(' ', '\n')}</Text>
              
              {/* Checkboxes */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: item.manageUsers ? '#A18A75' : COLORS.border, backgroundColor: item.manageUsers ? '#A18A75' : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                  {item.manageUsers && <Feather name="check" size={16} color={COLORS.white} />}
                </View>
              </View>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: item.viewReports ? '#A18A75' : COLORS.border, backgroundColor: item.viewReports ? '#A18A75' : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                  {item.viewReports && <Feather name="check" size={16} color={COLORS.white} />}
                </View>
              </View>
              
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
