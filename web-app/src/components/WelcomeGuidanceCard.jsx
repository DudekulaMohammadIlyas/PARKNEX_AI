import React, { useState } from 'react';
import { Compass, Sparkles, X } from 'lucide-react';

const ROLE_DESCRIPTIONS = {
  STUDENT: 'Explore vacant bays, reserve parking slots, and track your active digital clearance pass.',
  FACULTY: 'Access dedicated faculty parking bays, manage reserved slots, and view campus clearance.',
  STAFF: 'Access dedicated staff parking bays, manage reserved slots, and view campus clearance.',
  SECURITY: 'Monitor live barriers, camera ANPR feeds, and review unauthorized vehicle entries.',
  ADMIN: 'Configure campus parking zones, analyze real-time peak telemetry, and manage registry.'
};

const ROLE_COLORS = {
  STUDENT: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.35)' },
  FACULTY: { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.35)' },
  STAFF: { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.35)' },
  SECURITY: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.35)' },
  ADMIN: { bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.35)' }
};

export default function WelcomeGuidanceCard({ userRole, userName, userEmail, onStartTour, onDismiss }) {
  const normalizedRole = (userRole || 'STUDENT').toUpperCase();
  const storageKey = `parknex_tour_dismissed_v1_${normalizedRole}_${(userEmail || 'default').toLowerCase()}`;

  const [isVisible, setIsVisible] = useState(() => {
    try {
      const isDismissed = localStorage.getItem(storageKey);
      return !isDismissed;
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  const handleLaunchTour = () => {
    setIsVisible(false);
    if (onStartTour) onStartTour();
  };

  if (!isVisible) return null;

  const roleTheme = ROLE_COLORS[normalizedRole] || ROLE_COLORS.STUDENT;
  const description = ROLE_DESCRIPTIONS[normalizedRole] || ROLE_DESCRIPTIONS.STUDENT;
  const displayName = userName && userName !== 'User' ? userName : (normalizedRole === 'ADMIN' ? 'Administrator' : 'Campus Member');

  return (
    <aside
      className="glass-card-premium animate-pn-slide-up"
      style={{
        width: '100%',
        maxWidth: '280px',
        margin: '0.75rem 0',
        padding: '1.15rem 1.25rem',
        border: '1px solid var(--pn-glass-border-hover)',
        background: 'linear-gradient(135deg, rgba(15, 27, 46, 0.88) 0%, rgba(20, 36, 62, 0.92) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), 0 0 20px rgba(59, 130, 246, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        position: 'relative'
      }}
      aria-label="Welcome and first-time guidance card"
    >
      {/* Header: Title and Dismiss */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
            }}
          >
            <Compass size={16} color="#FFFFFF" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#F8FAFC' }}>
              Welcome to ParkNex AI
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: '500' }}>
              {displayName}
            </span>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease'
          }}
          title="Dismiss guidance"
          aria-label="Dismiss guidance card"
        >
          <X size={16} />
        </button>
      </div>

      {/* Role Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: '800',
            color: roleTheme.text,
            backgroundColor: roleTheme.bg,
            border: `1px solid ${roleTheme.border}`,
            padding: '2px 8px',
            borderRadius: '6px',
            letterSpacing: '0.4px',
            textTransform: 'uppercase'
          }}
        >
          ● {normalizedRole} WORKSPACE
        </span>
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.45, fontWeight: '400' }}>
        {description}
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.2rem' }}>
        <button
          onClick={handleLaunchTour}
          className="btn-glass-primary"
          style={{
            width: '100%',
            padding: '0.55rem 0.85rem',
            fontSize: '0.8rem',
            fontWeight: '700',
            borderRadius: '10px'
          }}
        >
          <Sparkles size={14} /> Start Guided Tour
        </button>

        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            fontSize: '0.72rem',
            fontWeight: '600',
            cursor: 'pointer',
            textAlign: 'center',
            padding: '4px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFC')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          Explore Dashboard on my own
        </button>
      </div>
    </aside>
  );
}
