import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../supabaseClient';
import { COLORS } from '../../theme/colors';
import { globalStyles as styles } from '../../theme/styles';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: role }
          }
        });
        if (error) throw error;
        Alert.alert('Success', 'Registration successful! You can now sign in.');
        setIsLogin(true);
      }
    } catch (err) {
      Alert.alert('Authentication Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ padding: 24, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 32, marginBottom: 24 }}>
            <Ionicons name="car-sport" size={64} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 36, fontWeight: '900', color: COLORS.text, marginBottom: 8, letterSpacing: -1 }}>ParkNex-AI</Text>
          <Text style={{ fontSize: 16, color: COLORS.textMuted, textAlign: 'center' }}>
            {isLogin ? 'Sign in to access your dashboard' : 'Create an account to get started'}
          </Text>
        </View>

        <View style={{ width: '100%', gap: 20 }}>
          <View>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {!isLogin && (
            <View>
              <Text style={styles.inputLabel}>Select Your Role</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                {['STUDENT', 'SECURITY', 'ADMIN'].map(r => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    style={[
                      { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
                      role === r && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                    ]}
                  >
                    <Text style={[
                      { fontWeight: '800', fontSize: 12, color: COLORS.textMuted },
                      role === r && { color: COLORS.white }
                    ]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, { height: 56, marginTop: 10 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setIsLogin(!isLogin)}>
            <Text style={{ textAlign: 'center', color: COLORS.primary, fontWeight: '700', fontSize: 15 }}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
