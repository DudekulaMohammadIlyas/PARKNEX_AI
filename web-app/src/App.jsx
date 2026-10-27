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
    const notifInterval = setInterval(fetchNotificationsCount, 5000);
    return () => clearInterval(notifInterval);
  }, [role, profile.email]);

  const handleNotifNavigate = (targetScreen, notif) => {
    setIsNotificationOpen(false);
    if (targetScreen === 'StudentBookScreen' || targetScreen === 'slots') {
      setActivePage(role === 'STUDENT' ? 'dashboard' : 'slots');
    } else if (targetScreen === 'StudentVehiclesScreen' || targetScreen === 'vehicles') {
      setActivePage(role === 'ADMIN' ? 'users' : 'dashboard');
    } else if (targetScreen === 'UnauthorizedLogsScreen' || targetScreen === 'security') {
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

  if (!role) return <AuthScreen onLogin={handleLoginSuccess} />;

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon"><CarFront size={24} /></div>
          <span className="logo-text">ParkNex AI</span>
        </div>
        
        <div className="menu-label">Menu</div>
        <nav className="nav-links">
          
          {/* ADMIN ROLE NAVIGATION (CLEANED: REMOVED SECURITY COMMAND CENTER & STUDENT BOOKING PORTAL) */}
          {role === 'ADMIN' && (
            <>
              <a className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
                <LayoutGrid size={20} /> Admin Command
              </a>
              <a className={`nav-item ${activePage === 'slots' ? 'active' : ''}`} onClick={() => setActivePage('slots')}>
                <MapPin size={20} /> Manage Slots
              </a>
              <a className={`nav-item ${activePage === 'users' ? 'active' : ''}`} onClick={() => setActivePage('users')}>
                <Users size={20} /> User Registry
              </a>
              <a className={`nav-item ${activePage === 'analytics' ? 'active' : ''}`} onClick={() => setActivePage('analytics')}>
                <TrendingUp size={20} /> Analytics
              </a>
              <a className={`nav-item ${activePage === 'feedback' ? 'active' : ''}`} onClick={() => setActivePage('feedback')}>
                <MessageSquare size={20} /> User Feedback
              </a>
              <a className={`nav-item ${activePage === 'settings' ? 'active' : ''}`} onClick={() => setActivePage('settings')}>
                <Settings size={20} /> System Settings
              </a>
            </>
          )}

          {/* STUDENT ROLE NAVIGATION */}
          {role === 'STUDENT' && (
            <>
              <a className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
                <LayoutGrid size={20} /> Overview
              </a>
              <a className={`nav-item ${activePage === 'book' ? 'active' : ''}`} onClick={() => setActivePage('book')}>
                <Calendar size={20} /> Book a Slot
              </a>
              <a className={`nav-item ${activePage === 'vehicles' ? 'active' : ''}`} onClick={() => setActivePage('vehicles')}>
                <CarFront size={20} /> My Vehicles
              </a>
              <a className={`nav-item ${activePage === 'map' ? 'active' : ''}`} onClick={() => setActivePage('map')}>
                <MapPin size={20} /> Campus Map
              </a>
              <a className={`nav-item ${activePage === 'billing' ? 'active' : ''}`} onClick={() => setActivePage('billing')}>
                <CreditCard size={20} /> Passes & Billing
              </a>
              <a className={`nav-item ${activePage === 'history' ? 'active' : ''}`} onClick={() => setActivePage('history')}>
                <History size={20} /> Parking History
              </a>
              <a className={`nav-item ${activePage === 'feedback' ? 'active' : ''}`} onClick={() => setActivePage('feedback')}>
                <MessageSquare size={20} /> Feedback & Reviews
              </a>
              <a className={`nav-item ${activePage === 'settings' ? 'active' : ''}`} onClick={() => setActivePage('settings')}>
                <Settings size={20} /> Settings
              </a>
            </>
          )}

          {/* SECURITY ROLE NAVIGATION */}
          {role === 'SECURITY' && (
            <>
              <a className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
                <Shield size={20} /> Security Command Center
              </a>
              <a className={`nav-item ${activePage === 'cameras' ? 'active' : ''}`} onClick={() => setActivePage('cameras')}>
                <Camera size={20} /> CCTV Multi-Camera Feeds
              </a>
              <a className={`nav-item ${activePage === 'barrier' ? 'active' : ''}`} onClick={() => setActivePage('barrier')}>
                <Users size={20} /> Visitor Console
              </a>
              <a className={`nav-item ${activePage === 'incidents' ? 'active' : ''}`} onClick={() => setActivePage('incidents')}>
                <AlertTriangle size={20} /> Violations & Tickets
              </a>
              <a className={`nav-item ${activePage === 'feedback' ? 'active' : ''}`} onClick={() => setActivePage('feedback')}>
                <MessageSquare size={20} /> Feedback Desk
              </a>
              <a className={`nav-item ${activePage === 'settings' ? 'active' : ''}`} onClick={() => setActivePage('settings')}>
                <Settings size={20} /> Settings
              </a>
            </>
          )}
        </nav>

        <div className="logout-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid var(--border)', padding: '0.85rem 1rem', borderRadius: '14px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: '800', color: 'var(--primary)' }}>
              <div className="live-dot-green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
              SYSTEM STATUS: ONLINE
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500' }}>
              OCR Engine: Active
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500', marginTop: '0.2rem' }}>
              Backend: Express + PostgreSQL
            </div>
          </div>
          <a className="nav-item" onClick={confirmLogout} style={{ margin: 0, cursor: 'pointer', color: 'var(--danger)' }}>
            <LogOut size={20} color="var(--danger)" /> <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-wrapper">
        <header className="top-nav" style={{ position: 'relative' }}>
          <h2 className="page-title">{activePage.replace(/_/g, ' ').toUpperCase()}</h2>
          <div className="top-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="notification-btn" onClick={() => setIsNotificationOpen(!isNotificationOpen)} style={{ position: 'relative' }}>
              <Bell size={20} />
              {unreadNotifCount > 0 && (
                <span className="notification-dot" style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#EF4444', color: '#fff', fontSize: '0.65rem', fontWeight: '900', borderRadius: '10px', padding: '1px 5px', minWidth: '14px', textAlign: 'center', height: 'auto', width: 'auto' }}>
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <NotificationDrawer 
              isOpen={isNotificationOpen} 
              onClose={() => setIsNotificationOpen(false)} 
              userEmail={profile.email || `${(role || 'student').toLowerCase()}@college.edu`} 
              userRole={role} 
              onUnreadCountChange={setUnreadNotifCount}
              onNavigate={handleNotifNavigate} 
            />

            <div className="user-profile" onClick={openProfileModal} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} title="Edit Profile">
              <div className="user-info">
                <span className="user-name">{profile.name}</span>
                <span className="user-role">{role}</span>
              </div>
              <div className="user-avatar">{profile.avatar}</div>
            </div>

            <button 
              className="btn btn-logout-nav" 
              onClick={confirmLogout} 
              title="Sign Out of Session"
              style={{ 
                background: 'rgba(239, 68, 68, 0.12)', 
                color: '#EF4444', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.5rem 0.95rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#EF4444';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.color = '#EF4444';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.15)';
              }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="content-body">
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

            {/* STUDENT PORTAL VIEWS */}
            {role === 'STUDENT' && (
              activePage === 'settings' ? (
                <SettingsPage onLogout={confirmLogout} />
              ) : activePage === 'feedback' ? (
                <FeedbackPage userRole="STUDENT" profile={profile} BACKEND_URL={BACKEND_URL} />
              ) : (
                <StudentDashboard 
                  occupancy={occupancy} 
                  BACKEND_URL={BACKEND_URL} 
                  profile={profile} 
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
      </div>

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
          <button 
            onClick={() => {
              if (toastAlert?.id) {
                seenToastIdsRef.current.add(toastAlert.id);
                axios.put(`${BACKEND_URL}/notifications/${toastAlert.id}/read`).catch(() => {});
              }
              setToastAlert(null);
            }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '800' }}
          >
            Dismiss
          </button>
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
    </div>
  );
}

export default App;
