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
import config, { 
  smartApiRequest, 
  getBackendUrl, 
  setCustomBackendIp, 
  testBackendConnection, 
  CURRENT_WIFI_IP 
} from '../../../config';
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

  // Network / Server IP state
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [serverIpInput, setServerIpInput] = useState(CURRENT_WIFI_IP);
  const [networkTestStatus, setNetworkTestStatus] = useState(null); // null | 'testing' | 'success' | 'failed'
  const [networkTestMsg, setNetworkTestMsg] = useState('');
  const [activeServerDisplay, setActiveServerDisplay] = useState(getBackendUrl());

  // Forgot / Reset Password state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'sent' | 'reset'
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetCode, setResetCode] = useState('');

  const handleTestConnection = async (ipToTest) => {
    setNetworkTestStatus('testing');
    setNetworkTestMsg('Checking connection to server...');
    const target = ipToTest 
      ? (ipToTest.startsWith('http') ? ipToTest : `http://${ipToTest}:5000/api`) 
      : getBackendUrl();
    const result = await testBackendConnection(target);
    if (result.success) {
      setNetworkTestStatus('success');
      setNetworkTestMsg('Connected successfully! Server is online.');
    } else {
      setNetworkTestStatus('failed');
      setNetworkTestMsg(`Could not connect: ${result.error || 'Connection timed out'}`);
    }
  };

  const handleSaveServerIp = async () => {
    try {
      const formatted = await setCustomBackendIp(serverIpInput);
      setActiveServerDisplay(getBackendUrl());
      setNetworkTestStatus('success');
      setNetworkTestMsg(`Server target saved.`);
      Alert.alert('Server Configured', `Backend URL set to:\n${formatted || `http://${CURRENT_WIFI_IP}:5000/api`}`);
      setIsNetworkModalOpen(false);
    } catch (e) {
      Alert.alert('Configuration Error', e.message);
    }
  };

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
            setActiveServerDisplay(getBackendUrl());
            if (onLoginSuccess) {
              onLoginSuccess(res.data.user, res.data.token);
            }
            return;
          }
          Alert.alert('Authentication Failed', res.data?.error || 'Invalid email or password.');
        } catch (backendErr) {
          const isNetError = !backendErr.response || (backendErr.message && backendErr.message.toLowerCase().includes('network'));
          if (isNetError) {
            Alert.alert(
              'Network Connection Failed',
              `Unable to connect to ParkNex backend at ${getBackendUrl()}.\n\nEnsure your mobile device is connected to the same Wi-Fi network (${CURRENT_WIFI_IP}).`,
              [
                { 
                  text: 'Configure Server IP', 
                  onPress: () => { 
                    setServerIpInput(CURRENT_WIFI_IP); 
                    setNetworkTestStatus(null); 
                    setNetworkTestMsg(''); 
                    setIsNetworkModalOpen(true); 
                  } 
                },
                { text: 'OK', style: 'cancel' }
              ]
            );
          } else {
            const errorMessage = backendErr.response?.data?.error || backendErr.response?.data?.message || backendErr.message || 'Invalid email or password.';
            Alert.alert('Login Failed', errorMessage);
          }
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

        {isLogin && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <TouchableOpacity 
              onPress={() => { setEmail('mraghavendra6305@gmail.com'); setPassword('password123'); }} 
              style={{ flex: 1, backgroundColor: '#EFF6FF', paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>🎓 Student</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => { setEmail('security@college.edu'); setPassword('password123'); }} 
              style={{ flex: 1, backgroundColor: '#F0FDF4', paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#BBF7D0' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#16A34A' }}>🛡️ Security</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => { setEmail('admin@college.edu'); setPassword('password123'); }} 
              style={{ flex: 1, backgroundColor: '#F8FAFC', paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569' }}>⚙️ Admin</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={{ marginTop: 20, alignItems: 'center' }}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>

        {/* Server & Network IP Configuration Badge */}
        <TouchableOpacity
          onPress={() => {
            setNetworkTestStatus(null);
            setNetworkTestMsg('');
            setServerIpInput(CURRENT_WIFI_IP);
            setIsNetworkModalOpen(true);
          }}
          activeOpacity={0.7}
          style={{
            marginTop: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F8FAFC',
            paddingVertical: 7,
            paddingHorizontal: 14,
            borderRadius: 20,
            alignSelf: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0'
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 7 }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
            Server: {activeServerDisplay.replace('http://', '').replace('/api', '')}
          </Text>
          <Ionicons name="settings-outline" size={13} color="#64748B" style={{ marginLeft: 6 }} />
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

      {/* SERVER / NETWORK CONFIGURATION MODAL */}
      <Modal
        visible={isNetworkModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNetworkModalOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center' }}
        >
          <View style={{ 
            backgroundColor: COLORS.white, 
            borderRadius: 24, 
            paddingHorizontal: 24, 
            paddingVertical: 24, 
            width: '90%', 
            maxWidth: 380,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Ionicons name="wifi-outline" size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>Network Setup</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Backend Server IP Connection</Text>
              </View>
            </View>

            <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 14 }}>
              If your Wi-Fi network changed, enter your computer's IPv4 address below so this mobile device can reach the server.
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6 }}>
              Backend IPv4 Address or URL
            </Text>
            <TextInput
              style={[styles.input, { marginBottom: 10, fontSize: 14 }]}
              placeholder="e.g. 10.183.174.205"
              value={serverIpInput}
              onChangeText={setServerIpInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <TouchableOpacity
                onPress={() => setServerIpInput(CURRENT_WIFI_IP)}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  backgroundColor: '#EFF6FF',
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#BFDBFE'
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>
                  Use Active Wi-Fi IP
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setServerIpInput('localhost')}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  backgroundColor: '#F1F5F9',
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#CBD5E1'
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                  Localhost
                </Text>
              </TouchableOpacity>
            </View>

            {/* Test Connection Button */}
            <TouchableOpacity
              onPress={() => handleTestConnection(serverIpInput)}
              disabled={networkTestStatus === 'testing'}
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 10,
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                marginBottom: 12
              }}
            >
              {networkTestStatus === 'testing' ? (
                <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons 
                  name={networkTestStatus === 'success' ? 'checkmark-circle' : networkTestStatus === 'failed' ? 'alert-circle' : 'pulse-outline'} 
                  size={16} 
                  color={networkTestStatus === 'success' ? '#10B981' : networkTestStatus === 'failed' ? '#EF4444' : '#2563EB'} 
                  style={{ marginRight: 6 }} 
                />
              )}
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '700', 
                color: networkTestStatus === 'success' ? '#10B981' : networkTestStatus === 'failed' ? '#EF4444' : '#2563EB' 
              }}>
                {networkTestStatus === 'testing' ? 'Testing Connection...' : 'Test Server Connectivity'}
              </Text>
            </TouchableOpacity>

            {networkTestMsg ? (
              <Text style={{ 
                fontSize: 11, 
                fontWeight: '600', 
                marginBottom: 12, 
                textAlign: 'center',
                color: networkTestStatus === 'success' ? '#10B981' : '#EF4444'
              }}>
                {networkTestMsg}
              </Text>
            ) : null}

            {/* Save & Apply Button */}
            <TouchableOpacity
              onPress={handleSaveServerIp}
              style={[styles.primaryBtn, { paddingVertical: 12, borderRadius: 12, marginBottom: 8 }]}
            >
              <Text style={styles.primaryBtnText}>Save & Connect</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsNetworkModalOpen(false)}
              style={{ paddingVertical: 8, alignItems: 'center' }}
            >
              <Text style={{ color: COLORS.textMuted, fontWeight: '700', fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
