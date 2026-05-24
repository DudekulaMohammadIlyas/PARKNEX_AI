import React, { useState } from 'react';
import { Shield, Bell, Eye, Globe, Save } from 'lucide-react';

export default function SettingsPage() {
  const [institutionName, setInstitutionName] = useState('ParkNex University');
  const [timezone, setTimezone] = useState('(GMT+05:30) India Standard Time');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [plateRecognition, setPlateRecognition] = useState(true);
  const [suspiciousActivity, setSuspiciousActivity] = useState(true);
  const [unauthorizedEntry, setUnauthorizedEntry] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('System configuration updated successfully!');
    }, 1000);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="section-header">
        <h2 className="section-title">System Settings</h2>
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} style={{ minWidth: '140px', justifyContent: 'center' }}>
          {isSaving ? (
            <>Saving...</>
          ) : (
            <><Save size={18} /> Save Changes</>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={20} color="#2563eb" /> General Configuration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Institution Name</label>
              <input 
                type="text" 
                className="search-input" 
                value={institutionName} 
                onChange={e => setInstitutionName(e.target.value)} 
                style={{ paddingLeft: '1rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>Timezone</label>
              <select 
                className="search-input" 
                value={timezone} 
                onChange={e => setTimezone(e.target.value)} 
                style={{ paddingLeft: '1rem', cursor: 'pointer' }}
              >
                <option>(GMT+05:30) India Standard Time</option>
                <option>(GMT+00:00) UTC</option>
                <option>(GMT-05:00) Eastern Standard Time</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={20} color="#8b5cf6" /> AI Vision Parameters
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Confidence Threshold</label>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2563eb' }}>{confidenceThreshold}%</span>
              </div>
              <input 
                type="range" 
                style={{ width: '100%', cursor: 'pointer' }} 
                min="50" 
                max="99" 
                value={confidenceThreshold} 
                onChange={e => setConfidenceThreshold(Number(e.target.value))} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Real-time Plate Recognition</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Enable OCR for all entry cameras</div>
              </div>
              <input 
                type="checkbox" 
                checked={plateRecognition} 
                onChange={e => setPlateRecognition(e.target.checked)} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }} 
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} color="#ef4444" /> Security & Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Suspicious Activity Detection</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Alert when a vehicle lingers without parking</div>
              </div>
              <input 
                type="checkbox" 
                checked={suspiciousActivity} 
                onChange={e => setSuspiciousActivity(e.target.checked)} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Unauthorized Entry Notifications</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Push alerts for blacklisted number plates</div>
              </div>
              <input 
                type="checkbox" 
                checked={unauthorizedEntry} 
                onChange={e => setUnauthorizedEntry(e.target.checked)} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
