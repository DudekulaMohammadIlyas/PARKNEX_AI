import React, { useState, useEffect } from 'react';
import { Shield, Camera, AlertTriangle, Activity, History, Search, Eye, MapPin } from 'lucide-react';

export default function SecurityDashboard({ occupancy, events, BACKEND_URL, onEditProfile }) {
  const [activeAlerts, setActiveAlerts] = useState(2);
  const [activeCam, setActiveCam] = useState('Cam 01');
  const [licensePlate, setLicensePlate] = useState('UP14AB1234');

  const handleSwitchCamera = () => {
    if (activeCam === 'Cam 01') {
      setActiveCam('Cam 02');
      setLicensePlate('DL3C9988');
    } else {
      setActiveCam('Cam 01');
      setLicensePlate('UP14AB1234');
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <h2 className="section-title">Security Command Center</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={onEditProfile} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Edit Profile
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem' }}>
            <div className="live-dot scanning" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></div>
            LIVE MONITORING
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-icon-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><AlertTriangle /></div>
          <div className="stat-info">
            <span className="label">Critical Alerts</span>
            <span className="value">{activeAlerts}</span>
          </div>
        </div>
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><Activity /></div>
          <div className="stat-info">
            <span className="label">Live Occupancy</span>
            <span className="value">{occupancy?.totalOccupied || 143}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><Camera /></div>
          <div className="stat-info">
            <span className="label">Active Cameras</span>
            <span className="value">12 / 12</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Visual Feed Section */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} /> Main Entry Feed ({activeCam})
            </h3>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={handleSwitchCamera}>Switch Camera</button>
          </div>
          <div style={{ flex: 1, background: '#000', position: 'relative', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Simulated AI Vision Overlay */}
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: '120px', height: '80px', border: '2px solid #00ff00', borderRadius: '4px' }}>
              <span style={{ position: 'absolute', top: '-22px', left: '-2px', background: '#00ff00', color: '#000', fontSize: '10px', fontWeight: '900', padding: '2px 4px' }}>CAR 98% ({licensePlate})</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              <Camera size={48} style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.8rem' }}>AI Vision Pipeline Connected</p>
            </div>
            {/* Scanning Line Animation */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'rgba(0,255,0,0.5)', boxShadow: '0 0 10px #00ff00', animation: 'scanningLine 3s infinite linear' }}></div>
          </div>
          <style>{`
            @keyframes scanningLine {
              0% { top: 0% }
              100% { top: 100% }
            }
          `}</style>
        </div>

        {/* Real-time Logs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} /> Live Activity Log
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { type: 'entry', text: `Vehicle ${licensePlate} entered Zone A`, time: 'Just now', icon: <MapPin size={14} />, color: '#2563eb' },
              { type: 'alert', text: 'Suspicious loitering detected in Zone C', time: '4 mins ago', icon: <AlertTriangle size={14} />, color: '#ef4444' },
              { type: 'exit', text: 'Vehicle DL3C9988 exited Main Gate', time: '12 mins ago', icon: <Activity size={14} />, color: '#10b981' }
            ].map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', paddingBottom: '1rem', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${log.color}15`, color: log.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{log.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{log.text}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
