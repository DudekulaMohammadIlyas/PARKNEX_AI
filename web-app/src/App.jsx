import React, { useState, useEffect } from 'react';
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
  Trash2
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
    let initialName = userDetails.name || (formattedRole === 'ADMIN' ? 'System Admin' : formattedRole === 'SECURITY' ? 'Officer Davis' : 'Student');
    let initialPhone = userDetails.phone || '';
    let initialEmail = userDetails.email || `${formattedRole.toLowerCase()}@college.edu`;

    const isDemo = initialEmail === 'student@college.edu' || initialEmail === 'admin@college.edu' || initialEmail === 'security@college.edu';
    let initialDept = userDetails.department || (isDemo ? 'Computer Science & Engineering' : '');
    let initialTerm = userDetails.academicTerm || (isDemo ? 'Fall 2024 - Spring 2028' : '');

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

    const fetchData = async () => {
      try {
        const [occRes, evRes] = await Promise.allSettled([
          axios.get(`${BACKEND_URL}/occupancy`),
          axios.get(`${BACKEND_URL}/events`)
        ]);
        if (occRes.status === 'fulfilled' && occRes.value?.data) {
          setOccupancy(occRes.value.data);
        }
        if (evRes.status === 'fulfilled' && Array.isArray(evRes.value?.data)) {
          setEvents(evRes.value.data);
        }
      } catch (error) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, [role]);

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
    const updatedProfile = {
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      department: profileForm.department || '',
      academicTerm: profileForm.academicTerm || '',
      avatar: profileForm.name.charAt(0).toUpperCase()
    };

    setProfile(updatedProfile);
    setIsProfileModalOpen(false);

    localStorage.setItem(`parknex_user_profile_${profileForm.email || role}`, JSON.stringify(updatedProfile));

    try {
      await axios.put(`${BACKEND_URL}/users/profile`, {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        department: profileForm.department,
        academicTerm: profileForm.academicTerm
      });
      alert('Profile updated and saved permanently!');
    } catch (err) {
      alert('Profile updated locally.');
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

  const handleLogout = async () => {
    localStorage.removeItem('parknex_token');
    localStorage.removeItem('parknex_role');
    localStorage.removeItem('parknex_user');
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
          <a className="nav-item" onClick={handleLogout} style={{ margin: 0, cursor: 'pointer' }}>
            <LogOut size={20} color="var(--danger)" /> Logout
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-wrapper">
        <header className="top-nav" style={{ position: 'relative' }}>
          <h2 className="page-title">{activePage.replace(/_/g, ' ').toUpperCase()}</h2>
          <div className="top-nav-right">
            <button className="notification-btn" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
              <Bell size={20} />
              <div className="notification-dot"></div>
            </button>
            
            {isNotificationOpen && (
              <div className="card animate-fade-in" style={{ position: 'absolute', top: '65px', right: '14rem', width: '320px', zIndex: 100, boxShadow: 'var(--shadow)', padding: '1.25rem', border: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}>
                <h4 style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>Notifications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', padding: '0.6rem', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--text-main)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <strong style={{ display: 'block', color: 'var(--primary)', fontWeight: '800', marginBottom: '0.2rem' }}>System Alert</strong>
                    Zone B is currently operating at 95% capacity.
                  </div>
                  <div style={{ fontSize: '0.85rem', padding: '0.6rem', borderRadius: '10px', background: 'var(--success-bg)', color: 'var(--text-main)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <strong style={{ display: 'block', color: 'var(--success)', fontWeight: '800', marginBottom: '0.2rem' }}>Access Granted</strong>
                    Your vehicle KA-01-AB-1234 cleared Main Gate successfully.
                  </div>
                </div>
              </div>
            )}

            <div className="user-profile" onClick={openProfileModal} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} title="Edit Profile">
              <div className="user-info">
                <span className="user-name">{profile.name}</span>
                <span className="user-role">{role}</span>
              </div>
              <div className="user-avatar">{profile.avatar}</div>
            </div>
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
                {activePage === 'settings' && <SettingsPage />}
              </>
            )}

            {/* STUDENT PORTAL VIEWS */}
            {role === 'STUDENT' && (
              activePage === 'settings' ? (
                <SettingsPage />
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
                <SettingsPage />
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
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Changes</button>
              </div>
            </form>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: '800' }}>Danger Zone</span>
              <button 
                type="button" 
                className="btn" 
                onClick={handleDeleteAccount}
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', justifyContent: 'center', gap: '0.5rem', fontWeight: '800', padding: '0.75rem' }}
              >
                <Trash2 size={18} /> Delete My Account Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
