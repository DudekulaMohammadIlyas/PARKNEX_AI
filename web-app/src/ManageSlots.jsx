import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Map, LayoutGrid, X, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabaseClient';

const BACKEND_URL = 'http://localhost:5000/api';

export default function ManageSlots({ occupancy, refreshData }) {
  const mockZones = [
    { id: '1', name: 'Zone A (Main)', capacity: 120, total: 120, type: 'Mixed', status: 'Active', isFacultyOnly: false },
    { id: '2', name: 'Zone B (Library)', capacity: 80, total: 80, type: '4-Wheeler', status: 'Active', isFacultyOnly: true },
    { id: '3', name: 'Zone C (Hostel)', capacity: 200, total: 200, type: '2-Wheeler', status: 'Active', isFacultyOnly: false },
  ];

  const [zones, setZones] = useState([]);
  const [isAddModal, setIsAddModal] = useState(false);
  const [isEditModal, setIsEditModal] = useState(false);
  const [activeZone, setActiveZone] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [zoneName, setZoneName] = useState('');
  const [zoneCapacity, setZoneCapacity] = useState(60);
  const [zoneType, setZoneType] = useState('Mixed');
  const [zoneStatus, setZoneStatus] = useState('Active');
  const [isFacultyOnly, setIsFacultyOnly] = useState(false);

  const fetchZonesFromBackend = async (isInitial = false) => {
    if (isInitial && zones.length === 0) setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/zones`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(z => ({
          id: z.id,
          name: z.name,
          capacity: z.total || 60,
          total: z.total || 60,
          type: z.type || 'Mixed',
          status: z.status || 'Active',
          isFacultyOnly: z.isFacultyOnly || false
        }));
        setZones(prev => {
          if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
          return mapped;
        });
      } else {
        setZones(mockZones);
      }
    } catch (err) {
      console.warn("Falling back to local occupancy zones:", err.message);
      if (occupancy?.zones && occupancy.zones.length > 0) {
        const mapped = occupancy.zones.map(z => ({
          id: z.id,
          name: z.name || `Zone ${z.id}`,
          capacity: z.total || 60,
          total: z.total || 60,
          type: 'Mixed',
          status: 'Active',
          isFacultyOnly: false
        }));
        setZones(prev => {
          if (JSON.stringify(prev) === JSON.stringify(mapped)) return prev;
          return mapped;
        });
      } else {
        setZones(mockZones);
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchZonesFromBackend(true);
    const interval = setInterval(() => fetchZonesFromBackend(false), 3000);

    const channel = supabase
      .channel('web-zones-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchZonesFromBackend(false);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchZonesFromBackend(false);
      });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    try {
      const res = await axios.post(`${BACKEND_URL}/zones`, {
        name: zoneName,
        total: Number(zoneCapacity),
        type: zoneType,
        status: zoneStatus,
        isFacultyOnly
      });
      if (res.data) {
        alert('Zone created successfully in Database!');
        fetchZonesFromBackend();
        if (refreshData) refreshData();
      }
    } catch (err) {
      console.error("Backend error creating zone:", err);
      const newZ = {
        id: Date.now().toString(),
        name: zoneName,
        capacity: Number(zoneCapacity),
        total: Number(zoneCapacity),
        type: zoneType,
        status: zoneStatus,
        isFacultyOnly
      };
      setZones([...zones, newZ]);
      alert('Zone created in local state.');
    } finally {
      setIsAddModal(false);
      setZoneName('');
      setZoneCapacity(60);
      setIsFacultyOnly(false);
    }
  };

  const handleOpenEdit = (zone) => {
    setActiveZone(zone);
    setZoneName(zone.name);
    setZoneCapacity(zone.capacity || zone.total || 60);
    setZoneType(zone.type || 'Mixed');
    setZoneStatus(zone.status || 'Active');
    setIsFacultyOnly(zone.isFacultyOnly || false);
    setIsEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeZone) return;

    try {
      await axios.put(`${BACKEND_URL}/zones/${activeZone.id}`, {
        name: zoneName,
        total: Number(zoneCapacity),
        type: zoneType,
        status: zoneStatus,
        isFacultyOnly
      });
      alert('Zone updated successfully in Database!');
      fetchZonesFromBackend();
      if (refreshData) refreshData();
    } catch (err) {
      console.error("Backend error updating zone:", err);
      setZones(zones.map(z => {
        if (z.id === activeZone.id) {
          return {
            ...z,
            name: zoneName,
            capacity: Number(zoneCapacity),
            total: Number(zoneCapacity),
            type: zoneType,
            status: zoneStatus,
            isFacultyOnly
          };
        }
        return z;
      }));
      alert('Zone updated locally.');
    } finally {
      setIsEditModal(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await axios.delete(`${BACKEND_URL}/zones/${id}`);
      alert('Zone deleted successfully from Database!');
      fetchZonesFromBackend();
      if (refreshData) refreshData();
    } catch (err) {
      console.error("Backend error deleting zone:", err);
      setZones(zones.filter(z => z.id !== id));
      alert('Zone removed locally.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Map size={24} color="var(--primary)" /> Manage Campus Zones
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Configure campus physical parking zones and priority faculty allocations</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setZoneName(''); setZoneCapacity(60); setIsFacultyOnly(false); setIsAddModal(true); }}>
          <Plus size={18} /> Add Zone
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading campus zones...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {zones.map((zone) => {
            const isActive = zone.status === 'Active';
            return (
              <div key={zone.id} className="card" style={{ borderLeft: isActive ? '4px solid var(--success)' : '4px solid var(--warning)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>{zone.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {zone.isFacultyOnly && <span className="badge badge-warning" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>Faculty Only</span>}
                      <span className={`badge ${isActive ? 'badge-success' : 'badge-warning'}`}>
                        {zone.status}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>Slot Capacity</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>{zone.capacity || zone.total} Slots</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>Zone Layout Mode</span>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>{zone.type}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn btn-outline" style={{ justifyContent: 'center', gap: '0.4rem' }} onClick={() => handleOpenEdit(zone)}>
                    <Edit2 size={16} /> Edit Zone
                  </button>
                  <button className="btn btn-outline" style={{ justifyContent: 'center', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', gap: '0.4rem' }} onClick={() => handleDelete(zone.id, zone.name)}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Zone Modal popup */}
      {(isAddModal || isEditModal) && (
        <div className="modal-overlay" onClick={() => { setIsAddModal(false); setIsEditModal(false); }}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>{isAddModal ? 'Create New Zone' : 'Update Zone Details'}</h3>
              <button onClick={() => { setIsAddModal(false); setIsEditModal(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={isAddModal ? handleAddSubmit : handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label>Zone Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Zone D (Hostel)"
                  value={zoneName}
                  onChange={e => setZoneName(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem' }}
                />
              </div>
              <div>
                <label>Capacity Slots</label>
                <input 
                  type="number" 
                  required
                  value={zoneCapacity}
                  onChange={e => setZoneCapacity(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem' }}
                />
              </div>
              <div>
                <label>Zone Vehicle Restrictions</label>
                <select 
                  value={zoneType}
                  onChange={e => setZoneType(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem', color: 'var(--text-main)', backgroundColor: 'var(--bg-sidebar)' }}
                >
                  <option style={{ backgroundColor: 'var(--bg-sidebar)' }}>Mixed</option>
                  <option style={{ backgroundColor: 'var(--bg-sidebar)' }}>4-Wheeler</option>
                  <option style={{ backgroundColor: 'var(--bg-sidebar)' }}>2-Wheeler</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input 
                  type="checkbox"
                  id="facultyCheck"
                  checked={isFacultyOnly}
                  onChange={e => setIsFacultyOnly(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="facultyCheck" style={{ margin: 0, cursor: 'pointer', fontWeight: '700', color: 'var(--text-main)' }}>
                  Faculty Priority Only Zone
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setIsAddModal(false); setIsEditModal(false); }} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{isAddModal ? 'Create' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
