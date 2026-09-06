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
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function NotificationDrawer({ isOpen, onClose, userEmail, userRole, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const emailParam = encodeURIComponent(userEmail || 'student@college.edu');
      const roleParam = encodeURIComponent(userRole || 'STUDENT');
      const res = await axios.get(`${BACKEND_URL}/notifications?email=${emailParam}&role=${roleParam}`);
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [userEmail, userRole]);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${BACKEND_URL}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${BACKEND_URL}/notifications/read-all`, { email: userEmail });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {}
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.isRead;
    if (activeTab === 'EXPIRY') return n.category === 'PARKING_EXPIRY' || n.category === 'PARKING_EXPIRED' || n.category === 'BOOKING';
    if (activeTab === 'ALERTS') return n.priority === 'HIGH' || n.priority === 'CRITICAL' || n.category === 'SECURITY' || n.category === 'EMERGENCY';
    if (activeTab === 'ANNOUNCEMENT') return n.category === 'ANNOUNCEMENT';
    return true;
  });

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444', label: 'CRITICAL' };
      case 'HIGH':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: '#F59E0B', label: 'HIGH' };
      case 'LOW':
        return { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280', border: '#9CA3AF', label: 'LOW' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', border: '#3B82F6', label: 'NORMAL' };
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'PARKING_EXPIRY':
      case 'PARKING_EXPIRED':
        return <Clock size={18} color="#F59E0B" />;
      case 'VEHICLE_ENTRY':
      case 'VEHICLE_EXIT':
        return <Car size={18} color="#10B981" />;
      case 'SECURITY':
      case 'VIOLATION':
        return <ShieldAlert size={18} color="#EF4444" />;
      case 'EMERGENCY':
        return <AlertTriangle size={18} color="#EF4444" />;
      case 'ANNOUNCEMENT':
        return <Megaphone size={18} color="#6366F1" />;
      default:
        return <Info size={18} color="#3B82F6" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="card animate-fade-in" 
      style={{ 
        position: 'absolute', 
        top: '65px', 
        right: '1rem', 
        width: '420px', 
        maxHeight: '82vh',
        zIndex: 1000, 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)', 
        padding: '0', 
        borderRadius: '20px',
        border: '1px solid var(--border)', 
        background: 'var(--bg-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* HEADER */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Bell size={22} color="var(--primary)" />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: '#EF4444', color: '#fff', fontSize: '0.65rem', fontWeight: '900', borderRadius: '10px', padding: '1px 6px', minWidth: '16px', textAlign: 'center' }}>
                {unreadCount}
              </span>
            )}
          </div>
          <h4 style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>Campus Alert Center</h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead} 
              title="Mark All as Read"
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px' }}
            >
              <CheckCheck size={16} /> Mark Read
            </button>
          )}
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', overflowX: 'auto', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-main)' }}>
        {[
          { key: 'ALL', label: 'All' },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'EXPIRY', label: 'Expiries' },
          { key: 'ALERTS', label: 'Alerts' },
          { key: 'ANNOUNCEMENT', label: 'News' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              backgroundColor: activeTab === t.key ? 'var(--primary)' : 'var(--bg-card)',
              color: activeTab === t.key ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* NOTIFICATION LIST */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Bell size={36} color="var(--border)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>No notifications found</p>
            <span style={{ fontSize: '0.75rem' }}>All campus alerts and expiry reminders will appear here in real time.</span>
          </div>
        ) : (
          filteredNotifications.map(n => {
            const pStyle = getPriorityStyle(n.priority);
            return (
              <div 
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                style={{
                  padding: '1rem',
                  borderRadius: '14px',
                  backgroundColor: n.isRead ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.05)',
                  borderLeft: `4px solid ${pStyle.border}`,
                  borderTop: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
              >
                {/* ITEM HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getCategoryIcon(n.category)}
                    <span style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--text-main)' }}>{n.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', padding: '2px 6px', borderRadius: '6px', backgroundColor: pStyle.bg, color: pStyle.text }}>
                      {pStyle.label}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* ITEM MESSAGE BODY */}
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {n.message}
                </p>

                {/* ITEM FOOTER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
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
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
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
  );
}
