import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Clock, 
  ShieldAlert, 
  Car, 
  AlertTriangle, 
  Megaphone, 
  Info, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  CreditCard,
  Users,
  Video,
  Server,
  Activity
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function NotificationDrawer({ isOpen, onClose, userEmail, userRole, onUnreadCountChange, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchNotifications = async () => {
    try {
      const emailParam = encodeURIComponent(userEmail || `${(userRole || 'student').toLowerCase()}@college.edu`);
      const roleParam = encodeURIComponent(userRole || 'STUDENT');
      const res = await axios.get(`${BACKEND_URL}/notifications?email=${emailParam}&role=${roleParam}`);
      if (res.data?.success) {
        const list = res.data.notifications || [];
        const unread = res.data.unreadCount || 0;
        setNotifications(list);
        setUnreadCount(unread);
        if (onUnreadCountChange) onUnreadCountChange(unread);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, [isOpen, userEmail, userRole]);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${BACKEND_URL}/notifications/${id}/read`, { email: userEmail, role: userRole });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => {
        const next = Math.max(0, prev - 1);
        if (onUnreadCountChange) onUnreadCountChange(next);
        return next;
      });
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${BACKEND_URL}/notifications/read-all`, { email: userEmail, role: userRole });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (e) {}
  };

  const handleClearAll = async () => {
    try {
      const emailParam = encodeURIComponent(userEmail || `${(userRole || 'student').toLowerCase()}@college.edu`);
      const roleParam = encodeURIComponent(userRole || 'STUDENT');
      await axios.delete(`${BACKEND_URL}/notifications/clear-all?email=${emailParam}&role=${roleParam}`);
      setNotifications([]);
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    try {
      const emailParam = encodeURIComponent(userEmail || `${(userRole || 'student').toLowerCase()}@college.edu`);
      const roleParam = encodeURIComponent(userRole || 'STUDENT');
      await axios.delete(`${BACKEND_URL}/notifications/${id}?email=${emailParam}&role=${roleParam}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const target = notifications.find(n => n.id === id);
        const next = target && !target.isRead ? Math.max(0, prev - 1) : prev;
        if (onUnreadCountChange) onUnreadCountChange(next);
        return next;
      });
    } catch (e) {}
  };

  const getRoleTabs = () => {
    const r = (userRole || 'STUDENT').toUpperCase();
    if (r === 'STUDENT' || r === 'FACULTY') {
      return [
        { key: 'ALL', label: 'All' },
        { key: 'UNREAD', label: `Unread (${unreadCount})` },
        { key: 'BOOKINGS', label: 'Bookings & Expiry' },
        { key: 'VEHICLES', label: 'Vehicles & Pass' },
        { key: 'ANNOUNCEMENT', label: 'News' }
      ];
    } else if (r === 'SECURITY') {
      return [
        { key: 'ALL', label: 'All' },
        { key: 'UNREAD', label: `Unread (${unreadCount})` },
        { key: 'GATE', label: 'Gate & CCTV' },
        { key: 'VIOLATIONS', label: 'Violations' },
        { key: 'VISITORS', label: 'Visitors' },
        { key: 'EMERGENCY', label: 'Alerts' }
      ];
    } else {
      return [
        { key: 'ALL', label: 'All' },
        { key: 'UNREAD', label: `Unread (${unreadCount})` },
        { key: 'CAPACITY', label: 'Capacity' },
        { key: 'SYSTEM', label: 'System Health' },
        { key: 'ANNOUNCEMENT', label: 'Broadcasts' }
      ];
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.isRead;
    if (activeTab === 'BOOKINGS') return n.category === 'PARKING_EXPIRY' || n.category === 'PARKING_EXPIRED' || n.category === 'BOOKING';
    if (activeTab === 'VEHICLES') return n.category === 'VEHICLE_ENTRY' || n.category === 'VEHICLE_EXIT' || n.category === 'PASS';
    if (activeTab === 'GATE') return n.category === 'GATE' || n.category === 'GATE_ALERT' || n.category === 'SECURITY' || n.category === 'CCTV';
    if (activeTab === 'VIOLATIONS') return n.category === 'VIOLATION';
    if (activeTab === 'VISITORS') return n.category === 'VISITOR';
    if (activeTab === 'CAPACITY') return n.category === 'CAPACITY' || n.category === 'PARKING';
    if (activeTab === 'SYSTEM') return n.category === 'SYSTEM' || n.category === 'AUDIT' || n.category === 'ANALYTICS';
    if (activeTab === 'EMERGENCY') return n.category === 'EMERGENCY' || n.priority === 'CRITICAL';
    if (activeTab === 'ANNOUNCEMENT') return n.category === 'ANNOUNCEMENT' || n.category === 'EMERGENCY';
    return true;
  });

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return { bg: '#FFE4E6', text: '#E11D48', border: '#E11D48', label: 'CRITICAL' };
      case 'HIGH':
        return { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B', label: 'HIGH' };
      case 'LOW':
        return { bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1', label: 'LOW' };
      default:
        return { bg: '#E0E7FF', text: '#4F46E5', border: '#6366F1', label: 'NORMAL' };
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'PARKING_EXPIRY':
      case 'PARKING_EXPIRED':
        return <Clock size={18} color="#D97706" />;
      case 'BOOKING':
        return <Calendar size={18} color="#4F46E5" />;
      case 'VEHICLE_ENTRY':
      case 'VEHICLE_EXIT':
        return <Car size={18} color="#10B981" />;
      case 'PASS':
        return <CreditCard size={18} color="#059669" />;
      case 'SECURITY':
      case 'VIOLATION':
      case 'GATE_ALERT':
        return <ShieldAlert size={18} color="#E11D48" />;
      case 'CCTV':
      case 'GATE':
        return <Video size={18} color="#2563EB" />;
      case 'VISITOR':
        return <Users size={18} color="#F59E0B" />;
      case 'CAPACITY':
      case 'PARKING':
        return <Activity size={18} color="#8B5CF6" />;
      case 'SYSTEM':
      case 'AUDIT':
      case 'ANALYTICS':
        return <Server size={18} color="#0284C7" />;
      case 'EMERGENCY':
        return <AlertTriangle size={18} color="#E11D48" />;
      case 'ANNOUNCEMENT':
        return <Megaphone size={18} color="#4F46E5" />;
      default:
        return <Info size={18} color="#2563EB" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 99998
        }}
      />

      {/* 2. Solid, Opaque Right Side Drawer Panel */}
      <div 
        className="animate-slide-in"
        style={{ 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          bottom: 0,
          width: '450px', 
          maxWidth: '100vw',
          height: '100vh',
          zIndex: 99999, 
          boxShadow: '-12px 0 35px rgba(0, 0, 0, 0.22)', 
          padding: 0, 
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* HEADER */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} color="#4F46E5" />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-6px', backgroundColor: '#E11D48', color: '#FFFFFF', fontSize: '0.65rem', fontWeight: '900', borderRadius: '10px', padding: '1px 5px', minWidth: '16px', textAlign: 'center', boxShadow: '0 2px 4px rgba(225,29,72,0.4)' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h4 style={{ fontWeight: '900', fontSize: '1.1rem', color: '#0F172A', margin: 0, lineHeight: 1.2 }}>Campus Alert Center</h4>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: '#F1F5F9', border: 'none', color: '#64748B', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
            onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
          >
            <X size={18} />
          </button>
        </div>

        {/* ACTION BAR: MARK READ & CLEAR ALL */}
        <div style={{ padding: '0.65rem 1.25rem', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Actions</span>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4F46E5', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px' }}
              >
                <CheckCheck size={14} /> Mark Read
              </button>
            )}
            {notifications.length > 0 && (
              <button 
                onClick={handleClearAll} 
                style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px' }}
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* FILTER TABS BAR */}
        <div style={{ display: 'flex', gap: '0.4rem', padding: '0.75rem 1.25rem', overflowX: 'auto', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          {getRoleTabs().map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                border: activeTab === t.key ? 'none' : '1px solid #E2E8F0',
                fontSize: '0.76rem',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: activeTab === t.key ? '#4F46E5' : '#FFFFFF',
                color: activeTab === t.key ? '#FFFFFF' : '#64748B',
                boxShadow: activeTab === t.key ? '0 2px 6px rgba(79, 70, 229, 0.3)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* NOTIFICATION LIST */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', backgroundColor: '#F8FAFC' }}>
          {filteredNotifications.length === 0 ? (
            notifications.length > 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', margin: 'auto 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#4F46E5' }}>
                  <Bell size={28} />
                </div>
                <h5 style={{ fontWeight: '800', fontSize: '1rem', color: '#0F172A', marginBottom: '0.25rem' }}>No "{activeTab}" Notifications</h5>
                <p style={{ fontSize: '0.82rem', margin: '0 0 1rem 0', color: '#64748B' }}>You have {notifications.length} notification{notifications.length > 1 ? 's' : ''} in other tabs.</p>
                <button
                  onClick={() => setActiveTab('ALL')}
                  style={{ backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)' }}
                >
                  View All Notifications ({notifications.length})
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', margin: 'auto 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#16A34A' }}>
                  <ShieldCheck size={30} />
                </div>
                <h5 style={{ fontWeight: '800', fontSize: '1rem', color: '#0F172A', marginBottom: '0.25rem' }}>All Caught Up!</h5>
                <p style={{ fontSize: '0.82rem', margin: 0, color: '#64748B' }}>No unread campus notifications or alert warnings right now.</p>
              </div>
            )
          ) : (
            filteredNotifications.map(n => {
              const pStyle = getPriorityStyle(n.priority);
              return (
                <div 
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  style={{
                    padding: '1.1rem 1.2rem',
                    borderRadius: '16px',
                    backgroundColor: n.isRead ? '#FFFFFF' : '#EEF2FF',
                    borderLeft: `5px solid ${pStyle.border}`,
                    borderTop: '1px solid #E2E8F0',
                    borderRight: '1px solid #E2E8F0',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    cursor: n.isRead ? 'default' : 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s'
                  }}
                >
                  {/* ITEM HEADER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      {getCategoryIcon(n.category)}
                      <span style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0F172A', lineHeight: 1.3 }}>{n.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '900', padding: '2px 7px', borderRadius: '6px', backgroundColor: pStyle.bg, color: pStyle.text, textTransform: 'uppercase' }}>
                        {pStyle.label}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '3px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* ITEM MESSAGE BODY */}
                  <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
                    {n.message}
                  </p>

                  {/* ITEM FOOTER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color="#64748B" />
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {n.deepLink && onNavigate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!n.isRead) handleMarkAsRead(n.id);
                          onNavigate(n.deepLink, n);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4F46E5',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        Action <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
