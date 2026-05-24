import React from 'react';
import { Users, Car, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminDashboard({ occupancy, events }) {
  const stats = [
    { label: 'Total Users', value: '2,845', icon: <Users />, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Active Vehicles', value: '1,432', icon: <Car />, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Today\'s Entries', value: '892', icon: <CheckCircle />, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Security Alerts', value: '12', icon: <AlertTriangle />, color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="card stat-card">
            <div className="stat-icon-box" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="label">{stat.label}</span>
              <span className="value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Weekly Parking Volume</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>Last 7 Days</span>
          </div>
          {/* Mock Bar Chart */}
          <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '1rem 0' }}>
            {[350, 280, 520, 410, 600, 220, 180].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '100%', height: `${(h/600)*100}%`, background: '#2563eb', borderRadius: '4px 4px 0 0' }}></div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>User Demographics</h3>
          <div style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Donut Chart Mock */}
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '20px solid #2563eb', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>100%</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total</div>
              </div>
              {/* Overlays for different segments would go here */}
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Students', value: '65%', color: '#2563eb' },
              { label: 'Faculty', value: '25%', color: '#10b981' },
              { label: 'Visitors', value: '10%', color: '#f59e0b' }
            ].map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></div>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>{d.label}</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
