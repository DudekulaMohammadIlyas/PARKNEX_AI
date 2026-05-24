import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function ManageSlots({ occupancy, refreshData }) {
  const mockZones = [
    { id: 1, name: 'Zone A (Main)', capacity: 120, type: 'Mixed', status: 'Active' },
    { id: 2, name: 'Zone B (Library)', capacity: 80, type: '4-Wheeler', status: 'Active' },
    { id: 3, name: 'Zone C (Hostel)', capacity: 200, type: '2-Wheeler', status: 'Maintenance' },
  ];

  const [zones, setZones] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeZone, setActiveZone] = useState(null);
  
  const [newZoneForm, setNewZoneForm] = useState({
    name: '',
    capacity: 60,
    type: 'Mixed',
    status: 'Active'
  });

  const [editZoneForm, setEditZoneForm] = useState({
    name: '',
    capacity: 60,
    type: 'Mixed',
    status: 'Active'
  });

  useEffect(() => {
    if (occupancy?.zones && occupancy.zones.length > 0) {
      // Map occupancy zones with mock structures if missing details
      const mapped = occupancy.zones.map(z => ({
        id: z.id,
        name: z.name || `Zone ${z.id}`,
        capacity: z.total || 60,
        type: 'Mixed',
        status: 'Active'
      }));
      setZones(mapped);
    } else {
      setZones(mockZones);
    }
  }, [occupancy]);

  const handleAddZone = (e) => {
    e.preventDefault();
    if (!newZoneForm.name) return;

    const newZone = {
      id: zones.length > 0 ? Math.max(...zones.map(z => Number(z.id) || 0)) + 1 : 1,
      name: newZoneForm.name,
      capacity: Number(newZoneForm.capacity),
      type: newZoneForm.type,
      status: newZoneForm.status
    };

    setZones([...zones, newZone]);
    setIsAddModalOpen(false);
    setNewZoneForm({ name: '', capacity: 60, type: 'Mixed', status: 'Active' });
    alert('Zone created successfully!');
  };

  const handleOpenEdit = (zone) => {
    setActiveZone(zone);
    setEditZoneForm({
      name: zone.name,
      capacity: zone.capacity,
      type: zone.type,
      status: zone.status
    });
    setIsEditModalOpen(true);
  };

  const handleEditZone = (e) => {
    e.preventDefault();
    setZones(zones.map(z => {
      if (z.id === activeZone.id) {
        return {
          ...z,
          name: editZoneForm.name,
          capacity: Number(editZoneForm.capacity),
          type: editZoneForm.type,
          status: editZoneForm.status
        };
      }
      return z;
    }));
    setIsEditModalOpen(false);
    alert('Zone details updated successfully!');
  };

  const handleDeleteZone = (id, name) => {
    if (window.confirm(`Are you sure you want to delete parking ${name}?`)) {
      setZones(zones.filter(z => z.id !== id));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <h2 className="section-title">Manage Zones & Slots</h2>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Add Zone
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {zones.map((zone) => (
          <div key={zone.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{zone.name}</h3>
                <span className={`badge ${zone.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                  {zone.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Capacity</span>
                  <span style={{ fontWeight: '700' }}>{zone.capacity} Slots</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Type</span>
                  <span style={{ fontWeight: '700' }}>{zone.type}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => handleOpenEdit(zone)}>
                <Edit2 size={16} /> Edit
              </button>
              <button 
                className="btn btn-outline" 
                style={{ justifyContent: 'center', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                onClick={() => handleDeleteZone(zone.id, zone.name)}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Zone Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={22} color="var(--primary)" /> Add New Zone
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddZone} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Zone Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Zone D (Audi)"
                  value={newZoneForm.name} 
                  onChange={e => setNewZoneForm({ ...newZoneForm, name: e.target.value })} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Total Capacity</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={newZoneForm.capacity} 
                  onChange={e => setNewZoneForm({ ...newZoneForm, capacity: e.target.value })} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Zone Type</label>
                  <select 
                    value={newZoneForm.type}
                    onChange={e => setNewZoneForm({ ...newZoneForm, type: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option>Mixed</option>
                    <option>4-Wheeler</option>
                    <option>2-Wheeler</option>
                    <option>EV Charging</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Status</label>
                  <select 
                    value={newZoneForm.status}
                    onChange={e => setNewZoneForm({ ...newZoneForm, status: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option>Active</option>
                    <option>Maintenance</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Add Zone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Zone Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={20} color="var(--primary)" /> Edit Zone Details
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditZone} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Zone Name</label>
                <input 
                  type="text" 
                  required
                  value={editZoneForm.name} 
                  onChange={e => setEditZoneForm({ ...editZoneForm, name: e.target.value })} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Total Capacity</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={editZoneForm.capacity} 
                  onChange={e => setEditZoneForm({ ...editZoneForm, capacity: e.target.value })} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Zone Type</label>
                  <select 
                    value={editZoneForm.type}
                    onChange={e => setEditZoneForm({ ...editZoneForm, type: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option>Mixed</option>
                    <option>4-Wheeler</option>
                    <option>2-Wheeler</option>
                    <option>EV Charging</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Status</label>
                  <select 
                    value={editZoneForm.status}
                    onChange={e => setEditZoneForm({ ...editZoneForm, status: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option>Active</option>
                    <option>Maintenance</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
