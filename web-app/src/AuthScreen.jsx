import React, { useState, useEffect } from 'react';
import { 
  CarFront, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Lock, 
  Mail, 
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabaseClient';

const BACKEND_URL = 'http://localhost:5000/api';

export default function AuthScreen({ onLogin, initialMode = 'login' }) {
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'signup' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('STUDENT');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isRecoverySessionActive, setIsRecoverySessionActive] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetCode, setResetCode] = useState('');

  // Check URL pathname or hash for password recovery
  useEffect(() => {
    const checkPathAndHash = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;

      if (pathname.includes('reset-password') || hash.includes('type=recovery')) {
        setAuthMode('reset');
        setIsRecoverySessionActive(true);
      } else if (pathname.includes('forgot-password')) {
        setAuthMode('forgot');
      }
    };

    checkPathAndHash();

    // Listen for Supabase password recovery auth event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset');
        setIsRecoverySessionActive(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigateTo = (mode, path) => {
    setAuthMode(mode);
    setAuthError('');
    setAuthSuccess('');
    if (window.history && path) {
      window.history.pushState({}, '', path);
    }
  };

  const handleLoginOrSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      if (authMode === 'login') {
        // 1. Backend JWT Login
        try {
          const res = await axios.post(`${BACKEND_URL}/auth/login`, { email: email.trim(), password: password.trim() });
          if (res.data?.success && res.data.user) {
            localStorage.setItem('parknex_token', res.data.token);
            localStorage.setItem('parknex_user', JSON.stringify(res.data.user));
            onLogin(res.data.user.role, res.data.user);
            return;
          }
          setAuthError(res.data?.error || 'Invalid email or password.');
          return;
        } catch (backendErr) {
          const errorMessage = backendErr.response?.data?.error || backendErr.response?.data?.message || 'Invalid email or password.';
          setAuthError(errorMessage);
          localStorage.removeItem('parknex_token');
          localStorage.removeItem('parknex_user');
          return;
        }
      } else {
        // Backend JWT Register
        try {
          const res = await axios.post(`${BACKEND_URL}/auth/register`, { email: email.trim(), password: password.trim(), role, name: name.trim() });
          if (res.data?.success) {
            localStorage.setItem('parknex_token', res.data.token);
            localStorage.setItem('parknex_user', JSON.stringify(res.data.user));
            onLogin(res.data.user.role, res.data.user);
            return;
          }
          setAuthError(res.data?.error || 'Registration failed.');
          return;
        } catch (regErr) {
          setAuthError(regErr.response?.data?.error || 'Registration failed. Password must be at least 8 characters long.');
          return;
        }
      }
    } catch (err) {
      setAuthError('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid college email address.');
      return;
    }

    setLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await axios.post(`${BACKEND_URL}/auth/forgot-password`, { email: email.trim() });
      if (res.data?.success) {
        if (res.data.resetToken) setResetToken(res.data.resetToken);
        if (res.data.resetCode) setResetCode(res.data.resetCode);

        setAuthSuccess(`Password reset code generated (${res.data.resetCode || 'Verification Code Sent'}). Proceed to set your new password.`);
        setTimeout(() => {
          setAuthMode('reset');
        }, 1200);
      } else {
        setAuthError(res.data?.error || 'Failed to process password reset request.');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setAuthError('A reset code was recently generated. Please wait 60 seconds before requesting another code.');
      } else {
        setAuthError('Failed to process password reset request. Please check server connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (newPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${BACKEND_URL}/auth/confirm-reset-password`, {
        email: email.trim(),
        resetToken,
        resetCode,
        newPassword
      });

      if (res.data?.success) {
        setAuthSuccess('Your password has been successfully updated! Invalidating old sessions and redirecting to login...');
        setTimeout(() => {
          navigateTo('login', '/');
        }, 2000);
      } else {
        setAuthError(res.data?.error || 'Invalid or expired password reset token.');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Password reset failed. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '3rem', borderRadius: '28px', border: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.8)' }}>
        
        {/* LOGO HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1.25rem', background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)', borderRadius: '24px', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}>
            <CarFront size={48} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '900', letterSpacing: '-1px', background: 'linear-gradient(to right, #0f172a, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ParkNex-AI
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
            {authMode === 'login' && 'Sign in to access your campus dashboard'}
            {authMode === 'signup' && 'Create an account to get started'}
            {authMode === 'forgot' && 'Reset your campus portal password'}
            {authMode === 'reset' && 'Create a new secure password'}
          </p>
        </div>

        {/* NOTIFICATIONS */}
        {authError && (
          <div className="animate-fade-in" style={{ padding: '0.8rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} />
              <span>{authError}</span>
            </div>
          </div>
        )}

        {authSuccess && (
          <div className="animate-fade-in" style={{ padding: '0.8rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} />
              <span>{authSuccess}</span>
            </div>
          </div>
        )}

        {/* 1. LOGIN & SIGNUP FORMS */}
        {(authMode === 'login' || authMode === 'signup') && (
          <form onSubmit={handleLoginOrSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {authMode === 'signup' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem' }}
                  placeholder="e.g. Alex Carter"
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '1rem' }}
                placeholder="you@college.edu"
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Password</label>
                {authMode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => navigateTo('forgot', '/forgot-password')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem', paddingRight: '2.5rem' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {authMode === 'signup' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select Role</label>
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem', cursor: 'pointer', color: 'var(--text-main)', backgroundColor: 'var(--bg-sidebar)' }}
                >
                  <option value="STUDENT" style={{ backgroundColor: 'var(--bg-sidebar)' }}>Student</option>
                  <option value="SECURITY" style={{ backgroundColor: 'var(--bg-sidebar)' }}>Security Officer</option>
                  <option value="ADMIN" style={{ backgroundColor: 'var(--bg-sidebar)' }}>Campus Administrator</option>
                </select>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.9rem', fontSize: '0.95rem', fontWeight: '800' }}
            >
              {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button 
                type="button"
                onClick={() => {
                  navigateTo(authMode === 'login' ? 'signup' : 'login', authMode === 'login' ? '/signup' : '/');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </form>
        )}

        {/* 2. FORGOT PASSWORD FORM */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!authSuccess ? (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Registered Email Address
                  </label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="you@college.edu"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                    We'll send an official password reset link to your campus inbox.
                  </span>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '0.95rem', fontWeight: '800', gap: '0.5rem' }}
                >
                  <Mail size={18} />
                  {loading ? 'Sending Request...' : 'Send Reset Email'}
                </button>
              </>
            ) : (
              <div className="animate-fade-in">
                {/* REAL-TIME OFFICIAL EMAIL TEMPLATE PREVIEW CARD */}
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--border)', marginBottom: '1.25rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem' }}>
                    <ShieldCheck size={20} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>Saveetha University Security</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>noreply@parknex.saveetha.edu</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Subject: 🔒 Reset Your ParkNex-AI Password
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
                    Hello {email.split('@')[0] || 'User'},<br/>
                    We received a request to reset your password for your ParkNex-AI Campus Parking account. Click the button below to set a new password:
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo('reset', '/reset-password')}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.75rem' }}
                  >
                    Reset Password Now →
                  </button>

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    This link will expire in 24 hours. If you didn't request this, please ignore this email.
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => navigateTo('reset', '/reset-password')}
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '0.95rem', fontWeight: '800' }}
                >
                  Proceed to Reset Password
                </button>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button 
                type="button"
                onClick={() => navigateTo('login', '/')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. RESET PASSWORD FORM */}
        {authMode === 'reset' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem', paddingRight: '2.5rem' }}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem', paddingRight: '2.5rem' }}
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.05)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: newPassword.length >= 8 ? 'var(--success)' : 'var(--text-muted)' }}>
                <KeyRound size={14} /> Password must contain minimum 8 characters
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '0.95rem', fontWeight: '800', gap: '0.5rem' }}
            >
              <Lock size={18} />
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button 
                type="button"
                onClick={() => navigateTo('login', '/')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
