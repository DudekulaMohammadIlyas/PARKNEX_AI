import React, { useState } from 'react';
import { Search, Filter, Plus, MoreVertical, ShieldAlert, CheckCircle, Trash2, X } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([
    { name: 'Alex Carter', email: 'alex@college.edu', role: 'Student', id: 'STU-123', status: 'Active', initial: 'A' },
    { name: 'Dr. Smith', email: 'smith@college.edu', role: 'Faculty', id: 'FAC-456', status: 'Active', initial: 'D' },
    { name: 'John Doe', email: 'john@college.edu', role: 'Student', id: 'STU-789', status: 'Suspended', initial: 'J' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeActionsIndex, setActiveActionsIndex] = useState(null);
  
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'Student',
    id: '',
    status: 'Active'
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;
    
    const newUser = {
      name: newUserForm.name,
      email: newUserForm.email,
      role: newUserForm.role,
      id: newUserForm.id || `${newUserForm.role.substring(0,3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      status: newUserForm.status,
      initial: newUserForm.name.charAt(0).toUpperCase()
    };

    setUsers([...users, newUser]);
    setIsAddModalOpen(false);
    setNewUserForm({ name: '', email: '', role: 'Student', id: '', status: 'Active' });
    alert('User successfully added!');
  };

  const handleToggleStatus = (index) => {
    const updated = [...users];
    updated[index].status = updated[index].status === 'Active' ? 'Suspended' : 'Active';
    setUsers(updated);
    setActiveActionsIndex(null);
  };

  const handleDeleteUser = (index) => {
    if (window.confirm(`Are you sure you want to delete ${users[index].name}?`)) {
      setUsers(users.filter((_, i) => i !== index));
      setActiveActionsIndex(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'All' || user.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <div className="section-header">
        <h2 className="section-title">User Management</h2>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', position: 'relative', overflow: 'visible' }}>
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search users by name, email, or ID..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ position: 'relative' }}>
          <button className="btn btn-outline" onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}>
            <Filter size={18} /> Role: {selectedRoleFilter}
          </button>
          
          {isFilterDropdownOpen && (
            <div className="card animate-fade-in" style={{ position: 'absolute', top: '50px', right: 0, zIndex: 60, width: '180px', padding: '0.5rem', boxShadow: 'var(--shadow)' }}>
              {['All', 'Student', 'Faculty', 'Security', 'Admin'].map((role) => (
                <button 
                  key={role} 
                  className="nav-item" 
                  style={{ width: '100%', border: 'none', background: selectedRoleFilter === role ? 'var(--primary-light)' : 'none', textAlign: 'left', padding: '0.5rem 0.75rem', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedRoleFilter(role);
                    setIsFilterDropdownOpen(false);
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'visible' }}>
        <div className="table-container" style={{ overflow: 'visible' }}>
          <table style={{ overflow: 'visible' }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>ID Number</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ overflow: 'visible' }}>
              {filteredUsers.map((user, i) => (
                <tr key={i} style={{ position: 'relative' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{user.initial}</div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.id}</td>
                  <td>
                    <span className={`badge ${user.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', position: 'relative', overflow: 'visible' }}>
                    <button 
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                      onClick={() => setActiveActionsIndex(activeActionsIndex === i ? null : i)}
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {activeActionsIndex === i && (
                      <div className="card animate-fade-in" style={{ position: 'absolute', right: '10px', top: '35px', zIndex: 70, width: '160px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: 'var(--shadow)', textAlign: 'left' }}>
                        <button 
                          className="nav-item" 
                          style={{ border: 'none', background: 'none', width: '100%', fontSize: '0.85rem', padding: '0.4rem 0.6rem', color: 'var(--text-main)' }}
                          onClick={() => handleToggleStatus(i)}
                        >
                          {user.status === 'Active' ? <ShieldAlert size={14} /> : <CheckCircle size={14} />} {user.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button 
                          className="nav-item" 
                          style={{ border: 'none', background: 'none', width: '100%', fontSize: '0.85rem', padding: '0.4rem 0.6rem', color: 'var(--danger)' }}
                          onClick={() => handleDeleteUser(i)}
                        >
                          <Trash2 size={14} color="var(--danger)" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={22} color="var(--primary)" /> Add New Campus User
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newUserForm.name} 
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="sarah@college.edu"
                  value={newUserForm.email} 
                  onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Role</label>
                  <select 
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option>Student</option>
                    <option>Faculty</option>
                    <option>Security</option>
                    <option>Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-main)' }}>ID Number (Opt)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. STU-492"
                    value={newUserForm.id} 
                    onChange={e => setNewUserForm({ ...newUserForm, id: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
