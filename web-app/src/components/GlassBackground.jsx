import React, { useRef, useEffect, useState } from 'react';

/**
 * GlassBackground Component
 * Shared, lightweight, GPU-optimized campus parking video background layer
 * with rich multi-tier dark gradient overlays and automatic poster fallback.
 */
export default function GlassBackground() {
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause();
    }

    // Auto-pause video when document is hidden to conserve GPU/battery
    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else if (!mediaQuery.matches && !videoError) {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [videoError]);

  return (
    <div 
      className="parknex-glass-bg-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
        backgroundColor: '#07111F'
      }}
      aria-hidden="true"
    >
      {/* Fallback & Poster Image */}
      <img
        src="/assets/campus-parking-poster.jpg"
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: videoLoaded && !videoError ? 0 : 0.85,
          transition: 'opacity 1s ease-in-out',
          transform: 'scale(1.02)'
        }}
      />

      {/* Looping Cinematic Video */}
      {!videoError && (
        <video
          ref={videoRef}
          src="/assets/campus-parking-bg.mp4"
          poster="/assets/campus-parking-poster.jpg"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: videoLoaded ? 0.75 : 0,
            transition: 'opacity 1.2s ease-in-out',
            filter: 'saturate(1.2) contrast(1.1)'
          }}
        />
      )}

      {/* Multi-tier Dark Glass Gradient Overlays for Maximum Text Legibility */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle at 50% 20%, rgba(7, 17, 31, 0.45) 0%, rgba(7, 17, 31, 0.82) 65%, #07111F 100%),
            linear-gradient(to bottom, rgba(7, 17, 31, 0.75) 0%, rgba(11, 22, 40, 0.65) 50%, rgba(7, 17, 31, 0.92) 100%)
          `,
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)'
        }}
      />

      {/* Subtle Ambient Electric Blue and Violet Radial Glow Highlights */}
      <div 
        style={{
          position: 'absolute',
          top: '-15%',
          left: '10%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
          filter: 'blur(50px)'
        }} 
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '5%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.10) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }} 
      />
    </div>
  );
}
