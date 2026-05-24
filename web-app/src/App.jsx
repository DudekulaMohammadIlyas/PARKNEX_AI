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
  MapPin
} from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';
import SecurityDashboard from './SecurityDashboard';
import ManageSlots from './ManageSlots';
import UserManagement from './UserManagement';
import Analytics from './Analytics';
import SettingsPage from './SettingsPage';

const BACKEND_URL = 'http://localhost:5000/api';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-color)', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '24px', marginBottom: '2rem' }}>
            <AlertTriangle size={64} color="var(--danger)" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>Something went wrong.</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>The dashboard encountered a rendering error. Please try refreshing or switching tabs.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        console.log("Sign-in successful for:", email);
        if (data.user?.user_metadata?.role) {
          const role = data.user.user_metadata.role.toUpperCase();
          console.log("Metadata role found:", role);
          onLogin(role);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: role }
          }
        });
        if (error) throw error;
        alert('Registration successful! You can now log in.');
        setIsLogin(true);
      }
    } catch (err) {
      console.error("Auth error:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1.25rem', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '24px', marginBottom: '1.5rem' }}>
            <CarFront size={48} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>ParkNex-AI</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {isLogin ? 'Sign in to access your dashboard' : 'Create an account to get started'}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)', fontSize: '0.875rem' }}>Select Role</label>
              <select 
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="STUDENT">Student</option>
                <option value="SECURITY">Security</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.875rem' }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [role, setRole] = useState(null); 
  const [occupancy, setOccupancy] = useState(null);
  const [events, setEvents] = useState([]);
  const [activePage, setActivePage] = useState('dashboard'); // For Admin & other role sub-pages
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: 'User',
    email: '',
    phone: '+91 98765 43210',
    avatar: 'U'
  });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.user_metadata?.role) {
          setRole(session.user.user_metadata.role.toUpperCase());
        }
      } catch (err) { console.error(err); }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.user_metadata?.role) {
        setRole(session.user.user_metadata.role.toUpperCase());
      } else if (_event === 'SIGNED_OUT') {
        setRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!role) return;
    
    // Set default profile details based on role
    let defaultName = 'User';
    let defaultAvatar = 'U';
    if (role === 'ADMIN') { defaultName = 'Admin User'; defaultAvatar = 'A'; }
    else if (role === 'SECURITY') { defaultName = 'Security Officer'; defaultAvatar = 'S'; }
    else if (role === 'STUDENT') { defaultName = 'Student Pro'; defaultAvatar = 'S'; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setProfile({
        name: session?.user?.user_metadata?.name || defaultName,
        email: session?.user?.email || `${role.toLowerCase()}@parknex.edu`,
        phone: session?.user?.user_metadata?.phone || '+91 98765 43210',
        avatar: (session?.user?.user_metadata?.name || defaultName).charAt(0).toUpperCase()
      });
    });

    const fetchData = async () => {
      try {
        const [occRes, evRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/occupancy`),
          axios.get(`${BACKEND_URL}/events`)
        ]);
        setOccupancy(occRes.data);
        setEvents(Array.isArray(evRes.data) ? evRes.data : []);
      } catch (error) { console.error(error); }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Event' }, (p) => {
      if (p.new) setEvents((prev) => [p.new, ...prev].slice(0, 50));
      refreshData();
    }).subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
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
      phone: profile.phone
    });
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile({
      ...profile,
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      avatar: profileForm.name.charAt(0).toUpperCase()
    });
    setIsProfileModalOpen(false);
  };

  if (!role) return <AuthScreen onLogin={setRole} />;

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon"><CarFront size={20} /></div>
          <span className="logo-text">ParkNex AI</span>
        </div>
        
        <div className="menu-label">Menu</div>
        <nav className="nav-links">
          {role === 'ADMIN' ? (
            <>
              <a className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
                <LayoutGrid size={20} /> Dashboard
              </a>
              <a className={`nav-item ${activePage === 'slots' ? 'active' : ''}`} onClick={() => setActivePage('slots')}>
                <MapPin size={20} /> Manage Slots
              </a>
              <a className={`nav-item ${activePage === 'users' ? 'active' : ''}`} onClick={() => setActivePage('users')}>
                <Users size={20} /> Users
              </a>
              <a className={`nav-item ${activePage === 'analytics' ? 'active' : ''}`} onClick={() => setActivePage('analytics')}>
                <TrendingUp size={20} /> Analytics
              </a>
              <a className={`nav-item ${activePage === 'settings' ? 'active' : ''}`} onClick={() => setActivePage('settings')}>
                <Settings size={20} /> Settings
              </a>
            </>
          ) : (
            <>
              <a className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
                <LayoutGrid size={20} /> Dashboard
              </a>
              <a className={`nav-item ${activePage === 'settings' ? 'active' : ''}`} onClick={() => setActivePage('settings')}>
                <Settings size={20} /> Settings
              </a>
            </>
          )}
        </nav>

        <div className="logout-container">
          <a className="nav-item" onClick={async () => { await supabase.auth.signOut(); setRole(null); }}>
            <LogOut size={20} /> Logout
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-wrapper">
        <header className="top-nav" style={{ position: 'relative' }}>
          <h2 className="page-title">{activePage.charAt(0).toUpperCase() + activePage.slice(1)}</h2>
          <div className="top-nav-right">
            <button className="notification-btn" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
              <Bell size={20} />
              <div className="notification-dot"></div>
            </button>
            
            {isNotificationOpen && (
              <div className="card animate-fade-in" style={{ position: 'absolute', top: '60px', right: '14rem', width: '320px', zIndex: 100, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '1rem' }}>
                <h4 style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Notifications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--text-main)' }}>
                    <strong style={{ display: 'block', color: 'var(--primary)' }}>System Alert</strong>
                    Zone B is currently operating at 95% capacity.
                  </div>
                  <div style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: '8px', background: 'var(--success-bg)', color: 'var(--text-main)' }}>
                    <strong style={{ display: 'block', color: 'var(--success)' }}>Access Granted</strong>
                    Your vehicle UP14AB1234 cleared Main Gate successfully.
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
            {role === 'ADMIN' && (
              <>
                {activePage === 'dashboard' && <AdminDashboard occupancy={occupancy} events={events} onEditProfile={openProfileModal} />}
                {activePage === 'slots' && <ManageSlots occupancy={occupancy} refreshData={refreshData} />}
                {activePage === 'users' && <UserManagement />}
                {activePage === 'analytics' && <Analytics />}
                {activePage === 'settings' && <SettingsPage />}
              </>
            )}
            {role === 'STUDENT' && (
              activePage === 'settings' ? <SettingsPage /> : <StudentDashboard occupancy={occupancy} BACKEND_URL={BACKEND_URL} onEditProfile={openProfileModal} />
            )}
            {role === 'SECURITY' && (
              activePage === 'settings' ? <SettingsPage /> : <SecurityDashboard occupancy={occupancy} events={events} BACKEND_URL={BACKEND_URL} onEditProfile={openProfileModal} />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Shared Edit Profile Modal */}
      {isProfileModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={22} color="var(--primary)" /> Edit Profile Details
            </h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Full Name</label>
                <input 
                  type="text" 
                  required
                  value={profileForm.name} 
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Email Address</label>
                <input 
                  type="email" 
                  required
                  value={profileForm.email} 
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Mobile Number</label>
                <input 
                  type="text" 
                  required
                  value={profileForm.phone} 
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsProfileModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
