import React, { useState, useEffect, useRef } from 'react';
import { CarFront, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

const STATEMENTS = [
  { text: "Discover Available Parking", sub: "Live bay occupancy telemetry across Saveetha University" },
  { text: "Book Your Slot", sub: "Instant guaranteed reservations with contactless QR clearance" },
  { text: "Track Campus Occupancy", sub: "Real-time computer vision sensors and multi-zone analytics" },
  { text: "Experience AI-Powered Parking", sub: "Intelligent parking recommendations & automated gate access" }
];

const SPLASH_DURATION_MS = 4800; // ~4.8 seconds total duration

export default function CinematicSplash({ onComplete }) {
  const [statementIndex, setStatementIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Statement cycling & progress tracking
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setStatementIndex((prev) => (prev + 1) % STATEMENTS.length);
    }, 1200);

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / SPLASH_DURATION_MS) * 100);
      setProgress(pct);

      if (elapsed >= SPLASH_DURATION_MS) {
        clearInterval(progressInterval);
        handleEnter();
      }
    }, 40);

    return () => {
      clearInterval(cycleInterval);
      clearInterval(progressInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Keyboard shortcut: Space, Enter, or Escape to immediately enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEnter = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    timerRef.current = setTimeout(() => {
      if (onComplete) onComplete();
    }, 450);
  };

  return (
    <div
      className="cinematic-splash-screen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2.5rem 1.5rem',
        backgroundColor: '#07111F',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to ParkNex AI Splash Introduction"
    >
      {/* Background Video Layer with Fallback Poster */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        <img
          src="/assets/campus-parking-poster.jpg"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: videoLoaded ? 0 : 0.85,
            transition: 'opacity 0.8s ease'
          }}
        />
        <video
          src="/assets/campus-parking-bg.mp4"
          poster="/assets/campus-parking-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: videoLoaded ? 0.8 : 0,
            transition: 'opacity 1s ease',
            filter: 'saturate(1.25) contrast(1.15)'
          }}
        />
        {/* Dark Vignette & Gradient Overlays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(circle at center, rgba(7, 17, 31, 0.5) 0%, rgba(7, 17, 31, 0.88) 75%, #07111F 100%),
              linear-gradient(to bottom, rgba(7, 17, 31, 0.7) 0%, transparent 40%, rgba(7, 17, 31, 0.95) 100%)
            `
          }}
        />
      </div>

      {/* Top Header: Brand & Skip Button */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            <CarFront size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '1.25rem',
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
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  color: '#3B82F6',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  letterSpacing: '0.5px'
                }}
              >
                SMART CAMPUS
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8', fontWeight: '500' }}>
              Saveetha University Infrastructure
            </p>
          </div>
        </div>

        <button
          onClick={handleEnter}
          aria-label="Skip introduction"
          style={{
            background: 'rgba(15, 27, 46, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#CBD5E1',
            borderRadius: '24px',
            padding: '0.45rem 1.1rem',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(30, 58, 102, 0.8)';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(15, 27, 46, 0.65)';
            e.currentTarget.style.color = '#CBD5E1';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
          }}
        >
          Skip Intro <ArrowRight size={14} />
        </button>
      </header>

      {/* Center Cinematic Content */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '850px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          margin: 'auto 0'
        }}
      >
        {/* Glowing Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(15, 27, 46, 0.75)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            boxShadow: '0 0 25px rgba(59, 130, 246, 0.25)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          <Sparkles size={14} color="#60A5FA" />
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#93C5FD', letterSpacing: '0.2px' }}>
            Next-Gen Autonomous Parking Intelligence
          </span>
        </div>

        {/* Primary Headline */}
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
            fontWeight: '900',
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            color: '#F8FAFC',
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.8)'
          }}
        >
          Smart Parking.{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 60%, #F472B6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none'
            }}
          >
            Smarter Campuses.
          </span>
        </h1>

        {/* Supporting Line */}
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#CBD5E1',
            maxWidth: '640px',
            lineHeight: 1.55,
            fontWeight: '400',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)'
          }}
        >
          Real-time parking intelligence for a safer, smoother campus experience.
        </p>

        {/* Animated Sequence of Subtitle-Style Feature Statements */}
        <div
          style={{
            minHeight: '68px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '0.5rem'
          }}
        >
          <div
            key={statementIndex}
            className="animate-pn-slide-up"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <span
              style={{
                fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
                fontWeight: '800',
                color: '#60A5FA',
                letterSpacing: '-0.2px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Zap size={18} color="#60A5FA" />
              {STATEMENTS[statementIndex].text}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: '500' }}>
              {STATEMENTS[statementIndex].sub}
            </span>
          </div>
        </div>

        {/* Primary Call to Action */}
        <div style={{ marginTop: '1.25rem' }}>
          <button
            onClick={handleEnter}
            autoFocus
            className="btn-glass-primary"
            style={{
              padding: '0.9rem 2.2rem',
              fontSize: '1.05rem',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 8px 30px rgba(59, 130, 246, 0.45)',
              transform: 'scale(1)',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(59, 130, 246, 0.65)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(59, 130, 246, 0.45)';
            }}
          >
            <span>Enter ParkNex</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </main>

      {/* Bottom Progress Bar & Key Indicators */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.65rem'
        }}
      >
        {/* Progress Track */}
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            overflow: 'hidden'
          }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
              borderRadius: '9999px',
              transition: 'width 0.08s linear',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.72rem', color: '#64748B' }}>
          <span>Press <strong style={{ color: '#CBD5E1' }}>Enter</strong> or <strong style={{ color: '#CBD5E1' }}>Space</strong> to skip</span>
          <span>Automatic redirect in {Math.max(1, Math.ceil((SPLASH_DURATION_MS - (progress / 100) * SPLASH_DURATION_MS) / 1000))}s</span>
        </div>
      </footer>
    </div>
  );
}
