import React from 'react';
import { CarFront, RotateCcw } from 'lucide-react';

export default function ProjectFooter({ onNavigate, onReplayIntro, role }) {
  const currentYear = new Date().getFullYear();
  const normalizedRole = (role || 'STUDENT').toUpperCase();

  return (
    <footer
      className="glass-surface"
      style={{
        width: '100%',
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(7, 17, 31, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '2.5rem 1.5rem 1.5rem 1.5rem',
        color: '#94A3B8',
        fontSize: '0.85rem'
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Column 1: Brand & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
              }}
            >
              <CarFront size={18} color="#FFFFFF" />
            </div>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: '900',
                background: 'linear-gradient(90deg, #FFFFFF 0%, #93C5FD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              ParkNex AI
            </span>
          </div>
          <p style={{ margin: 0, color: '#CBD5E1', lineHeight: 1.5, fontSize: '0.82rem' }}>
            Intelligent parking visibility, streamlined reservations, and smarter campus operations for Saveetha University.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '700' }}>
              CAMPUS TELEMETRY: LIVE
            </span>
          </div>
        </div>

        {/* Column 2: Quick Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <h4 style={{ margin: 0, color: '#F8FAFC', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Campus Portals
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <a
              onClick={() => onNavigate && onNavigate('dashboard')}
              style={{ color: '#94A3B8', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#60A5FA')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              Dashboard Overview
            </a>
            {normalizedRole === 'ADMIN' ? (
              <a
                onClick={() => onNavigate && onNavigate('slots')}
                style={{ color: '#94A3B8', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#60A5FA')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                Manage Parking Slots
              </a>
            ) : (
              <a
                onClick={() => onNavigate && onNavigate('book')}
                style={{ color: '#94A3B8', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#60A5FA')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                Slot Booking & Pass
              </a>
            )}
            <a
              onClick={() => onNavigate && onNavigate('feedback')}
              style={{ color: '#94A3B8', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#60A5FA')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              Feedback & Support
            </a>
          </div>
        </div>

        {/* Column 3: System Status & Infrastructure */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <h4 style={{ margin: 0, color: '#F8FAFC', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Infrastructure
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Database:</span>
              <strong style={{ color: '#60A5FA' }}>PostgreSQL / Supabase</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Vision Engine:</span>
              <strong style={{ color: '#34D399' }}>YOLOv8 + OCR ANPR</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>AI Assistant:</span>
              <strong style={{ color: '#A78BFA' }}>Ollama Local LLM</strong>
            </div>
          </div>
        </div>

        {/* Column 4: Experience Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, color: '#F8FAFC', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Experience
          </h4>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>
            Replay the cinematic campus introduction or review system release notes.
          </p>
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="btn-glass-secondary"
              style={{
                alignSelf: 'flex-start',
                padding: '0.45rem 0.85rem',
                fontSize: '0.78rem',
                borderRadius: '8px'
              }}
            >
              <RotateCcw size={14} /> Replay Intro
            </button>
          )}
        </div>
      </div>

      {/* Bottom Legal & Version Bar */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '1.25rem auto 0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.76rem',
          color: '#64748B'
        }}
      >
        <div>
          © {currentYear} ParkNex AI. All rights reserved. Saveetha University Smart Campus Initiative.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Version: <strong style={{ color: '#94A3B8' }}>v2.4.0 (Enterprise Live)</strong></span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
          <span>Role: <strong style={{ color: '#60A5FA' }}>{normalizedRole}</strong></span>
        </div>
      </div>
    </footer>
  );
}
