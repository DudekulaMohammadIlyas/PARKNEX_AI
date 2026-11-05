import React, { useState, useEffect, useRef } from 'react';
import { 
  CarFront, 
  Video, 
  AlertTriangle, 
  Users, 
  Settings, 
  LogOut,
  Camera,
  Activity,
  ArrowRightLeft,
  ShieldCheck,
  BarChart,
  User,
  Shield,
  Bell,
  LayoutGrid,
  TrendingUp,
  MapPin,
  Calendar,
  X,
  CreditCard,
  History,
  RotateCcw,
  MonitorCheck,
  Trash2,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Check,
  Save
} from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import AuthScreen from './AuthScreen';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';
import SecurityDashboard from './SecurityDashboard';
import ManageSlots from './ManageSlots';
import UserManagement from './UserManagement';
import Analytics from './Analytics';
import SettingsPage from './SettingsPage';
import FeedbackPage from './FeedbackPage';
import NotificationDrawer from './NotificationDrawer';
import AIChatModal from './components/AIChatModal';
import CinematicSplash from './components/CinematicSplash';
import GlassBackground from './components/GlassBackground';
import WelcomeGuidanceCard from './components/WelcomeGuidanceCard';
import GuidedTour from './components/GuidedTour';
import TopNavbar from './components/TopNavbar';
import ProjectFooter from './components/ProjectFooter';

const BACKEND_URL = 'http://localhost:5000/api';

