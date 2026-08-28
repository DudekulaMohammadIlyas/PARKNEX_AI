import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, ShieldAlert, CheckCircle, Trash2, X, Users, Mail, UserCheck } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeActionsIndex, setActiveActionsIndex] = useState(null);
  
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'Student',
    phone: '+91 98765 00000',
    status: 'Active'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/users`, {
        params: { search: searchQuery, role: selectedRoleFilter }
      });
      if (Array.isArray(res.data)) {
        setUsers(res.data.map(u => ({
          id: u.id,
          name: u.name || u.email.split('@')[0],
          email: u.email,
          role: u.role ? u.role.charAt(0) + u.role.slice(1).toLowerCase() : 'Student',
          phone: u.phone || '-',
          status: 'Active',
          initial: (u.name || u.email).charAt(0).toUpperCase()
        })));
      }
    } catch (err) {
      console.warn("Backend users fetch failed, fallback mock:", err.message);
      setUsers([
        { id: 'STU-123', name: 'Alex Carter', email: 'alex@college.edu', role: 'Student', status: 'Active', initial: 'A' },
        { id: 'FAC-456', name: 'Dr. Smith', email: 'smith@college.edu', role: 'Faculty', status: 'Active', initial: 'D' },
        { id: 'SEC-789', name: 'Officer Davis', email: 'security@college.edu', role: 'Security', status: 'Active', initial: 'O' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 3000);
    return () => clearInterval(interval);
  }, [searchQuery, selectedRoleFilter]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;
    
    try {
      const res = await axios.post(`${BACKEND_URL}/users`, {
        name: newUserForm.name,
        email: newUserForm.email,
        role: newUserForm.role.toUpperCase(),
        phone: newUserForm.phone
      });
      if (res.data) {
        alert('User added successfully to Database!');
        fetchUsers();
      }
    } catch (err) {
      console.error("Backend error creating user:", err);
      const newUser = {
        id: `STU-${Math.floor(100 + Math.random() * 900)}`,
        name: newUserForm.name,
        email: newUserForm.email,
        role: newUserForm.role,
        status: 'Active',
        initial: newUserForm.name.charAt(0).toUpperCase()
      };
      setUsers([...users, newUser]);
      alert('User created locally.');
    } finally {
      setIsAddModalOpen(false);
      setNewUserForm({ name: '', email: '', role: 'Student', phone: '+91 98765 00000', status: 'Active' });
    }
  };

  const handleToggleStatus = (index) => {
    const updated = [...users];
    updated[index].status = updated[index].status === 'Active' ? 'Suspended' : 'Active';
    setUsers(updated);
    setActiveActionsIndex(null);
  };

  const handleDeleteUser = async (index, userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;

    try {
      await axios.delete(`${BACKEND_URL}/users/${userId}`);
      alert('User deleted successfully!');
      fetchUsers();
    } catch (err) {
      console.error("Backend delete user error:", err);
      setUsers(users.filter((_, i) => i !== index));
    } finally {
      setActiveActionsIndex(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (u.name && u.name.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q)) || (u.id && u.id.toLowerCase().includes(q));
    const matchesRole = selectedRoleFilter === 'All' || (u.role && u.role.toLowerCase() === selectedRoleFilter.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const exportToCSV = () => {
    const headers = ["Credentials ID", "Name", "Email", "Role", "Status"];
    const rows = filteredUsers.map(u => [u.id, `"${u.name}"`, `"${u.email}"`, u.role, u.status]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ParkNex_User_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF report.');
      return;
    }
    const htmlContent = `
      <html>
        <head>
          <title>ParkNex-AI User Registry Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
            h2 { color: #2563eb; margin-bottom: 5px; }
            p { color: #64748b; font-size: 14px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>ParkNex-AI Campus User Registry</h2>
          <p>Generated: ${new Date().toLocaleString()} • Total Users: ${filteredUsers.length}</p>
          <table>
            <thead>
              <tr>
                <th>Credentials ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUsers.map(u => `
                <tr>
                  <td>${u.id}</td>
                  <td>${u.name}</td>
                  <td>${u.email}</td>
                  <td>${u.role}</td>
                  <td>${u.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} color="var(--primary)" /> Campus User Registry
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Verify credentials and configure parking permission roles</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={exportToCSV} style={{ gap: '0.4rem', fontSize: '0.85rem' }}>
            📄 Export CSV
          </button>
          <button className="btn btn-outline" onClick={exportToPDF} style={{ gap: '0.4rem', fontSize: '0.85rem' }}>
            🖨️ Export PDF
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} /> Add User
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1.25rem', position: 'relative', overflow: 'visible', alignItems: 'center' }}>
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search campus users by name, email, or credentials ID..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Interactive Role Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['All', 'Student', 'Faculty', 'Security', 'Admin'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                border: '1.5px solid',
                transition: 'all 0.2s ease',
                borderColor: selectedRoleFilter === role ? '#2563eb' : '#cbd5e1',
                backgroundColor: selectedRoleFilter === role ? '#2563eb' : '#ffffff',
                color: selectedRoleFilter === role ? '#ffffff' : '#475569',
                boxShadow: selectedRoleFilter === role ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
              }}
            >
              {role === 'All' ? '⚡ All Users' : role}
            </button>
          ))}
        </div>

        {/* Dropdown Menu Fallback */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)} 
            style={{ 
              gap: '0.5rem', 
              backgroundColor: '#0f172a', 
              color: '#ffffff', 
              borderColor: '#1e293b',
              fontWeight: '800',
              padding: '0.5rem 1rem',
              borderRadius: '12px'
            }}
          >
            <Filter size={18} color="#60a5fa" /> Role: {selectedRoleFilter}
          </button>
          
          {isFilterDropdownOpen && (
            <div 
              style={{ 
                position: 'absolute', 
                top: '50px', 
                right: 0, 
                zIndex: 9999, 
                width: '190px', 
                padding: '0.5rem', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)', 
                backgroundColor: '#0f172a',
                borderRadius: '14px',
                border: '1.5px solid #334155'
              }}
            >
              {['All', 'Student', 'Faculty', 'Security', 'Admin'].map((role) => (
                <button 
                  key={role} 
                  style={{ 
                    width: '100%', 
                    border: 'none', 
                    borderRadius: '8px',
                    backgroundColor: selectedRoleFilter === role ? '#2563eb' : 'transparent', 
                    textAlign: 'left', 
                    padding: '0.6rem 0.9rem', 
                    cursor: 'pointer', 
                    color: '#ffffff',
                    fontWeight: selectedRoleFilter === role ? '900' : '600',
                    fontSize: '0.88rem',
                    marginBottom: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => {
                    setSelectedRoleFilter(role);
                    setIsFilterDropdownOpen(false);
                  }}
                >
                  <span>{role}</span>
                  {selectedRoleFilter === role && <span style={{ fontSize: '0.8rem' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'visible' }}>
        <div className="table-container" style={{ overflow: 'visible' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
          ) : (
            <table style={{ overflow: 'visible' }}>
              <thead>
                <tr>
                  <th>User / Email</th>
                  <th>Role</th>
                  <th>Credentials ID</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ overflow: 'visible' }}>
                {filteredUsers.map((user, i) => (
                  <tr key={user.id || i} style={{ position: 'relative' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="user-avatar" style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}>{user.initial}</div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.role}</span>
                    </td>
                    <td>
                      <code style={{ background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-main)' }}>{user.id}</code>
                    </td>
                    <td>
                      <span className={`badge ${user.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', position: 'relative', overflow: 'visible' }}>
                      <button 
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                        onClick={() => setActiveActionsIndex(activeActionsIndex === i ? null : i)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {activeActionsIndex === i && (
                        <div className="card animate-fade-in" style={{ position: 'absolute', right: '10px', top: '40px', zIndex: 70, width: '180px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: 'var(--shadow)', textAlign: 'left', background: 'var(--bg-sidebar)' }}>
                          <button 
                            className="nav-item" 
                            style={{ border: 'none', background: 'none', width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem', color: 'var(--text-main)' }}
                            onClick={() => handleToggleStatus(i)}
                          >
                            {user.status === 'Active' ? <ShieldAlert size={14} style={{ marginRight: '6px' }} /> : <UserCheck size={14} style={{ marginRight: '6px' }} />} {user.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button 
                            className="nav-item" 
                            style={{ border: 'none', background: 'none', width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem', color: 'var(--danger)' }}
                            onClick={() => handleDeleteUser(i, user.id, user.name)}
                          >
                            <Trash2 size={14} color="var(--danger)" style={{ marginRight: '6px' }} /> Delete User
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add User Modal popup */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <Plus size={22} color="var(--primary)" /> Add Campus User
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label>Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newUserForm.name} 
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} 
                  className="search-input"
                  style={{ paddingLeft: '1rem' }} 
                />
              </div>
              <div>
                <label>Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="sarah@college.edu"
                  value={newUserForm.email} 
                  onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} 
                  className="search-input"
                  style={{ paddingLeft: '1rem' }} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Role</label>
                  <select 
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="search-input"
                    style={{ paddingLeft: '1rem', color: 'var(--text-main)', backgroundColor: 'var(--bg-sidebar)', cursor: 'pointer' }}
                  >
                    <option style={{ backgroundColor: 'var(--bg-sidebar)' }}>Student</option>
                    <option style={{ backgroundColor: 'var(--bg-sidebar)' }}>Faculty</option>
                    <option style={{ backgroundColor: 'var(--bg-sidebar)' }}>Security</option>
                    <option style={{ backgroundColor: 'var(--bg-sidebar)' }}>Admin</option>
                  </select>
                </div>
                <div>
                  <label>Mobile Phone</label>
                  <input 
                    type="text" 
                    placeholder="+91 98765 00000"
                    value={newUserForm.phone} 
                    onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })} 
                    className="search-input"
                    style={{ paddingLeft: '1rem' }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
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
