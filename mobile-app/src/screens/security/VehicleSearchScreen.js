import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function VehicleSearchScreen({ navigation }) {
  const data = [
    { plate: 'KA-01-AB-1234', owner: 'Alex Carter', type: 'Student' },
    { plate: 'MH-12-XY-9090', owner: 'Dr. Smith', type: 'Faculty' },
    { plate: 'DL-04-CZ-1111', owner: 'Unknown', type: 'Visitor' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F1F5F9' }]}>
      
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
          <TouchableOpacity onPress={() => navigation.navigate('OfficerProfile')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(37, 99, 235, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>S</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text }}>Vehicle Search</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white }}>
            <Feather name="filter" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 13 }}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar Container */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, height: 56 }}>
              <Feather name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 12 }} />
              <TextInput 
                placeholder="Search by plate numb..."
                placeholderTextColor={COLORS.textMuted}
                style={{ flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '500' }}
              />
            </View>
            <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 16, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', height: 56 }}>
              <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 16 }}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Table Mock */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border }}>
          
          {/* Table Header */}
          <View style={{ flexDirection: 'row', padding: 20, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ flex: 1.2, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Plate Number</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Owner</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Type</Text>
          </View>

          {/* Table Rows */}
          {data.map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', padding: 20, borderBottomWidth: index === data.length - 1 ? 0 : 1, borderBottomColor: COLORS.border, alignItems: 'center' }}>
              <View style={{ flex: 1.2 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.text }}>{item.plate.split('-')[0]}-{item.plate.split('-')[1]}-</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.text }}>{item.plate.split('-')[2]}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text }}>{item.owner}</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textMuted }}>{item.type}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
