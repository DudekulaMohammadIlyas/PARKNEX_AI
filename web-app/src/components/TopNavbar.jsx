import React, { useState, useEffect } from 'react';
import { 
  CarFront, 
  LayoutGrid, 
  Calendar, 
  MapPin, 
  CreditCard, 
  History, 
  MessageSquare, 
  Settings, 
  Users, 
  TrendingUp, 
  Shield, 
  Camera, 
  AlertTriangle, 
  Bell, 
  LogOut, 
  Sparkles, 
  Compass, 
  Menu, 
  X
} from 'lucide-react';

export default function TopNavbar({
  role,
  activePage,
  setActivePage,
  profile,
  unreadNotifCount,
  onOpenNotifications,
  onOpenProfile,
  onOpenAIChat,
  onStartTour,
  onConfirmLogout
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const normalizedRole = (role || 'STUDENT').toUpperCase();

  // Close mobile drawer on route change or escape
  const handleNavigate = (pageKey) => {
    setActivePage(pageKey);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Role-based Nav Items
  let navItems = [];
  if (normalizedRole === 'ADMIN') {
    navItems = [
      { key: 'dashboard', label: 'Admin Command', icon: LayoutGrid, tourId: 'nav-dashboard' },
      { key: 'slots', label: 'Manage Slots', icon: MapPin, tourId: 'nav-slots' },
      { key: 'users', label: 'User Registry', icon: Users, tourId: 'nav-users' },
      { key: 'analytics', label: 'Analytics', icon: TrendingUp, tourId: 'nav-analytics' },
      { key: 'feedback', label: 'User Feedback', icon: MessageSquare, tourId: 'nav-feedback' },
      { key: 'settings', label: 'System Settings', icon: Settings, tourId: 'nav-settings' }
    ];
  } else if (normalizedRole === 'SECURITY') {
    navItems = [
      { key: 'dashboard', label: 'Command Center', icon: Shield, tourId: 'nav-dashboard' },
      { key: 'cameras', label: 'CCTV Feeds', icon: Camera, tourId: 'nav-cameras' },
      { key: 'barrier', label: 'Visitor Console', icon: Users, tourId: 'nav-barrier' },
      { key: 'incidents', label: 'Violations & Logs', icon: AlertTriangle, tourId: 'nav-incidents' },
      { key: 'feedback', label: 'Feedback Desk', icon: MessageSquare, tourId: 'nav-feedback' },
      { key: 'settings', label: 'Settings', icon: Settings, tourId: 'nav-settings' }
    ];
  } else {
    // STUDENT, FACULTY, STAFF
    navItems = [
      { key: 'dashboard', label: 'Overview', icon: LayoutGrid, tourId: 'nav-dashboard' },
      { key: 'book', label: 'Book a Slot', icon: Calendar, tourId: 'nav-book' },
      { key: 'vehicles', label: 'My Vehicles', icon: CarFront, tourId: 'nav-vehicles' },
      { key: 'map', label: 'Campus Map', icon: MapPin, tourId: 'nav-map' },
      { key: 'billing', label: 'Passes & Billing', icon: CreditCard, tourId: 'nav-billing' },
      { key: 'history', label: 'Parking History', icon: History, tourId: 'nav-history' },
      { key: 'feedback', label: 'Feedback', icon: MessageSquare, tourId: 'nav-feedback' },
      { key: 'settings', label: 'Settings', icon: Settings, tourId: 'nav-settings' }
    ];
  }

  return (
    <header
      className="glass-surface"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        width: '100%',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'rgba(7, 17, 31, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.45)'
      }}
    >
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div 
            onClick={() => handleNavigate('dashboard')} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            title="ParkNex AI Home"
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(59, 130, 246, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
            >
              <CarFront size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: '900',
                    letterSpacing: '-0.3px',
                    background: 'linear-gradient(90deg, #FFFFFF 0%, #93C5FD 50%, #C4B5FD 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  ParkNex AI
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: '800',
                    color: '#60A5FA',
                    backgroundColor: 'rgba(59, 130, 246, 0.14)',
                    padding: '2px 6px',
                    borderRadius: '5px',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {normalizedRole}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav
          data-tour="nav-tabs"
          className="desktop-nav-links"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            overflowX: 'auto',
            padding: '0 0.5rem'
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
                data-tour={item.tourId}
                onClick={() => handleNavigate(item.key)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' : 'rgba(255, 255, 255, 0.06)',
                  color: isActive ? '#FFFFFF' : '#E2E8F0',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: isActive ? '0 0 16px rgba(59, 130, 246, 0.45)' : 'none',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#E2E8F0';
                  }
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Guided Tour Launcher */}
          <button
            onClick={onStartTour}
            title="Launch Interactive Tour"
            style={{
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#C4B5FD',
              padding: '0.45rem 0.75rem',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.25)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.12)';
              e.currentTarget.style.color = '#C4B5FD';
            }}
          >
            <Compass size={15} />
            <span className="hide-on-mobile">Tour</span>
          </button>

          {/* AI Assistant Quick Trigger */}
          <button
            data-tour="ai-assistant-btn"
            onClick={onOpenAIChat}
            className="btn-glass-primary"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            title="Open ParkNex AI Assistant"
          >
            <Sparkles size={14} color="#FFFFFF" />
            <span className="hide-on-mobile">Ask AI</span>
          </button>

          {/* Notifications Bell */}
          <button
            data-tour="notifications"
            onClick={onOpenNotifications}
            title="Notifications"
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(15, 27, 46, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 50, 80, 0.85)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(15, 27, 46, 0.7)')}
          >
            <Bell size={17} />
            {unreadNotifCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: '900',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  minWidth: '15px',
                  textAlign: 'center',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                }}
              >
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* User Profile Pill */}
          <div
            data-tour="user-profile-menu"
            onClick={onOpenProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '10px',
              background: 'rgba(15, 27, 46, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Edit Profile Details"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 50, 80, 0.85)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(15, 27, 46, 0.75)')}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {profile?.avatar || (profile?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="hide-on-mobile" style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#F8FAFC' }}>
                {profile?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: '600' }}>
                {normalizedRole}
              </div>
            </div>
          </div>

          {/* Sign Out Action */}
          <button
            onClick={onConfirmLogout}
            title="Sign Out of Session"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EF4444';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.color = '#EF4444';
            }}
          >
            <LogOut size={16} />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(15, 27, 46, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#CBD5E1',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Collapsible Glass Drawer */}
      {mobileMenuOpen && (
        <div
          className="animate-pn-slide-up"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(7, 17, 31, 0.95)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.key)}
                style={{
                  background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: isActive ? '#60A5FA' : '#CBD5E1',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textAlign: 'left'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Responsive Inline CSS for Navbar */}
      <style>{`
        .desktop-nav-links {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .desktop-nav-links::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 992px) {
          .desktop-nav-links {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: flex !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
