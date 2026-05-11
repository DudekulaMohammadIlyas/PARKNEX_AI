import React, { useState, useEffect } from 'react';
import { Activity, QrCode, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import { supabase } from './supabaseClient';

export default function StudentDashboard({ occupancy, onLogout, BACKEND_URL }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [passActive, setPassActive] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, []);

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      await axios.post(`${BACKEND_URL}/checkout`, { email, planId: 'monthly' });
      setPassActive(true);
      alert('Payment Successful! Your pass is now active.');
    } catch (error) {
      alert('Payment failed.');
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="main-content">
      <header className="top-bar">
        <div>
          <h1 className="page-title">Student Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome back! Manage your passes here.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: activeTab === 'overview' ? 'var(--primary)' : 'var(--bg-color)', color: activeTab === 'overview' ? '#fff' : 'var(--text)', border: 'none' }} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className="btn" style={{ background: activeTab === 'billing' ? 'var(--primary)' : 'var(--bg-color)', color: activeTab === 'billing' ? '#fff' : 'var(--text)', border: 'none' }} onClick={() => setActiveTab('billing')}>Billing</button>
          <button className="btn" style={{ border: '1px solid var(--border)', background: 'var(--bg-color)' }} onClick={onLogout}>Logout</button>
        </div>
      </header>

      {activeTab === 'overview' && (
        <>

      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-header">
            <span>My Vehicle</span>
            <Activity className="stat-icon success" size={40} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>UP14 AB1234</div>
          <div className="stat-subtitle">Status: <span style={{color: 'var(--success)', fontWeight: 'bold'}}>INSIDE</span> (Zone B)</div>
        </div>
        
        <div className="card stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'white', borderRadius: '16px' }}>
              <QRCode value={"STUDENT_PASS_UP14AB1234_PRIYA"} size={80} />
            </div>
            <div style={{ fontWeight: '600' }}>My Digital Pass</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Live Availability</h2>
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {(!occupancy || !occupancy.zones) ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading parking availability...</p>
          ) : occupancy.zones.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No zones available.</p>
          ) : (
            occupancy.zones.map(zone => {
              const available = zone.total - zone.occupied;
              const ratio = zone.occupied / zone.total;
              let color = 'var(--success)';
              let bg = 'rgba(16, 185, 129, 0.1)';
              if (ratio > 0.9) { color = 'var(--danger)'; bg = 'rgba(239, 68, 68, 0.1)'; }
              else if (ratio > 0.7) { color = 'var(--warning)'; bg = 'rgba(245, 158, 11, 0.1)'; }

              return (
                <div key={zone.id} style={{ padding: '1.5rem', background: 'var(--bg-color)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{zone.name}</span>
                    <div style={{ padding: '0.25rem', background: bg, borderRadius: '8px' }}>
                      <MapPin size={16} color={color} />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color }}>{available} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>/ {zone.total}</span></div>
                </div>
              );
            })
          )}
        </div>
      </div>
      </>)}

      {activeTab === 'billing' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Billing & Passes</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ border: '1px solid var(--primary)', borderRadius: '16px', padding: '1.5rem', position: 'relative', background: 'rgba(79, 70, 229, 0.02)' }}>
              {passActive && <div style={{ position: 'absolute', top: 16, right: 16, color: 'var(--primary)' }}><CheckCircle /></div>}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Monthly Pass</h3>
              <p style={{ fontSize: '2rem', fontWeight: '800', margin: '1rem 0' }}>₹2,500<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></p>
              <ul style={{ listStyle: 'none', padding: 0, gap: '0.5rem', display: 'flex', flexDirection: 'column', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                <li>✓ Unlimited access to all standard zones</li>
                <li>✓ 24/7 AI-monitored security</li>
                <li>✓ Digital QR entry</li>
              </ul>
              
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center' }} 
                onClick={handlePurchase}
                disabled={isProcessing || passActive}
              >
                {isProcessing ? 'Processing...' : (passActive ? 'Currently Active' : 'Purchase Pass')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
