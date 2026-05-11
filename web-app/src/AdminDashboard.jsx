import React, { useState } from 'react';
import { Users, LayoutGrid, Settings, TrendingUp, Download, X } from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard({ occupancy, events, refreshData, BACKEND_URL }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCapacity, setNewZoneCapacity] = useState('');

  const handleAddZone = async () => {
    if (!newZoneName || !newZoneCapacity) return alert('Please fill all fields');
    try {
      await axios.post(`${BACKEND_URL}/zones`, {
        name: newZoneName,
        total: parseInt(newZoneCapacity)
      });
      setShowAddModal(false);
      setNewZoneName('');
      setNewZoneCapacity('');
      if (refreshData) await refreshData();
      else window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to add zone: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditCapacity = async (id) => {
    const newCap = prompt("Enter new capacity:");
    if (newCap && !isNaN(newCap)) {
      try {
        await axios.put(`${BACKEND_URL}/zones/${id}`, {
          total: parseInt(newCap)
        });
        if (refreshData) await refreshData();
        else window.location.reload();
      } catch (err) {
        alert('Failed to update capacity');
      }
    }
  };

  const handleRenameZone = async (id, currentName) => {
    const newName = prompt("Enter new zone name:", currentName);
    if (newName && newName !== currentName) {
      try {
        await axios.put(`${BACKEND_URL}/zones/${id}`, {
          name: newName
        });
        if (refreshData) await refreshData();
        else window.location.reload();
      } catch (err) {
        alert('Failed to rename zone');
      }
    }
  };

  const handleExport = () => {
    if (!occupancy || !occupancy.zones) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Zone Name,Total Capacity,Occupied\n"
      + occupancy.zones.map(z => `${z.name},${z.total},${z.occupied}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "parknex_zones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="main-content">
      <header className="top-bar">
        <div>
          <h1 className="page-title">Admin Console</h1>
          <p style={{ color: 'var(--text-muted)' }}>System configuration & Analytics</p>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={16} /> Export Data
        </button>
      </header>

      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-header">
            <span>Total Registered Users</span>
            <Users className="stat-icon primary" size={40} style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }} />
          </div>
          <div className="stat-value">1,248</div>
          <div className="stat-subtitle">Students & Staff</div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-header">
            <span>Active Zones</span>
            <LayoutGrid className="stat-icon warning" size={40} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }} />
          </div>
          <div className="stat-value">{occupancy?.zones?.length || 0}</div>
          <div className="stat-subtitle">Total Capacity: {occupancy?.totalSlots || 0}</div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-header">
            <span>Avg. Daily Entries</span>
            <TrendingUp className="stat-icon success" size={40} />
          </div>
          <div className="stat-value">845</div>
          <div className="stat-subtitle">+5% this month</div>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Zone Configuration</h2>
          <button className="btn" style={{ border: '1px solid var(--border)', background: 'var(--bg-color)' }} onClick={() => setShowAddModal(true)}>
            + Add Zone
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Zone Name</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Total Capacity</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Current Occupancy</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!occupancy || !occupancy.zones) ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading zones...</td></tr>
              ) : occupancy.zones.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No zones configured.</td></tr>
              ) : (
                occupancy.zones.map(zone => (
                  <tr key={zone.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--text-main)' }}>{zone.name}</td>
                    <td style={{ padding: '1.25rem 1rem' }}>{zone.total}</td>
                    <td style={{ padding: '1.25rem 1rem' }}>{zone.occupied}</td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <span style={{ padding: '0.35rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>Active</span>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleRenameZone(zone.id, zone.name)}
                          style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                          title="Rename Zone"
                        >
                          <Settings size={18} />
                        </button>
                        <button 
                          onClick={() => handleEditCapacity(zone.id)}
                          style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                          title="Edit Capacity"
                        >
                          <LayoutGrid size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', background: 'white', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>New Parking Zone</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Configure a new campus parking area</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>Zone Name</label>
              <input 
                value={newZoneName} 
                onChange={e => setNewZoneName(e.target.value)} 
                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-color)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }} 
                placeholder="e.g. North Engineering Block" 
              />
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>Total Capacity</label>
              <input 
                type="number" 
                value={newZoneCapacity} 
                onChange={e => setNewZoneCapacity(e.target.value)} 
                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-color)', fontSize: '1rem', outline: 'none' }} 
                placeholder="e.g. 150" 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn" 
                style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-color)', border: '1px solid var(--border)' }} 
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 2, justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }} 
                onClick={handleAddZone}
              >
                Create Area
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
