import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

export default function AuthorizedVehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([
    { plate: 'KA-01-AB-1234', owner: 'Alex Carter', type: '4-Wheeler' },
    { plate: 'MH-12-XY-9090', owner: 'Dr. Smith', type: '4-Wheeler' },
    { plate: 'DL-04-CZ-1111', owner: 'John Doe', type: '2-Wheeler' },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newType, setNewType] = useState('4-Wheeler');

  const handleAddVehicleSubmit = () => {
    if (!newPlate.trim() || !newOwner.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    // Basic format validator
    const formattedPlate = newPlate.trim().toUpperCase();
    const newVehicle = {
      plate: formattedPlate,
      owner: newOwner.trim(),
      type: newType
    };
    setVehicles([...vehicles, newVehicle]);
    setNewPlate('');
    setNewOwner('');
    setNewType('4-Wheeler');
    setIsAddModalOpen(false);
    Alert.alert('Success', 'Vehicle added successfully.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 8 }}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, flex: 1 }}>ParkNex AI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={() => navigation.navigate('SystemActivity')} style={{ position: 'relative' }}>
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
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text, width: '55%' }}>Authorized{'\n'}Vehicles</Text>
          <TouchableOpacity onPress={() => setIsAddModalOpen(true)} style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="plus" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 14 }}>Add{'\n'}Vehicle</Text>
          </TouchableOpacity>
        </View>

        {/* Results Table */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border }}>
          
          {/* Table Header */}
          <View style={{ flexDirection: 'row', padding: 20, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            <Text style={{ flex: 1.2, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Plate Number</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Owner</Text>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textMuted }}>Type</Text>
          </View>

          {/* Table Rows */}
          {vehicles.map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', padding: 20, borderBottomWidth: index === vehicles.length - 1 ? 0 : 1, borderBottomColor: COLORS.border, alignItems: 'center' }}>
              <View style={{ flex: 1.2 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.text }}>{item.plate.includes('-') ? `${item.plate.split('-')[0]}-${item.plate.split('-')[1]}-` : item.plate}</Text>
                {item.plate.includes('-') && (
                  <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.text }}>{item.plate.split('-')[2]}</Text>
                )}
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text }}>{item.owner.replace(' ', '\n')}</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textMuted }}>{item.type}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24, zIndex: 100 }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>Add Vehicle</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Feather name="x" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16, marginBottom: 24 }}>
              <View>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '700', marginBottom: 8 }}>Plate Number</Text>
                <TextInput 
                  placeholder="e.g. KA-01-AB-1234"
                  autoCapitalize="characters"
                  value={newPlate}
                  onChangeText={setNewPlate}
                  style={{ width: '100%', padding: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, fontSize: 15 }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '700', marginBottom: 8 }}>Owner Name</Text>
                <TextInput 
                  placeholder="e.g. Alex Carter"
                  value={newOwner}
                  onChangeText={setNewOwner}
                  style={{ width: '100%', padding: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, fontSize: 15 }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '700', marginBottom: 8 }}>Vehicle Type</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {['4-Wheeler', '2-Wheeler'].map(type => (
                    <TouchableOpacity 
                      key={type} 
                      onPress={() => setNewType(type)}
                      style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: newType === type ? COLORS.primary : COLORS.border, backgroundColor: newType === type ? 'rgba(37,99,235,0.05)' : COLORS.white, alignItems: 'center' }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: newType === type ? COLORS.primary : COLORS.text }}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' }}>
                <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddVehicleSubmit} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' }}>
                <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 14 }}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      )}

    </SafeAreaView>
  );
}
