import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  LayoutGrid, 
  Bell, 
  User, 
  MessageSquare,
  Bot
} from 'lucide-react';

const TOUR_CONFIGS = {
  STUDENT: [
    {
      id: 'welcome',
      title: 'Student Parking Hub',
      target: '[data-tour="nav-tabs"]',
      desc: 'Your central command for campus parking at Saveetha University. Seamlessly switch between live availability, slot reservations, and registered vehicles.'
    },
    {
      id: 'booking',
      title: 'Real-time Slot Booking',
      target: '[data-tour="nav-book"]',
      desc: 'Book a parking bay in advance. Pick your arrival time, vehicle, and zone to instantly generate an authenticated contactless QR pass.'
    },
    {
      id: 'map',
      title: 'Interactive Campus Map',
      target: '[data-tour="nav-map"]',
      desc: 'Explore parking zones across campus with live vacancy counts, color-coded bays, and walking-distance indicators to academic blocks.'
    },
    {
      id: 'ai-assistant',
      title: 'ParkNex Campus AI Assistant',
      target: '[data-tour="ai-assistant-btn"]',
      desc: 'Have a question? Tap here to ask our on-device LLM for live parking recommendations, tariff policies, and navigation guidance.'
    },
    {
      id: 'notifs-profile',
      title: 'Notifications & Profile',
      target: '[data-tour="user-profile-menu"]',
      desc: 'Receive immediate alerts on booking confirmations, gate barrier entries, and access your student ID badge anytime.'
    }
  ],
  FACULTY: [
    {
      id: 'welcome',
      title: 'Faculty & Staff Command',
      target: '[data-tour="nav-tabs"]',
      desc: 'Exclusive workspace for faculty and staff members, featuring dedicated bays and priority campus access.'
    },
    {
      id: 'staff-zones',
      title: 'Dedicated Staff Parking Zones',
      target: '[data-tour="nav-book"]',
      desc: 'Access guaranteed staff parking lots and reserve bays without competing with general student allocations.'
    },
    {
      id: 'ai-assistant',
      title: 'Staff AI Guidance',
      target: '[data-tour="ai-assistant-btn"]',
      desc: 'Get immediate answers regarding faculty clearance, guest passes, and barrier telemetry.'
    },
    {
      id: 'profile',
      title: 'Staff Credentials & Passes',
      target: '[data-tour="user-profile-menu"]',
      desc: 'Manage your verified vehicle registration numbers and download university parking clearance receipts.'
    }
  ],
  STAFF: [
    {
      id: 'welcome',
      title: 'Staff Parking Workspace',
      target: '[data-tour="nav-tabs"]',
      desc: 'Dedicated staff parking portal with live zone status, exclusive bays, and quick pass renewals.'
    },
    {
      id: 'staff-booking',
      title: 'Staff Bay Reservations',
      target: '[data-tour="nav-book"]',
      desc: 'Reserve your daily work slot in Staff Parking areas with guaranteed availability.'
    },
    {
      id: 'ai-assistant',
      title: 'Staff AI Assistant',
      target: '[data-tour="ai-assistant-btn"]',
      desc: 'Quick access to campus clearance status, gate barrier reports, and vehicle permissions.'
    }
  ],
  SECURITY: [
    {
      id: 'welcome',
      title: 'Security Command Center',
      target: '[data-tour="nav-tabs"]',
      desc: 'Monitor campus gate barriers, ANPR vision camera feeds, and real-time vehicle entry/exit clearance.'
    },
    {
      id: 'cameras',
      title: 'CCTV Multi-Camera Feeds',
      target: '[data-tour="nav-cameras"]',
      desc: 'View live camera streams from campus gates with automatic number plate recognition (ANPR).'
    },
    {
      id: 'visitors',
      title: 'Visitor & Overstay Management',
      target: '[data-tour="nav-barrier"]',
      desc: 'Issue visitor gate passes, review unauthorized vehicles, and verify entry permissions.'
    },
    {
      id: 'ai-security',
      title: 'Security AI Engine',
      target: '[data-tour="ai-assistant-btn"]',
      desc: 'Query real-time gate incidents, unauthorized vehicle logs, and security clearance logs.'
    }
  ],
  ADMIN: [
    {
      id: 'welcome',
      title: 'Administrative Operations Hub',
      target: '[data-tour="nav-tabs"]',
      desc: 'Complete control of campus parking infrastructure, capacity thresholds, and multi-zone telemetry.'
    },
    {
      id: 'slots',
      title: 'Zone & Slot Manager',
      target: '[data-tour="nav-slots"]',
      desc: 'Add, edit, or configure parking zones, total capacity, and dedicated staff/faculty allotments.'
    },
    {
      id: 'users',
      title: 'User & Vehicle Directory',
      target: '[data-tour="nav-users"]',
      desc: 'Audit student, faculty, and security accounts, registered license plates, and active bookings.'
    },
    {
      id: 'analytics',
      title: 'Live Peak Hours & Telemetry',
      target: '[data-tour="nav-analytics"]',
      desc: 'Examine campus occupancy trends, daily turnover rates, and predictive vacancy patterns.'
    },
    {
      id: 'ai-admin',
      title: 'Operations AI Assistant',
      target: '[data-tour="ai-assistant-btn"]',
      desc: 'Analyze today’s parking utilization, audit gate alerts, and generate automated summaries.'
    }
  ]
};

