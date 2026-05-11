import React from 'react';
import { CarFront, ShieldCheck, User, BarChart } from 'lucide-react';

export default function Auth({ onLogin }) {
  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ width: '400px', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        
        <div className="logo-container" style={{ flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px' }}>
            <CarFront size={48} color="var(--primary)" />
          </div>
          <span className="logo-text" style={{ fontSize: '2rem' }}>ParkNex-AI</span>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
            Select your role to access the platform.
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            onClick={() => onLogin('STUDENT')}
            className="role-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--success)' }}>
              <User size={24} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600' }}>Student Portal</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>View availability & passes</div>
            </div>
          </button>

          <button 
            onClick={() => onLogin('SECURITY')}
            className="role-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: 'var(--warning)' }}>
              <ShieldCheck size={24} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600' }}>Security Dashboard</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live AI feeds & alerts</div>
            </div>
          </button>

          <button 
            onClick={() => onLogin('ADMIN')}
            className="role-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', color: 'var(--primary)' }}>
              <BarChart size={24} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600' }}>Admin Console</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analytics & Configuration</div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
