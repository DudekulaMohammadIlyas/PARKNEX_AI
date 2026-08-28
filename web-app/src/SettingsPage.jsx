import React, { useState, useEffect } from 'react';
import { Shield, Bell, Eye, Globe, Save, Sparkles, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function SettingsPage() {
  const [institutionName, setInstitutionName] = useState(() => {
    const cached = localStorage.getItem('parknex_system_config');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.institutionName) return parsed.institutionName;
      } catch (e) {}
    }
    return 'Saveetha University';
  });
  const [timezone, setTimezone] = useState('(GMT+05:30) India Standard Time');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [plateRecognition, setPlateRecognition] = useState(true);
  const [suspiciousActivity, setSuspiciousActivity] = useState(true);
  const [unauthorizedEntry, setUnauthorizedEntry] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Fetch authoritative configuration from backend PostgreSQL database
    axios.get(`${BACKEND_URL}/system/settings`)
      .then(res => {
        if (res.data?.settings) {
          const s = res.data.settings;
          if (s.institutionName) setInstitutionName(s.institutionName);
          if (s.timezone) setTimezone(s.timezone);
          if (s.confidenceThreshold) setConfidenceThreshold(s.confidenceThreshold);
          if (s.plateRecognition !== undefined) setPlateRecognition(s.plateRecognition);
          if (s.suspiciousActivity !== undefined) setSuspiciousActivity(s.suspiciousActivity);
          if (s.unauthorizedEntry !== undefined) setUnauthorizedEntry(s.unauthorizedEntry);
          localStorage.setItem('parknex_system_config', JSON.stringify(s));
        }
      })
      .catch(err => console.warn("Backend system settings fetch fallback:", err.message));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const configData = {
      institutionName,
      timezone,
      confidenceThreshold,
      plateRecognition,
      suspiciousActivity,
      unauthorizedEntry
    };

    // Save locally
    localStorage.setItem('parknex_system_config', JSON.stringify(configData));

    try {
      await axios.post(`${BACKEND_URL}/system/settings`, configData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      alert('System configuration updated & saved to Database successfully!');
    } catch (err) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      alert('System configuration saved locally.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={24} color="var(--primary)" /> System Settings
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage credentials constraints and confidence boundaries</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} style={{ minWidth: '150px', justifyContent: 'center' }}>
          {isSaving ? (
            <>Saving...</>
          ) : saveSuccess ? (
            <><CheckCircle2 size={18} /> Saved!</>
          ) : (
            <><Save size={18} /> Save Changes</>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* General Config Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <Globe size={20} color="var(--primary)" /> General Configuration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Institution Name</label>
              <input 
                type="text" 
                className="search-input" 
                value={institutionName} 
                onChange={e => setInstitutionName(e.target.value)} 
                style={{ paddingLeft: '1rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Timezone</label>
              <select 
                className="search-input" 
                value={timezone} 
                onChange={e => setTimezone(e.target.value)} 
                style={{ paddingLeft: '1rem', cursor: 'pointer', color: 'var(--text-main)', backgroundColor: 'var(--bg-sidebar)' }}
              >
                <option style={{ backgroundColor: 'var(--bg-sidebar)' }}>(GMT+05:30) India Standard Time</option>
                <option style={{ backgroundColor: 'var(--bg-sidebar)' }}>(GMT+00:00) UTC</option>
                <option style={{ backgroundColor: 'var(--bg-sidebar)' }}>(GMT-05:00) Eastern Standard Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Parameters Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <Eye size={20} color="#8b5cf6" /> AI Vision Parameters
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Confidence Threshold</label>
                <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--primary)' }}>{confidenceThreshold}%</span>
              </div>
              <input 
                type="range" 
                style={{ width: '100%', cursor: 'pointer', height: '6px', borderRadius: '3px', accentColor: 'var(--primary)' }} 
                min="50" 
                max="99" 
                value={confidenceThreshold} 
                onChange={e => setConfidenceThreshold(Number(e.target.value))} 
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>Real-time Plate Recognition</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Enable OCR for all entry cameras</div>
              </div>
              <input 
                type="checkbox" 
                checked={plateRecognition} 
                onChange={e => setPlateRecognition(e.target.checked)} 
                style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary)' }} 
              />
            </div>
          </div>
        </div>

        {/* Security & Alerts Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <Shield size={20} color="var(--danger)" /> Security & Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>Suspicious Activity Detection</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Alert when a vehicle lingers without parking</div>
              </div>
              <input 
                type="checkbox" 
                checked={suspiciousActivity} 
                onChange={e => setSuspiciousActivity(e.target.checked)} 
                style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary)' }} 
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>Unauthorized Entry Notifications</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Push alerts for blacklisted number plates</div>
              </div>
              <input 
                type="checkbox" 
                checked={unauthorizedEntry} 
                onChange={e => setUnauthorizedEntry(e.target.checked)} 
                style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary)' }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