export default function GuidedTour({ userRole, isOpen, onClose }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const normalizedRole = (userRole || 'STUDENT').toUpperCase();
  const steps = TOUR_CONFIGS[normalizedRole] || TOUR_CONFIGS.STUDENT;

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setTargetRect(null);
      return;
    }

    const updateTargetPosition = () => {
      const step = steps[currentStepIndex];
      if (!step || !step.target) {
        setTargetRect(null);
        return;
      }

      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Remove spotlight from previous elements
        document.querySelectorAll('.pn-tour-spotlight').forEach(node => node.classList.remove('pn-tour-spotlight'));
        el.classList.add('pn-tour-spotlight');
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      } else {
        document.querySelectorAll('.pn-tour-spotlight').forEach(node => node.classList.remove('pn-tour-spotlight'));
        setTargetRect(null);
      }
    };

    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
      document.querySelectorAll('.pn-tour-spotlight').forEach(node => node.classList.remove('pn-tour-spotlight'));
    };
  }, [isOpen, currentStepIndex, steps]);

  const handleClose = () => {
    document.querySelectorAll('.pn-tour-spotlight').forEach(node => node.classList.remove('pn-tour-spotlight'));
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex] || steps[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  // Calculate card position near the target element or centered
  let cardStyle = {
    position: 'fixed',
    zIndex: 10002,
    maxWidth: '380px',
    width: '90%'
  };

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const placeAbove = spaceBelow < 220 && targetRect.top > 220;

    if (placeAbove) {
      cardStyle.bottom = `${window.innerHeight - targetRect.top + 16}px`;
      cardStyle.left = `${Math.max(20, Math.min(window.innerWidth - 400, targetRect.left))}px`;
    } else {
      cardStyle.top = `${targetRect.bottom + 16}px`;
      cardStyle.left = `${Math.max(20, Math.min(window.innerWidth - 400, targetRect.left))}px`;
    }
  } else {
    // Centered fallback
    cardStyle.top = '50%';
    cardStyle.left = '50%';
    cardStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(7, 17, 31, 0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'all 0.3s ease'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Guided Tour"
    >
      {/* Tour Card */}
      <div
        className="glass-card-premium animate-pn-slide-up"
        style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, rgba(15, 27, 46, 0.95) 0%, rgba(20, 36, 62, 0.98) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '20px',
          padding: '1.4rem 1.5rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                color: '#60A5FA',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              STEP {currentStepIndex + 1} OF {steps.length}
            </span>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Skip tour (Esc)"
            aria-label="Close guided tour"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title & Description */}
        <div>
          <h3
            style={{
              margin: '0 0 0.4rem 0',
              fontSize: '1.15rem',
              fontWeight: '800',
              color: '#F8FAFC',
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <Sparkles size={18} color="#60A5FA" /> {currentStep.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: '#CBD5E1',
              lineHeight: 1.5,
              fontWeight: '400'
            }}
          >
            {currentStep.desc}
          </p>
        </div>

        {/* Navigation Step Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {steps.map((_, idx) => (
            <div
              key={idx}
              style={{
                height: '4px',
                flex: 1,
                borderRadius: '4px',
                backgroundColor: idx <= currentStepIndex ? '#3B82F6' : 'rgba(255, 255, 255, 0.15)',
                transition: 'all 0.25s ease'
              }}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '6px 8px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F8FAFC')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
          >
            Skip Tour
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="btn-glass-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                aria-label="Previous step"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="btn-glass-primary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem' }}
              aria-label={isLast ? 'Finish tour' : 'Next step'}
            >
              {isLast ? (
                <>
                  <CheckCircle2 size={15} /> Finish Tour
                </>
              ) : (
                <>
                  Next <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
