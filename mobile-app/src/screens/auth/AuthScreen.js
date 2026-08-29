import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert, 
  Image, 
  Modal, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import config, { smartApiRequest } from '../../../config';
import { supabase } from '../../../supabaseClient';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const BACKEND_URL = config.BACKEND_URL;

export default function AuthScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('STUDENT');

  // Forgot / Reset Password state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'sent' | 'reset'
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetCode, setResetCode] = useState('');

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter email address and password.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Backend REST Auth (JWT) with Smart Auto-Failover
        try {
          const res = await smartApiRequest('post', '/auth/login', {
            email: email.trim(),
            password: password.trim()
          });

          if (res.data?.success && res.data?.user) {
            if (onLoginSuccess) {
              onLoginSuccess(res.data.user, res.data.token);
            }
            return;
          }
          Alert.alert('Authentication Failed', res.data?.error || 'Invalid email or password.');
        } catch (backendErr) {
          const errorMessage = backendErr.response?.data?.error || backendErr.response?.data?.message || backendErr.message || 'Invalid email or password.';
          Alert.alert('Login Failed', errorMessage);
        }
      } else {
        // Register flow
        try {
          const res = await smartApiRequest('post', '/auth/register', {
            email: email.trim(),
            password: password.trim(),
            role,
            name: email.split('@')[0]
          });

          if (res.data?.success && res.data?.user) {
            Alert.alert('Success', 'Account created successfully!');
            if (onLoginSuccess) {
              onLoginSuccess(res.data.user, res.data.token);
            }
            return;
          }
          Alert.alert('Registration Failed', res.data?.error || 'Registration failed.');
        } catch (e) {
          Alert.alert('Registration Error', e.response?.data?.error || e.message || 'Registration failed. Password must be at least 8 characters long.');
        }
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Authentication failed. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid registered email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await smartApiRequest('post', '/auth/forgot-password', {
        email: forgotEmail.trim()
      });

      if (res.data?.success) {
        const token = res.data.resetToken || res.data._devResetToken || '';
        const code = res.data.resetCode || res.data._devResetCode || '';

        setResetToken(token);
        setResetCode(code);

        Alert.alert('Reset Code Sent 🔑', `Verification code generated (${code || 'Sent'}). Enter your new password to complete reset.`);
        setResetStep('reset');
      } else {
        Alert.alert('Error', res.data?.error || 'Failed to request password reset.');
      }
    } catch (e) {
      if (e.response?.status === 429) {
        Alert.alert('Rate Limit Exceeded', 'A reset request was recently sent. Please wait 60 seconds before requesting another code.');
      } else {
        Alert.alert('Error', e.response?.data?.error || e.message || 'Failed to reach server. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePasswordReset = async () => {
    if (!newPassword.trim() || newPassword.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await smartApiRequest('post', '/auth/confirm-reset-password', {
        email: forgotEmail.trim(),
        resetToken,
        resetCode,
        newPassword: newPassword.trim()
      });

      if (res.data?.success) {
        Alert.alert('Password Reset Complete! 🎉', 'Your password has been updated in database and old sessions invalidated. Only your NEW password will work now.');
        setIsForgotModalOpen(false);
        setEmail(forgotEmail.trim());
        setPassword(newPassword.trim());
        setResetStep('request');
      } else {
        Alert.alert('Error', res.data?.error || 'Invalid or expired password reset token.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || e.response?.data?.message || e.message || 'Password reset failed. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bg, justifyContent: 'center' }]}>
      <View style={{ paddingHorizontal: 28 }}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Image 
            source={require('../../../assets/icon.png')}
            style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 12 }} 
          />
          <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 }}>ParkNex-AI</Text>
          <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' }}>Saveetha University Parking Portal</Text>
        </View>

        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@college.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text }}>Password</Text>
            {isLogin && (
              <TouchableOpacity onPress={() => { setForgotEmail(email); setResetStep('request'); setIsForgotModalOpen(true); }}>
                <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 12 }}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ position: 'relative', justifyContent: 'center' }}>
            <TextInput
              style={[styles.input, { paddingRight: 48 }]}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={{ position: 'absolute', right: 14, height: '100%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }} 
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {!isLogin && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Select Campus Role</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['STUDENT', 'FACULTY', 'SECURITY', 'ADMIN'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.badge, { backgroundColor: role === r ? COLORS.primary : COLORS.surface, paddingHorizontal: 10, paddingVertical: 8, flex: 1, alignItems: 'center' }]}
                  onPress={() => setRole(r)}
                >
                  <Text style={{ color: role === r ? '#fff' : COLORS.text, fontSize: 10, fontWeight: '800' }}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, { marginTop: 8 }]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>{isLogin ? 'Sign In to Portal' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 20, alignItems: 'center' }}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FORGOT & RESET PASSWORD MODAL WITH KEYBOARD AVOIDANCE & PADDING */}
      <Modal
        visible={isForgotModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsForgotModalOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center' }}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, width: '100%' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ 
              backgroundColor: COLORS.white, 
              borderRadius: 28, 
              paddingHorizontal: 24, 
              paddingVertical: 26, 
              width: '100%', 
              maxWidth: 400,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 15
            }}>
              
              {resetStep === 'request' && (
                <>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 6 }}>Reset Password</Text>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: 20, lineHeight: 18 }}>
                    Enter your registered campus email address to generate a secure password reset token.
                  </Text>

                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Registered Email</Text>
                  <TextInput
                    style={[styles.input, { marginBottom: 22 }]}
                    placeholder="you@college.edu"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity style={[styles.primaryBtn, { paddingVertical: 14, borderRadius: 14 }]} onPress={handleForgotPassword} disabled={loading}>
                    <Text style={styles.primaryBtnText}>{loading ? 'Generating Code...' : 'Send Reset Code'}</Text>
                  </TouchableOpacity>
                </>
              )}

              {resetStep === 'sent' && (
                <>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.primary, marginBottom: 6 }}>
                    📬 Official Reset Code Sent!
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16, lineHeight: 18 }}>
                    Password reset code generated for <Text style={{ fontWeight: '800', color: COLORS.text }}>{forgotEmail}</Text>.
                  </Text>

                  <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                      <MaterialCommunityIcons name="shield-check" size={22} color={COLORS.primary} />
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#0F172A' }}>Saveetha University Security</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textMuted }}>noreply@parknex.saveetha.edu</Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#1E293B', marginBottom: 6 }}>
                      Subject: 🔒 Reset Your ParkNex-AI Password
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 14 }}>
                      Hello {forgotEmail.split('@')[0] || 'User'},{'\n'}
                      We received a request to reset your password. Tap the button below to enter your new password:
                    </Text>

                    <TouchableOpacity 
                      onPress={() => setResetStep('reset')}
                      style={{ backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 10 }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>Reset Password Now →</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={[styles.primaryBtn, { paddingVertical: 14, borderRadius: 14 }]} onPress={() => setResetStep('reset')}>
                    <Text style={styles.primaryBtnText}>Proceed to Set New Password</Text>
                  </TouchableOpacity>
                </>
              )}

              {resetStep === 'reset' && (
                <>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 6 }}>Set New Password</Text>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: 20, lineHeight: 18 }}>
                    Create a new password for <Text style={{ fontWeight: '800', color: COLORS.text }}>{forgotEmail}</Text>.
                  </Text>

                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>New Password</Text>
                  <TextInput
                    style={[styles.input, { marginBottom: 14 }]}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />

                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>Confirm New Password</Text>
                  <TextInput
                    style={[styles.input, { marginBottom: 22 }]}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />

                  <TouchableOpacity style={[styles.primaryBtn, { paddingVertical: 14, borderRadius: 14 }]} onPress={handleCompletePasswordReset} disabled={loading}>
                    <Text style={styles.primaryBtnText}>{loading ? 'Updating Password...' : 'Update Password & Sign In'}</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={() => setIsForgotModalOpen(false)} style={{ marginTop: 16, paddingVertical: 8, alignItems: 'center' }}>
                <Text style={{ color: COLORS.textMuted, fontWeight: '700', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