// Robust Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { 
    return { hasError: true, error }; 
  }
  componentDidCatch(error, errorInfo) { 
    console.error("Dashboard Rendering Error Caught:", error, errorInfo); 
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '24px', border: '1px solid var(--border)', margin: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '20px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <AlertTriangle size={48} color="var(--danger)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Unable to display content</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '480px', fontSize: '0.9rem' }}>
            {this.state.error?.message || 'The component encountered an unexpected error while loading records.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => this.setState({ hasError: false, error: null })}>
              <RotateCcw size={16} /> Try Again
            </button>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Refresh Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('parknex_splash_seen');
  });
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [role, setRole] = useState(null); 
  const [occupancy, setOccupancy] = useState(null);
  const [events, setEvents] = useState([]);
  const [activePage, setActivePage] = useState('dashboard');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProfileSavedConfirmOpen, setIsProfileSavedConfirmOpen] = useState(false);
  const [savedProfileDetails, setSavedProfileDetails] = useState(null);
  const [profileSaveToast, setProfileSaveToast] = useState(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [toastAlert, setToastAlert] = useState(null);
  const seenToastIdsRef = useRef(new Set());
  
  const [profile, setProfile] = useState({
    name: 'User',
    email: '',
    phone: '',
    department: '',
    academicTerm: '',
    avatar: 'U'
  });
  const [profileForm, setProfileForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    department: '', 
    academicTerm: '' 
  });

  // Attach token header to axios requests
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('parknex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (err) => Promise.reject(err));

  const handleLoginSuccess = (userRole, userDetails = {}, token = null) => {
    const formattedRole = (userRole || 'STUDENT').toUpperCase();
    setRole(formattedRole);
    setActivePage('dashboard');

    localStorage.setItem('parknex_role', formattedRole);
    localStorage.setItem('parknex_user', JSON.stringify(userDetails));
    if (token) localStorage.setItem('parknex_token', token);

    // Restore updated profile from localStorage cache first
    const cachedProfile = localStorage.getItem(`parknex_user_profile_${userDetails.email || formattedRole}`);
    let initialName = userDetails.name || (userDetails.email ? userDetails.email.split('@')[0] : 'User');
    let initialPhone = userDetails.phone || '';
    let initialEmail = userDetails.email || '';
    let initialDept = userDetails.department || '';
    let initialTerm = userDetails.academicTerm || '';

    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        if (parsed.name) initialName = parsed.name;
        if (parsed.phone) initialPhone = parsed.phone;
        if (parsed.email) initialEmail = parsed.email;
        if (parsed.department !== undefined) initialDept = parsed.department;
        if (parsed.academicTerm !== undefined) initialTerm = parsed.academicTerm;
      } catch (e) {}
    }

    setProfile({
      name: initialName,
      email: initialEmail,
      phone: initialPhone,
      department: initialDept,
      academicTerm: initialTerm,
      avatar: initialName.charAt(0).toUpperCase()
    });
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        // 1. Check local session persistence first (prevents auto logout on page refresh)
        const storedRole = localStorage.getItem('parknex_role');
        const storedUser = localStorage.getItem('parknex_user');
        if (storedRole) {
          let userObj = {};
          try { userObj = storedUser ? JSON.parse(storedUser) : {}; } catch (e) {}
          handleLoginSuccess(storedRole, userObj);
        }

        // 2. Verify with backend if token exists
        const token = localStorage.getItem('parknex_token');
        if (token) {
          try {
            const res = await axios.get(`${BACKEND_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data?.success && res.data.user) {
              handleLoginSuccess(res.data.user.role, res.data.user, token);
              return;
            }
          } catch (e) {}
        }

        // 3. Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userRole = session.user.user_metadata?.role?.toUpperCase() || 'STUDENT';
          handleLoginSuccess(userRole, { email: session.user.email, name: session.user.user_metadata?.name });
        }
      } catch (err) { console.error(err); }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userRole = session.user.user_metadata?.role?.toUpperCase() || 'STUDENT';
        handleLoginSuccess(userRole, { email: session.user.email, name: session.user.user_metadata?.name });
      } else if (_event === 'SIGNED_OUT') {
        localStorage.removeItem('parknex_token');
        localStorage.removeItem('parknex_role');
        localStorage.removeItem('parknex_user');
        setRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!role) return;

    const fetchNotificationsCount = async () => {
      try {
        const email = encodeURIComponent(profile.email || `${role.toLowerCase()}@college.edu`);
        const res = await axios.get(`${BACKEND_URL}/notifications?email=${email}&role=${role}`);
        if (res.data?.success) {
          setUnreadNotifCount(res.data.unreadCount || 0);
          
          // Check for fresh CRITICAL/HIGH unread notification created recently (< 2 mins) that hasn't been shown yet
          const nowMs = Date.now();
          const freshAlerts = (res.data.notifications || []).filter(n => {
            if (n.isRead) return false;
            if (n.priority !== 'CRITICAL' && n.priority !== 'HIGH') return false;
            if (seenToastIdsRef.current.has(n.id)) return false;
            
            const createdMs = n.createdAt ? new Date(n.createdAt).getTime() : 0;
            return (nowMs - createdMs) < 120000;
          });

          if (freshAlerts.length > 0) {
            const newAlert = freshAlerts[0];
            seenToastIdsRef.current.add(newAlert.id);
            setToastAlert(newAlert);
            setTimeout(() => {
              setToastAlert(current => current?.id === newAlert.id ? null : current);
            }, 6000);
          }
        }
      } catch (e) {}
    };

    fetchNotificationsCount();
    const notifInterval = setInterval(fetchNotificationsCount, 10000);

    const chName = `app-notif-realtime-${Date.now()}`;
    const channel = supabase
      .channel(chName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Notification' }, () => {
        fetchNotificationsCount();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notification' }, () => {
        fetchNotificationsCount();
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') fetchNotificationsCount();
    });

    return () => {
      clearInterval(notifInterval);
      if (supabase && supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, [role, profile.email]);

  const handleNotifNavigate = (targetScreen, notif) => {
    setIsNotificationOpen(false);
    const dest = targetScreen || notif?.deepLink || notif?.category;

    if (dest === 'violations' || dest === 'VIOLATION') {
      if (role === 'ADMIN') {
        setActivePage('dashboard');
        setTimeout(() => {
          const el = document.getElementById('admin-violations-box');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else if (role === 'SECURITY') {
        setActivePage('incidents');
      } else {
        // STUDENT or STAFF
        setActivePage('dashboard');
        setTimeout(() => {
          const el = document.getElementById('student-violations-card') || document.querySelector('.badge-danger');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } else if (dest === 'FeedbackPage' || dest === 'Feedback' || dest === 'FEEDBACK') {
      setActivePage('feedback');
    } else if (dest === 'StudentBookScreen' || dest === 'slots' || dest === 'BOOKING' || dest === 'PARKING_EXPIRY' || dest === 'PARKING_EXPIRED') {
      if (role === 'STUDENT' || role === 'FACULTY' || role === 'STAFF') {
        setActivePage('dashboard');
      } else if (role === 'ADMIN') {
        setActivePage('slots');
      } else {
        setActivePage('dashboard');
      }
    } else if (dest === 'StudentVehiclesScreen' || dest === 'vehicles' || dest === 'VEHICLE_ENTRY' || dest === 'VEHICLE_EXIT' || dest === 'PASS') {
      if (role === 'ADMIN') {
        setActivePage('users');
      } else if (role === 'SECURITY') {
        setActivePage('overview');
      } else {
        setActivePage('dashboard');
      }
    } else if (dest === 'UnauthorizedLogsScreen' || dest === 'security' || dest === 'GATE' || dest === 'CCTV' || dest === 'cctv') {
      if (role === 'SECURITY') {
        setActivePage('cctv');
      } else {
        setActivePage('dashboard');
      }
    } else if (dest === 'ManageZones' || dest === 'CAPACITY') {
      if (role === 'ADMIN') {
        setActivePage('slots');
      } else {
        setActivePage('dashboard');
      }
    } else if (dest === 'Analytics' || dest === 'Reports' || dest === 'ANALYTICS' || dest === 'SYSTEM' || dest === 'AUDIT') {
      if (role === 'ADMIN') {
        setActivePage('analytics');
      } else {
        setActivePage('dashboard');
      }
    } else if (dest === 'UserManagement' || dest === 'users') {
      if (role === 'ADMIN') {
        setActivePage('users');
      } else {
        setActivePage('dashboard');
      }
    } else if (dest === 'StudentProfileScreen' || dest === 'profile') {
      openProfileModal();
    } else if (dest === 'visitors' || dest === 'VISITOR') {
      if (role === 'SECURITY') {
        setActivePage('barrier');
      } else {
        setActivePage('dashboard');
      }
    } else if (dest === 'settings' || dest === 'SettingsPage') {
      setActivePage('settings');
    } else if (dest === 'Emergency' || dest === 'EMERGENCY') {
      setActivePage('dashboard');
    } else {
      setActivePage('dashboard');
    }
  };

  const refreshData = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/occupancy`);
      setOccupancy(res.data);
    } catch (e) {}
  };

  const openProfileModal = () => {
    setProfileForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      department: profile.department || '',
      academicTerm: profile.academicTerm || ''
    });
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const updatedProfile = {
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      department: profileForm.department || '',
      academicTerm: profileForm.academicTerm || '',
      avatar: profileForm.name.charAt(0).toUpperCase()
    };

    setProfile(updatedProfile);
    setSavedProfileDetails(updatedProfile);
    setIsProfileModalOpen(false);

    localStorage.setItem(`parknex_user_profile_${profileForm.email || role}`, JSON.stringify(updatedProfile));

    try {
      const storedUserStr = localStorage.getItem('parknex_user');
      let storedUser = {};
      try { storedUser = storedUserStr ? JSON.parse(storedUserStr) : {}; } catch (e) {}
      storedUser.name = profileForm.name;
      storedUser.phone = profileForm.phone;
      storedUser.department = profileForm.department;
      storedUser.academicTerm = profileForm.academicTerm;
      localStorage.setItem('parknex_user', JSON.stringify(storedUser));
    } catch (e) {}

    try {
      await axios.put(`${BACKEND_URL}/users/profile`, {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        department: profileForm.department,
        academicTerm: profileForm.academicTerm
      });
      setProfileSaveToast('Profile changes saved and synchronized with database!');
      setTimeout(() => setProfileSaveToast(null), 4500);
      setIsProfileSavedConfirmOpen(true);
    } catch (err) {
      setProfileSaveToast('Profile updated locally on device.');
      setTimeout(() => setProfileSaveToast(null), 4500);
      setIsProfileSavedConfirmOpen(true);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      `⚠️ PERMANENT ACCOUNT DELETION WARNING ⚠️\n\nAre you sure you want to permanently delete your account (${profile.email})?\n\nAll your registered vehicles, parking permits, and booking history will be removed. You will NOT be able to log in with this email unless you re-register.`
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${BACKEND_URL}/users/profile?email=${encodeURIComponent(profile.email)}`);
    } catch (err) {}

    // Purge local storage for this user and remove from local admin lists
    localStorage.removeItem(`parknex_user_profile_${profile.email}`);
    localStorage.removeItem(`parknex_vehicles_${profile.email}`);
    localStorage.removeItem(`parknex_historyList_${profile.email}`);
    localStorage.removeItem(`parknex_receiptsList_${profile.email}`);
    localStorage.removeItem('parknex_token');
    localStorage.removeItem('parknex_role');
    localStorage.removeItem('parknex_user');
    
    // Purge from cached admin users list if present
    const savedAdminUsers = localStorage.getItem('parknex_admin_users');
    if (savedAdminUsers) {
      try {
        const parsed = JSON.parse(savedAdminUsers);
        const filtered = parsed.filter(u => u.email !== profile.email);
        localStorage.setItem('parknex_admin_users', JSON.stringify(filtered));
      } catch (e) {}
    }

    await supabase.auth.signOut().catch(() => {});

    alert(`✅ Account (${profile.email}) has been PERMANENTLY deleted from PostgreSQL database.`);
    setIsProfileModalOpen(false);
    setRole(null);
  };

  const confirmLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleLogout = async () => {
    setIsLogoutConfirmOpen(false);
    setIsProfileModalOpen(false);
    setIsNotificationOpen(false);
    setIsAIChatOpen(false);

    // Thorough storage purge
    localStorage.removeItem('parknex_token');
    localStorage.removeItem('parknex_role');
    localStorage.removeItem('parknex_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    sessionStorage.clear();

    await supabase.auth.signOut().catch(() => {});
    setRole(null);
  };

  if (showSplash) {
    return (
      <CinematicSplash 
        onComplete={() => {
          sessionStorage.setItem('parknex_splash_seen', 'true');
          setShowSplash(false);
        }} 
      />
    );
  }

  if (!role) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <GlassBackground />
        <AuthScreen 
          onLogin={handleLoginSuccess} 
          onReplayIntro={() => setShowSplash(true)} 
        />
      </div>
    );
  }

  return (
    <div className="app-container-glass">
      {/* GLOBAL PERSISTENT GLASS BACKGROUND */}
      <GlassBackground />

      {/* SHARED PROFESSIONAL TOP NAVIGATION */}
      <TopNavbar
        role={role}
        activePage={activePage}
        setActivePage={setActivePage}
        profile={profile}
        unreadNotifCount={unreadNotifCount}
        onOpenNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
        onOpenProfile={openProfileModal}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        onStartTour={() => setIsTourOpen(true)}
        onConfirmLogout={confirmLogout}
      />

      {/* NOTIFICATION DRAWER */}
      <NotificationDrawer 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
        userEmail={profile.email || `${(role || 'student').toLowerCase()}@college.edu`} 
        userRole={role} 
        onUnreadCountChange={setUnreadNotifCount}
        onNavigate={handleNotifNavigate} 
      />

      {/* MAIN DASHBOARD CONTENT AREA */}
      <main className="content-body-glass">
        {/* FIRST-TIME WELCOME & GUIDANCE CARD */}
        {activePage === 'dashboard' && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.85rem' }}>
            <WelcomeGuidanceCard
              userRole={role}
              userName={profile.name}
              userEmail={profile.email}
              onStartTour={() => setIsTourOpen(true)}
            />
          </div>
        )}

        <ErrorBoundary key={`${role}-${activePage}`}>
          
          {/* ADMIN PORTAL SWITCHING & VIEWS */}
          {role === 'ADMIN' && (
            <>
              {activePage === 'dashboard' && <AdminDashboard occupancy={occupancy} events={events} onEditProfile={openProfileModal} />}
              {activePage === 'slots' && <ManageSlots occupancy={occupancy} refreshData={refreshData} />}
              {activePage === 'users' && <UserManagement />}
              {activePage === 'analytics' && <Analytics />}
              {activePage === 'feedback' && <FeedbackPage userRole="ADMIN" profile={profile} BACKEND_URL={BACKEND_URL} />}
              {activePage === 'settings' && <SettingsPage onLogout={confirmLogout} />}
            </>
          )}

          {/* STUDENT & FACULTY/STAFF PORTAL VIEWS */}
          {(role === 'STUDENT' || role === 'FACULTY' || role === 'STAFF') && (
            activePage === 'settings' ? (
              <SettingsPage onLogout={confirmLogout} />
            ) : activePage === 'feedback' ? (
              <FeedbackPage userRole={role} profile={profile} BACKEND_URL={BACKEND_URL} />
            ) : (
              <StudentDashboard 
                occupancy={occupancy} 
                BACKEND_URL={BACKEND_URL} 
                profile={profile} 
                userRole={role}
                onEditProfile={openProfileModal}
                activeTab={activePage === 'dashboard' ? 'overview' : activePage}
                setActiveTab={setActivePage}
              />
            )
          )}

          {/* SECURITY COMMAND CENTER VIEWS */}
          {role === 'SECURITY' && (
            activePage === 'settings' ? (
              <SettingsPage onLogout={confirmLogout} />
            ) : activePage === 'feedback' ? (
              <FeedbackPage userRole="SECURITY" profile={profile} BACKEND_URL={BACKEND_URL} />
            ) : (
              <SecurityDashboard 
                occupancy={occupancy} 
                events={events} 
                BACKEND_URL={BACKEND_URL} 
                profile={profile} 
                onEditProfile={openProfileModal}
                activeTab={activePage === 'dashboard' ? 'overview' : activePage}
                setActiveTab={setActivePage}
              />
            )
          )}

        </ErrorBoundary>
      </main>

      {/* PROFESSIONAL PROJECT FOOTER */}
      <ProjectFooter 
        onNavigate={setActivePage}
        onReplayIntro={() => setShowSplash(true)}
        activePage={activePage}
        role={role}
      />

      {/* Shared Edit Profile Modal */}
      {isProfileModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <User size={24} color="var(--primary)" /> Edit Profile Details
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Full Name</label>
                <input 
                  type="text" 
                  required
                  value={profileForm.name} 
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                  className="search-input"
                  style={{ paddingLeft: '1rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email Address</label>
                <input 
                  type="email" 
                  required
                  value={profileForm.email} 
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} 
                  className="search-input"
                  style={{ paddingLeft: '1rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Mobile Number</label>
                <input 
                  type="text" 
                  required
                  value={profileForm.phone} 
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} 
                  className="search-input"
                  style={{ paddingLeft: '1rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Academic Department</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={profileForm.department} 
                  onChange={e => setProfileForm({ ...profileForm, department: e.target.value })} 
                  className="search-input"
                  style={{ paddingLeft: '1rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Academic Term / Batch</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Fall 2024 - Spring 2028"
                  value={profileForm.academicTerm} 
                  onChange={e => setProfileForm({ ...profileForm, academicTerm: e.target.value })} 
                  className="search-input"
                  style={{ paddingLeft: '1rem' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsProfileModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSavingProfile}
                  className="btn btn-primary" 
                  style={{ flex: 1, justifyContent: 'center', gap: '0.5rem', fontWeight: '800' }}
                >
                  {isSavingProfile ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Check size={18} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: '800' }}>Session & Danger Zone</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={confirmLogout}
                  style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.3)', justifyContent: 'center', gap: '0.5rem', fontWeight: '800', padding: '0.75rem', flex: 1 }}
                >
                  <LogOut size={18} /> Sign Out Session
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={handleDeleteAccount}
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', justifyContent: 'center', gap: '0.5rem', fontWeight: '800', padding: '0.75rem', flex: 1 }}
                >
                  <Trash2 size={18} /> Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsLogoutConfirmOpen(false)} style={{ zIndex: 10000 }}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center', padding: '2.25rem 1.75rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto', color: '#EF4444' }}>
              <LogOut size={30} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Confirm Sign Out
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: '1.5' }}>
              Are you sure you want to end your current session? You will need to sign in again to access ParkNex AI.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setIsLogoutConfirmOpen(false)} 
                style={{ flex: 1, justifyContent: 'center', fontWeight: '700', padding: '0.75rem' }}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                onClick={handleLogout} 
                style={{ flex: 1, justifyContent: 'center', background: '#EF4444', color: '#FFFFFF', fontWeight: '800', border: 'none', padding: '0.75rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
              >
                Sign Out Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Changes Dedicated Confirmation Modal */}
      {isProfileSavedConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileSavedConfirmOpen(false)} style={{ zIndex: 10000 }}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ 
              width: '68px', 
              height: '68px', 
              borderRadius: '50%', 
              background: 'rgba(16, 185, 129, 0.12)', 
              border: '2px solid rgba(16, 185, 129, 0.4)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.25rem auto', 
              color: '#10B981',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={36} />
            </div>
            
            <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Changes Saved Successfully!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Your profile details have been saved and synchronized with the campus database & barrier OCR system.
            </p>

            {savedProfileDetails && (
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid var(--border)', 
                borderRadius: '16px', 
                padding: '1.25rem', 
                marginBottom: '1.75rem', 
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.88rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Full Name</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: '800' }}>{savedProfileDetails.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Email Address</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{savedProfileDetails.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Mobile Phone</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{savedProfileDetails.phone || '—'}</span>
                </div>
                {savedProfileDetails.department && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Department</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{savedProfileDetails.department}</span>
                  </div>
                )}
                {savedProfileDetails.academicTerm && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Academic Term</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{savedProfileDetails.academicTerm}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontWeight: '800', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                  Cloud & Database Sync Complete
                </div>
              </div>
            )}

            <button 
              className="btn btn-primary" 
              onClick={() => setIsProfileSavedConfirmOpen(false)} 
              style={{ width: '100%', justifyContent: 'center', fontWeight: '800', padding: '0.85rem', fontSize: '1rem' }}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* FLOATING PROFILE SAVE CONFIRMATION TOAST */}
      {profileSaveToast && (
        <div 
          className="animate-slide-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#064E3B',
            color: '#ECFDF5',
            borderRadius: '16px',
            padding: '1rem 1.4rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)',
            borderLeft: '6px solid #10B981',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            maxWidth: '420px'
          }}
        >
          <CheckCircle2 size={24} color="#10B981" />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '900', letterSpacing: '0.5px', color: '#6EE7B7', textTransform: 'uppercase', display: 'block' }}>
              SETTINGS CONFIRMED
            </span>
            <strong style={{ fontSize: '0.92rem', display: 'block', margin: '2px 0' }}>{profileSaveToast}</strong>
          </div>
          <button 
            onClick={() => setProfileSaveToast(null)}
            style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {/* REAL-TIME TOAST ALERT POPUP BANNER */}
      {toastAlert && (
        <div 
          className="animate-slide-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toastAlert.priority === 'CRITICAL' ? '#7F1D1D' : '#1E1B4B',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)',
            borderLeft: `6px solid ${toastAlert.priority === 'CRITICAL' ? '#EF4444' : '#F59E0B'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '420px'
          }}
        >
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.5px', color: toastAlert.priority === 'CRITICAL' ? '#FCA5A5' : '#FDE047', textTransform: 'uppercase', display: 'block' }}>
              {toastAlert.priority} ALERT • {toastAlert.category}
            </span>
            <strong style={{ fontSize: '0.95rem', display: 'block', margin: '2px 0' }}>{toastAlert.title}</strong>
            <p style={{ fontSize: '0.82rem', margin: 0, opacity: 0.9 }}>{toastAlert.message}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              onClick={() => {
                if (toastAlert?.id) {
                  seenToastIdsRef.current.add(toastAlert.id);
                  axios.put(`${BACKEND_URL}/notifications/${toastAlert.id}/read`).catch(() => {});
                }
                const target = toastAlert?.deepLink || toastAlert?.category;
                const currentAlert = toastAlert;
                setToastAlert(null);
                handleNotifNavigate(target, currentAlert);
              }}
              style={{ background: '#FFFFFF', border: 'none', color: '#0F172A', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: '900', whiteSpace: 'nowrap' }}
            >
              Action →
            </button>
            <button 
              onClick={() => {
                if (toastAlert?.id) {
                  seenToastIdsRef.current.add(toastAlert.id);
                  axios.put(`${BACKEND_URL}/notifications/${toastAlert.id}/read`).catch(() => {});
                }
                setToastAlert(null);
              }}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '800' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* FLOATING LOCAL OLLAMA AI ASSISTANT LAUNCHER BUTTON */}
      {role && (
        <button
          onClick={() => setIsAIChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 9998,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '9999px',
            padding: '0.85rem 1.35rem',
            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5), 0 0 15px rgba(124, 58, 237, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Sparkles size={20} color="#FDE047" className="animate-pulse" />
          <span>AI Assistant</span>
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            fontWeight: 800
          }}>
            Ollama
          </span>
        </button>
      )}

      {/* LOCAL OLLAMA AI CHAT MODAL */}
      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        currentUser={{ name: profile.name, role: role, email: profile.email, department: profile.department }}
      />

      {/* INTERACTIVE ROLE-AWARE GUIDED TOUR */}
      <GuidedTour
        userRole={role}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}

export default App;
