import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function StudentProfileScreen({ onLogout }) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFBFF' }]}>
      <View style={[styles.header, { paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.greeting, { fontSize: 24 }]}>Edit Profile</Text>
        <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 13 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        
        {/* Profile Picture */}
        <View style={{ marginBottom: 40, marginTop: 10 }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <Feather name="user" size={60} color={COLORS.textMuted} />
            {/* Real app would use Image component here */}
          </View>
          <TouchableOpacity style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white }}>
            <Feather name="camera" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={{ width: '100%', gap: 20, marginBottom: 40 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>Full Name</Text>
            <TextInput
              style={{ backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, fontSize: 16, fontWeight: '500' }}
              defaultValue="Alex Carter"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>Email Address</Text>
            <TextInput
              style={{ backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, fontSize: 16, fontWeight: '500' }}
              defaultValue="alex.c@college.edu"
              keyboardType="email-address"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>Phone Number</Text>
            <TextInput
              style={{ backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, fontSize: 16, fontWeight: '500' }}
              defaultValue="+1 (555) 123-4567"
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>College ID</Text>
            <TextInput
              style={{ backgroundColor: COLORS.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, fontSize: 16, fontWeight: '500' }}
              defaultValue="STU-2024-123"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, { width: '100%', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 4 }]}>
          <Text style={styles.primaryBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
