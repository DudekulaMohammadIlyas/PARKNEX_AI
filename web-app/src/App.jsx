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
  Shield
} from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';

const BACKEND_URL = 'http://localhost:5000/api';

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

function SecurityDashboard({ occupancy, events, simulateEvent }) {
  return (
    <div className="main-content">
      <header className="top-bar">
        <div>
          <h1 className="page-title">Security Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time monitoring and analytics</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => simulateEvent('ENTRY')}>
            Simulate Entry
          </button>
          <button className="btn" style={{ background: 'var(--warning)', color: 'white' }} onClick={() => simulateEvent('EXIT')}>
            Simulate Exit
          </button>
        </div>
      </header>
      
      {occupancy?.isScanning && (
        <div style={{ padding: '1rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'pulse 2s infinite' }}>
          <Activity size={20} />
          <span style={{ fontWeight: '600' }}>AI Vision Service is currently scanning live feed...</span>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-header">
            <span>Total Occupancy</span>
            <Activity className="stat-icon primary" size={40} />
          </div>
          <div className="stat-value">{occupancy ? occupancy.occupiedSlots : '--'}<span style={{fontSize: '1.2rem', color: 'var(--text-muted)'}}> / {occupancy?.totalSlots}</span></div>
          <div className="stat-subtitle">Across all campus zones</div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-header">
            <span>Today's Entries</span>
            <ArrowRightLeft className="stat-icon success" size={40} />
          </div>
          <div className="stat-value">{events.filter(e => e.type === 'ENTRY').length}</div>
          <div className="stat-subtitle">+12% from yesterday</div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-header">
            <span>Active Alerts</span>
            <AlertTriangle className="stat-icon danger" size={40} />
          </div>
          <div className="stat-value">{events.filter(e => e.status === 'UNAUTHORIZED').length}</div>
          <div className="stat-subtitle">Requires attention</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>
        <div className="card camera-feed">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Live AI Vision (Gate 1)</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Model: YOLOv8-Nano</span>
              <button 
                onClick={async () => {
                  try {
                    await axios.post(`${BACKEND_URL}/trigger-ai`);
                    alert('AI scan process started in the background!');
                  } catch (e) {
                    console.error('Trigger AI Error:', e);
                    alert('Failed to start AI scan: ' + e.message);
                  }
                }}
                style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Run Scan
              </button>
            </div>
          </div>
          
          <div className="video-container">
            <div className="video-overlay">
              <div className={`live-dot ${occupancy?.isScanning ? 'scanning' : ''}`}></div>
              {occupancy?.isScanning ? 'AI SCANNING' : 'LIVE - GATE 1'}
            </div>
            <div className="mock-camera-feed">
              {occupancy?.isScanning ? (
                <div style={{ textAlign: 'center' }}>
                  <Activity size={48} className="spin" color="var(--primary)" />
                  <p style={{ marginTop: '1rem', fontWeight: '600' }}>AI Model Processing...</p>
                </div>
              ) : (
                <>
                  <Camera size={48} opacity={0.5} />
                  <p>Waiting for AI Service Stream...</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="card events-list">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Recent Events</h2>
          
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(!events || events.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No recent events</p>
            ) : (
              events.slice(0, 8).map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-details">
                    <div className={`event-badge ${event.type?.toLowerCase()}`}>
                      {event.type}
                    </div>
                    <div className="event-meta">
                      <span className="event-plate">{event.plateNumber}</span>
                      <span className="event-time">
                        {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Recently'} 
                        - Zone {event.zone ? event.zone.name : (event.zoneId || 'Main')}
                      </span>
                      {event.snapshotUrl && (
                        <a href={event.snapshotUrl} target="_blank" rel="noreferrer" style={{fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem'}}>
                          View Snapshot
                        </a>
                      )}
                    </div>
                  </div>
                  {event.status === 'UNAUTHORIZED' && (
                    <AlertTriangle color="var(--danger)" size={20} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [role, setRole] = useState(null); // 'STUDENT', 'SECURITY', 'ADMIN'
  const [occupancy, setOccupancy] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Check active session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session check:", session?.user?.email);
        if (session?.user?.user_metadata?.role) {
          const detectedRole = session.user.user_metadata.role.toUpperCase();
          console.log("Detected role:", detectedRole);
          setRole(detectedRole);
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state change:", _event, session?.user?.email);
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

    // Fetch initial data
    const fetchData = async () => {
      if (!role) return;
      console.log("Fetching dashboard data for role:", role);
      try {
        const [occRes, evRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/occupancy`),
          axios.get(`${BACKEND_URL}/events`)
        ]);
        console.log("Data fetch success");
        setOccupancy(occRes.data);
        setEvents(Array.isArray(evRes.data) ? evRes.data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    // Supabase Realtime Subscription for New Events
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Event',
        },
        (payload) => {
          console.log('Realtime update:', payload);
          if (payload.new) {
            setEvents((prev) => [payload.new, ...(Array.isArray(prev) ? prev : [])].slice(0, 50));
          }
          axios.get(`${BACKEND_URL}/occupancy`)
            .then(res => setOccupancy(res.data))
            .catch(err => console.error("Realtime occupancy fetch failed", err));
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [role]);

  const refreshData = async () => {
    try {
      const [occRes, evRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/occupancy`),
        axios.get(`${BACKEND_URL}/events`)
      ]);
      setOccupancy(occRes.data);
      setEvents(evRes.data);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const simulateEvent = async (type) => {
    try {
      const zones = occupancy?.zones || [];
      const randomZone = zones.length > 0 ? zones[Math.floor(Math.random() * zones.length)].id : 'mock-zone-id';
      
      await axios.post(`${BACKEND_URL}/simulate-event`, {
        type,
        plateNumber: `UP${Math.floor(10 + Math.random() * 90)}AB${Math.floor(1000 + Math.random() * 9000)}`,
        zoneId: randomZone
      });
    } catch (error) {
      console.error('Error simulating event:', error);
    }
  };

  if (!role) {
    return <AuthScreen onLogin={setRole} />;
  }

  return (
    <div className="app-container">
      {/* Universal Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <div style={{ padding: '0.5rem', background: 'var(--primary)', borderRadius: '12px' }}>
            <CarFront size={24} color="white" />
          </div>
          <span className="logo-text">ParkNex-AI</span>
        </div>
        
        <nav className="nav-links">
          <a className={`nav-item ${role === 'STUDENT' ? 'active' : ''}`} onClick={() => setRole('STUDENT')}>
            <User size={20} />
            Student Portal
          </a>
          <a className={`nav-item ${role === 'SECURITY' ? 'active' : ''}`} onClick={() => setRole('SECURITY')}>
            <ShieldCheck size={20} />
            Security Dashboard
          </a>
          <a className={`nav-item ${role === 'ADMIN' ? 'active' : ''}`} onClick={() => setRole('ADMIN')}>
            <BarChart size={20} />
            Admin Console
          </a>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Logged in as:</span><br/>
            <strong style={{ color: 'var(--primary)' }}>{role}</strong>
          </div>
          <a className="nav-item" onClick={async () => {
            await supabase.auth.signOut();
            setRole(null);
          }}>
            <LogOut size={20} />
            Logout
          </a>
        </div>
      </aside>

      {/* Conditionally Render Dashboard based on Role */}
      {role === 'STUDENT' && <StudentDashboard occupancy={occupancy} BACKEND_URL={BACKEND_URL} onLogout={async () => {
        await supabase.auth.signOut();
        setRole(null);
      }} />}
      {role === 'SECURITY' && <SecurityDashboard occupancy={occupancy} events={events} simulateEvent={simulateEvent} />}
      {role === 'ADMIN' && <AdminDashboard occupancy={occupancy} events={events} refreshData={refreshData} BACKEND_URL={BACKEND_URL} />}
      
    </div>
  );
}

export default App;
