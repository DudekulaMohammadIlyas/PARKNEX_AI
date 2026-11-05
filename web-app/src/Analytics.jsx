import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart2, TrendingUp, Cpu, RefreshCw, AlertCircle, ShieldAlert, Award, 
  Layers, Eye, Zap, Activity, CheckCircle, Navigation, Radio, Database, 
  Download, Car, Clock, Calendar, Compass, ShieldCheck, ArrowUpRight, 
  Info, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

// ==========================================
// PICTORIAL SUBCOMPONENTS (Pure SVG & CSS)
// ==========================================

// 1. Pictorial 24-Hour Traffic Spline Wave Chart
function PictorialTrafficWave({ hoveredHour, setHoveredHour }) {
  const hoursData = [
    { hour: '06:00', inflow: 15, outflow: 5, label: 'Early Birds' },
    { hour: '07:30', inflow: 45, outflow: 10, label: 'Staff Arrival' },
    { hour: '08:30', inflow: 92, outflow: 18, label: 'Morning Peak (Classes Start)' },
    { hour: '10:00', inflow: 88, outflow: 35, label: 'CS & Eng Lectures' },
    { hour: '11:30', inflow: 65, outflow: 50, label: 'Mid-Morning Turnaround' },
    { hour: '13:00', inflow: 78, outflow: 72, label: 'Lunch & Library Shift' },
    { hour: '14:30', inflow: 70, outflow: 60, label: 'Lab Sessions' },
    { hour: '16:00', inflow: 42, outflow: 85, label: 'Evening Dismissal Peak' },
    { hour: '17:30', inflow: 28, outflow: 75, label: 'Hostel Return' },
    { hour: '19:00', inflow: 20, outflow: 40, label: 'Evening Study' },
    { hour: '21:00', inflow: 12, outflow: 25, label: 'Night Shift' },
    { hour: '23:00', inflow: 5, outflow: 10, label: 'Campus Curfew' },
  ];

  const maxVal = 100;
  const width = 800;
  const height = 260;
  const padding = { top: 30, right: 30, bottom: 40, left: 45 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (i) => padding.left + (i / (hoursData.length - 1)) * chartW;
  const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

  // Build smooth bezier curves
  const buildSmoothPath = (key) => {
    let d = `M ${getX(0)} ${getY(hoursData[0][key])}`;
    for (let i = 0; i < hoursData.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(hoursData[i][key]);
      const x1 = getX(i + 1);
      const y1 = getY(hoursData[i + 1][key]);
      const mx = (x0 + x1) / 2;
      d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  };

  const inflowPath = buildSmoothPath('inflow');
  const outflowPath = buildSmoothPath('outflow');

  const inflowArea = `${inflowPath} L ${getX(hoursData.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`;
  const outflowArea = `${outflowPath} L ${getX(hoursData.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`;

  const activeItem = hoveredHour !== null ? hoursData[hoveredHour] : hoursData[2]; // Default to peak

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Top Controls / Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#38BDF8', fontWeight: '700' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 10px #38BDF8' }}></span>
            Vehicle Inflow (Peak 92%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#A855F7', fontWeight: '700' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#A855F7', boxShadow: '0 0 10px #A855F7' }}></span>
            Vehicle Outflow (Peak 85%)
          </div>
        </div>

        {/* Floating Tooltip Pill */}
        <div style={{ 
          background: 'rgba(15, 27, 46, 0.9)', 
          border: '1px solid rgba(56, 189, 248, 0.4)', 
          padding: '0.4rem 0.9rem', 
          borderRadius: '20px', 
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
        }}>
          <Clock size={14} color="#38BDF8" />
          <span style={{ color: '#FFFFFF', fontWeight: '800' }}>{activeItem.hour}:</span>
          <span style={{ color: '#38BDF8', fontWeight: '700' }}>+{activeItem.inflow}% In</span>
          <span style={{ color: '#A855F7', fontWeight: '700' }}>-{activeItem.outflow}% Out</span>
          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>({activeItem.label})</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '600px', display: 'block' }}>
          <defs>
            {/* Inflow Gradients */}
            <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="90%" stopColor="#38BDF8" stopOpacity="0.02" />
            </linearGradient>

            {/* Outflow Gradients */}
            <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.35" />
              <stop offset="90%" stopColor="#A855F7" stopOpacity="0.02" />
            </linearGradient>

            {/* Grid Pattern */}
            <filter id="glowInflow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Reference Lines */}
          {[25, 50, 75, 100].map(val => (
            <g key={val}>
              <line 
                x1={padding.left} 
                y1={getY(val)} 
                x2={width - padding.right} 
                y2={getY(val)} 
                stroke="rgba(255, 255, 255, 0.08)" 
                strokeDasharray="4 4" 
              />
              <text 
                x={padding.left - 10} 
                y={getY(val) + 4} 
                fill="#64748B" 
                fontSize="10" 
                fontWeight="600" 
                textAnchor="end"
              >
                {val}%
              </text>
            </g>
          ))}

          {/* Area Fills */}
          <path d={inflowArea} fill="url(#inflowGrad)" />
          <path d={outflowArea} fill="url(#outflowGrad)" />

          {/* Stroke Lines */}
          <path d={inflowPath} fill="none" stroke="#38BDF8" strokeWidth="3" filter="url(#glowInflow)" strokeLinecap="round" />
          <path d={outflowPath} fill="none" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />

          {/* Threshold alert line at 90% */}
          <line 
            x1={padding.left} 
            y1={getY(90)} 
            x2={width - padding.right} 
            y2={getY(90)} 
            stroke="rgba(248, 113, 113, 0.5)" 
            strokeWidth="1.5" 
            strokeDasharray="6 3" 
          />
          <text 
            x={width - padding.right - 8} 
            y={getY(90) - 6} 
            fill="#F87171" 
            fontSize="10" 
            fontWeight="800" 
            textAnchor="end"
          >
            ⚠️ 90% Capacity Peak Limit
          </text>

          {/* Interactive Data Nodes */}
          {hoursData.map((d, i) => {
            const x = getX(i);
            const yIn = getY(d.inflow);
            const yOut = getY(d.outflow);
            const isSelected = (hoveredHour !== null ? hoveredHour : 2) === i;

            return (
              <g 
                key={i} 
                style={{ cursor: 'pointer' }} 
                onMouseEnter={() => setHoveredHour(i)}
              >
                {/* Vertical hover indicator column */}
                {isSelected && (
                  <line 
                    x1={x} 
                    y1={padding.top} 
                    x2={x} 
                    y2={padding.top + chartH} 
                    stroke="rgba(56, 189, 248, 0.35)" 
                    strokeWidth="1.5" 
                    strokeDasharray="2 2" 
                  />
                )}

                {/* Inflow Dot */}
                <circle 
                  cx={x} 
                  cy={yIn} 
                  r={isSelected ? 6 : 4} 
                  fill="#38BDF8" 
                  stroke="#07111F" 
                  strokeWidth="2" 
                />

                {/* Outflow Dot */}
                <circle 
                  cx={x} 
                  cy={yOut} 
                  r={isSelected ? 5 : 3.5} 
                  fill="#A855F7" 
                  stroke="#07111F" 
                  strokeWidth="2" 
                />

                {/* X Axis Label */}
                <text 
                  x={x} 
                  y={height - 12} 
                  fill={isSelected ? '#38BDF8' : '#94A3B8'} 
                  fontSize="11" 
                  fontWeight={isSelected ? '800' : '500'} 
                  textAnchor="middle"
                >
                  {d.hour}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// 2. Pictorial Donut Breakdown Chart (Permit Distribution)
function PictorialDonutChart() {
  const segments = [
    { label: 'Students', percent: 56, color: '#38BDF8', count: 828, icon: '🎓' },
    { label: 'Faculty & Staff', percent: 24, color: '#C084FC', count: 355, icon: '👔' },
    { label: 'EV Charging Hub', percent: 12, color: '#34D399', count: 178, icon: '⚡' },
    { label: 'Campus Visitors', percent: 8, color: '#FBBF24', count: 119, icon: '🏷️' },
  ];

  const size = 220;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
      {/* SVG Donut */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Base Track */}
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius} 
            fill="transparent" 
            stroke="rgba(255,255,255,0.06)" 
            strokeWidth={strokeWidth} 
          />

          {/* Colored Segments */}
          {segments.map((seg, idx) => {
            const strokeDashoffset = circumference - (circumference * seg.percent) / 100;
            const rotation = (accumulatedPercent / 100) * 360;
            accumulatedPercent += seg.percent;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transformOrigin: 'center',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  filter: `drop-shadow(0 0 6px ${seg.color}66)`
                }}
              />
            );
          })}
        </svg>

        {/* Center Readout */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '1.75rem', fontWeight: '900', color: '#FFFFFF', lineHeight: 1 }}>1,480</span>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', marginTop: '0.2rem', textTransform: 'uppercase' }}>Active Vehicles</span>
          <span style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: '800', marginTop: '0.15rem' }}>89.7% Capacity</span>
        </div>
      </div>

      {/* Pictorial Legend List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', width: '100%' }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ 
            background: 'rgba(15, 27, 46, 0.75)', 
            padding: '0.65rem 0.85rem', 
            borderRadius: '12px', 
            border: `1px solid ${seg.color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>{seg.icon}</span>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: '600' }}>{seg.label}</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{seg.count} slots</div>
              </div>
            </div>
            <span style={{ fontSize: '0.88rem', fontWeight: '800', color: seg.color }}>{seg.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Pictorial Zone Occupancy Bars (Visual Capacity Gauge)
function PictorialZoneBars({ zones }) {
  const displayZones = zones.slice(0, 7);

  const getStatusColor = (percent) => {
    if (percent >= 85) return { color: '#F87171', bg: 'rgba(239, 68, 68, 0.15)', text: 'Critical Peak' };
    if (percent >= 60) return { color: '#FBBF24', bg: 'rgba(245, 158, 11, 0.15)', text: 'Moderate Flow' };
    return { color: '#34D399', bg: 'rgba(16, 185, 129, 0.15)', text: 'Optimal Free' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {displayZones.map((z, idx) => {
        const total = z.total || z.capacity || 100;
        const occupied = z.occupied || 0;
        const percent = Math.min(100, Math.round((occupied / total) * 100));
        const status = getStatusColor(percent);
        const isStaff = z.isStaffOnly || z.isFacultyOnly || z.name.toLowerCase().includes('staff') || z.name.toLowerCase().includes('faculty');

        return (
          <div key={idx} style={{ 
            background: 'rgba(15, 27, 46, 0.75)', 
            padding: '0.9rem 1.1rem', 
            borderRadius: '14px', 
            border: isStaff ? '1px solid rgba(192, 132, 252, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: status.color, 
                  boxShadow: `0 0 8px ${status.color}` 
                }} />
                <strong style={{ fontSize: '0.92rem', color: '#FFFFFF' }}>{z.name}</strong>
                {isStaff && (
                  <span style={{ 
                    fontSize: '0.68rem', 
                    fontWeight: '800', 
                    background: 'rgba(168, 85, 247, 0.25)', 
                    color: '#C084FC', 
                    padding: '0.15rem 0.5rem', 
                    borderRadius: '8px',
                    border: '1px solid rgba(192, 132, 252, 0.4)' 
                  }}>
                    STAFF EXCLUSIVE
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: '600' }}>
                  <span style={{ color: '#FFFFFF', fontWeight: '800' }}>{occupied}</span> / {total} slots
                </span>
                <span style={{ 
                  fontSize: '0.82rem', 
                  fontWeight: '800', 
                  color: status.color,
                  minWidth: '42px',
                  textAlign: 'right'
                }}>
                  {percent}%
                </span>
              </div>
            </div>

            {/* Pictorial Progress Track */}
            <div style={{ 
              width: '100%', 
              height: '10px', 
              background: 'rgba(255, 255, 255, 0.08)', 
              borderRadius: '999px', 
              overflow: 'hidden', 
              position: 'relative' 
            }}>
              <div style={{ 
                width: `${percent}%`, 
                height: '100%', 
                background: `linear-gradient(90deg, #6366f1 0%, ${status.color} 100%)`, 
                borderRadius: '999px',
                transition: 'width 0.8s ease-in-out',
                boxShadow: `0 0 12px ${status.color}66`
              }} />
            </div>

            {/* Sub-bar markers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.7rem', color: '#64748B' }}>
              <span>0% Empty</span>
              <span style={{ color: status.color, fontWeight: '700' }}>{status.text}</span>
              <span>100% Full</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 4. Pictorial 7-Day Forecast Histogram
function PictorialWeeklyForecast({ weeklyForecast }) {
  const days = weeklyForecast || [
    { day: 'Mon', predictedOccupancy: 88, event: 'Classes Begin' },
    { day: 'Tue', predictedOccupancy: 92, event: 'Lab Practicals' },
    { day: 'Wed', predictedOccupancy: 96, event: 'Midterm Exams' },
    { day: 'Thu', predictedOccupancy: 89, event: 'Campus Seminar' },
    { day: 'Fri', predictedOccupancy: 78, event: 'Project Reviews' },
    { day: 'Sat', predictedOccupancy: 45, event: 'Weekend Library' },
    { day: 'Sun', predictedOccupancy: 28, event: 'Restricted Access' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Visual Bar Columns */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '0.75rem', 
        alignItems: 'flex-end', 
        height: '200px', 
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)' 
      }}>
        {days.map((item, idx) => {
          const val = item.predictedOccupancy || 50;
          const isPeak = val >= 90;
          const isWed = item.day.startsWith('Wed');

          return (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              height: '100%', 
              justifyContent: 'flex-end',
              position: 'relative'
            }}>
              {/* Value Floating Tooltip */}
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '800', 
                color: isPeak ? '#F87171' : isWed ? '#38BDF8' : '#CBD5E1',
                marginBottom: '0.35rem' 
              }}>
                {val}%
              </span>

              {/* Bar Pillar */}
              <div style={{ 
                width: '100%', 
                maxWidth: '42px', 
                height: `${val}%`, 
                background: isPeak 
                  ? 'linear-gradient(180deg, #F87171 0%, #EF4444 100%)' 
                  : isWed 
                    ? 'linear-gradient(180deg, #38BDF8 0%, #2563EB 100%)' 
                    : 'linear-gradient(180deg, #6366F1 0%, #4338CA 100%)',
                borderRadius: '8px 8px 3px 3px',
                transition: 'height 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isPeak ? '0 0 16px rgba(248, 113, 113, 0.45)' : 'none',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center'
              }}>
                {isPeak && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-6px', 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    background: '#F87171', 
                    boxShadow: '0 0 10px #F87171' 
                  }} />
                )}
              </div>

              {/* Day Label */}
              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: isWed ? '800' : '600', 
                color: isWed ? '#38BDF8' : '#94A3B8', 
                marginTop: '0.6rem' 
              }}>
                {item.day.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Forecast Intelligence Summary */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'rgba(56, 189, 248, 0.08)', 
        padding: '0.75rem 1rem', 
        borderRadius: '12px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        fontSize: '0.82rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFFFF' }}>
          <Sparkles size={16} color="#38BDF8" />
          <span><strong>Wednesday Peak Warning:</strong> 96% occupancy forecast during Computer Science examinations.</span>
        </div>
        <span style={{ color: '#38BDF8', fontWeight: '800' }}>AI Confidence: 95%</span>
      </div>
    </div>
  );
}

// 5. Pictorial AI Model Radial Accuracy Gauges
function PictorialRadialGauges({ models }) {
  const defaultModels = [
    { name: 'YOLOv8 Detection', accuracy: 97.8, color: '#34D399', version: 'v2.4' },
    { name: 'EasyOCR Plates', accuracy: 96.2, color: '#38BDF8', version: 'v1.6' },
    { name: 'LSTM Forecaster', accuracy: 94.8, color: '#A855F7', version: 'v3.1' },
    { name: 'Digital Twin Sync', accuracy: 99.4, color: '#FBBF24', version: 'v4.0' },
  ];

  const modelList = models && models.length > 0
    ? models.map((m, i) => ({
        name: m.name.split(' ')[0] || `Model ${i+1}`,
        accuracy: m.accuracyPercent || 95,
        color: ['#34D399', '#38BDF8', '#A855F7', '#FBBF24'][i % 4],
        version: m.version || 'v1.0'
      }))
    : defaultModels;

  const size = 110;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', width: '100%' }}>
      {modelList.map((m, idx) => {
        const offset = circ - (circ * m.accuracy) / 100;

        return (
          <div key={idx} style={{ 
            background: 'rgba(15, 27, 46, 0.8)', 
            padding: '1rem 0.75rem', 
            borderRadius: '16px', 
            border: `1px solid ${m.color}33`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            {/* Radial SVG Circle */}
            <div style={{ position: 'relative', width: size, height: size }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                <circle 
                  cx={size / 2} 
                  cy={size / 2} 
                  r={radius} 
                  fill="transparent" 
                  stroke="rgba(255,255,255,0.08)" 
                  strokeWidth={stroke} 
                />
                <circle 
                  cx={size / 2} 
                  cy={size / 2} 
                  r={radius} 
                  fill="transparent" 
                  stroke={m.color} 
                  strokeWidth={stroke} 
                  strokeDasharray={`${circ} ${circ}`} 
                  strokeDashoffset={offset} 
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 8px ${m.color}88)`,
                    transition: 'stroke-dashoffset 1s ease-in-out'
                  }}
                />
              </svg>
              {/* Value inside gauge */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#FFFFFF' }}>{m.accuracy}%</span>
                <span style={{ fontSize: '0.65rem', color: m.color, fontWeight: '700' }}>{m.version}</span>
              </div>
            </div>

            <strong style={{ fontSize: '0.82rem', color: '#FFFFFF', marginTop: '0.6rem' }}>{m.name}</strong>
            <span style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: '700', marginTop: '0.15rem' }}>Active Engine</span>
          </div>
        );
      })}
    </div>
  );
}

// 6. Pictorial Campus Architectural Heatmap Grid
function PictorialCampusHeatmap({ zones }) {
  const campusGrid = [
    { name: 'CS Academic Block', capacity: 120, occupied: 108, x: 2, y: 1, type: 'academic', label: 'CS Block Gate 1' },
    { name: 'Central Library', capacity: 80, occupied: 62, x: 1, y: 2, type: 'library', label: 'Quiet Study Zone' },
    { name: 'Staff Parking', capacity: 50, occupied: 32, x: 3, y: 1, type: 'staff', label: 'Faculty Only' },
    { name: 'KRISHNA HOSTEL', capacity: 150, occupied: 128, x: 1, y: 3, type: 'hostel', label: 'Hostel Quad' },
    { name: 'HOSPITAL PARKING', capacity: 200, occupied: 85, x: 3, y: 3, type: 'hospital', label: 'Emergency Zone' },
    { name: 'Visitor Parking', capacity: 50, occupied: 18, x: 2, y: 3, type: 'visitor', label: 'Main Entrance' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Interactive Grid Schematic */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1rem', 
        width: '100%' 
      }}>
        {campusGrid.map((block, i) => {
          const matchedZone = zones.find(z => z.name?.toLowerCase().includes(block.name.toLowerCase()));
          const occ = matchedZone ? matchedZone.occupied : block.occupied;
          const tot = matchedZone ? (matchedZone.total || matchedZone.capacity) : block.capacity;
          const pct = Math.round((occ / tot) * 100);

          const isStaff = block.type === 'staff';
          const isCritical = pct >= 85;

          return (
            <div key={i} style={{ 
              background: 'rgba(15, 27, 46, 0.85)', 
              borderRadius: '16px', 
              padding: '1rem', 
              border: isStaff 
                ? '1px solid rgba(192, 132, 252, 0.4)' 
                : isCritical 
                  ? '1px solid rgba(248, 113, 113, 0.4)' 
                  : '1px solid rgba(255, 255, 255, 0.12)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}>
              {/* Live Pulsing Sensor Dot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: isCritical ? '#F87171' : isStaff ? '#C084FC' : '#34D399',
                    boxShadow: `0 0 10px ${isCritical ? '#F87171' : isStaff ? '#C084FC' : '#34D399'}`
                  }} />
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>
                    {block.label}
                  </span>
                </div>
                <span style={{ 
                  fontSize: '0.88rem', 
                  fontWeight: '900', 
                  color: isCritical ? '#F87171' : isStaff ? '#C084FC' : '#34D399' 
                }}>
                  {pct}%
                </span>
              </div>

              <strong style={{ fontSize: '0.98rem', color: '#FFFFFF', display: 'block', marginBottom: '0.2rem' }}>
                {block.name}
              </strong>

              <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '0.75rem' }}>
                {occ} occupied of {tot} bays
              </div>

              {/* Visual Mini Map Bars */}
              <div style={{ 
                height: '6px', 
                background: 'rgba(255,255,255,0.08)', 
                borderRadius: '99px', 
                overflow: 'hidden' 
              }}>
                <div style={{ 
                  width: `${pct}%`, 
                  height: '100%', 
                  background: isCritical ? '#F87171' : isStaff ? '#C084FC' : '#38BDF8',
                  borderRadius: '99px' 
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// MAIN ANALYTICS DASHBOARD EXPORT
// ==========================================
export default function Analytics() {
  const [activeTab, setActiveTab] = useState('pictorial'); // 'pictorial' | 'explainable' | 'models'
  const [hoveredHour, setHoveredHour] = useState(null);

  const [kpis, setKpis] = useState({
    parkingEfficiencyPercent: '94.2%',
    recommendationAccuracyPercent: '96.4%',
    predictionAccuracyPercent: '94.8%',
    systemAvailabilityPercent: '99.9%',
    avgSearchTimeSavedMins: '8.5 mins'
  });

  const [zones, setZones] = useState([
    { name: 'CS Academic Block', total: 120, occupied: 108 },
    { name: 'KRISHNA HOSTEL', total: 150, occupied: 124 },
    { name: 'Central Library', total: 80, occupied: 62 },
    { name: 'South Block', total: 150, occupied: 94 },
    { name: 'HOSPITAL PARKING', total: 200, occupied: 85 },
    { name: 'Staff Parking', total: 50, occupied: 32, isStaffOnly: true },
    { name: 'Visitor Parking', total: 50, occupied: 18 }
  ]);

  const [weeklyForecast, setWeeklyForecast] = useState([
    { day: 'Monday', predictedOccupancy: 88 },
    { day: 'Tuesday', predictedOccupancy: 92 },
    { day: 'Wednesday', predictedOccupancy: 96 },
    { day: 'Thursday', predictedOccupancy: 89 },
    { day: 'Friday', predictedOccupancy: 78 },
    { day: 'Saturday', predictedOccupancy: 45 },
    { day: 'Sunday', predictedOccupancy: 28 },
  ]);

  const [optimizations, setOptimizations] = useState([
    {
      id: 'opt-1',
      title: 'CSE Exam Week Traffic Redirection',
      impact: 'Prevents 98% bottleneck in CS Block Zone',
      explanation: 'AI Model predicts 45 additional vehicles arriving at CS Block between 09:00 AM – 10:00 AM. Redirecting 25 vehicles to Krishna Hostel optimizes campus traffic flow.',
      confidenceScore: 0.96
    },
    {
      id: 'opt-2',
      title: 'EV Fast-Charge Hub Rotation',
      impact: 'Boosts EV station throughput by +34%',
      explanation: 'Automated 2-hour stay limit notification dispatches when vehicle reaches 85% battery, freeing slots for incoming commuters.',
      confidenceScore: 0.92
    }
  ]);

  const [visionAlerts, setVisionAlerts] = useState([
    { id: 'v1', type: 'LINE_VIOLATION', location: 'CS Block - Bay A-14', plateNumber: 'UP-16-AB-9999', confidence: 0.97, time: '5m ago' },
    { id: 'v2', type: 'OVERSTAY_ALERT', location: 'Central Library - Bay L-04', plateNumber: 'KA-04-MB-2024', confidence: 0.94, time: '14m ago' }
  ]);

  const [models, setModels] = useState([
    { name: 'YOLOv8-Campus Vehicle Detector', version: 'v2.4', accuracyPercent: 97.8, status: 'DEPLOYED' },
    { name: 'EasyOCR License Plate Reader', version: 'v1.6', accuracyPercent: 96.2, status: 'DEPLOYED' },
    { name: 'LSTM Predictive Forecaster', version: 'v3.1', accuracyPercent: 94.8, status: 'DEPLOYED' },
    { name: 'Digital Twin State Sync', version: 'v4.0', accuracyPercent: 99.4, status: 'DEPLOYED' }
  ]);

  // Fetch live analytical data from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [kpiRes, optRes, visRes, modelRes, zoneRes, predRes] = await Promise.allSettled([
          axios.get(`${BACKEND_URL}/ai/kpi-analytics`),
          axios.get(`${BACKEND_URL}/ai/optimization`),
          axios.get(`${BACKEND_URL}/ai/vision-analytics`),
          axios.get(`${BACKEND_URL}/ai/models`),
          axios.get(`${BACKEND_URL}/zones`),
          axios.get(`${BACKEND_URL}/ai/advanced-predictions`),
        ]);

        if (kpiRes.status === 'fulfilled' && kpiRes.value.data?.kpi) setKpis(kpiRes.value.data.kpi);
        if (optRes.status === 'fulfilled' && Array.isArray(optRes.value.data?.recommendations)) setOptimizations(optRes.value.data.recommendations);
        if (visRes.status === 'fulfilled' && Array.isArray(visRes.value.data?.visionAlerts)) setVisionAlerts(visRes.value.data.visionAlerts);
        if (modelRes.status === 'fulfilled' && Array.isArray(modelRes.value.data)) setModels(modelRes.value.data);
        if (zoneRes.status === 'fulfilled' && Array.isArray(zoneRes.value.data)) setZones(zoneRes.value.data);
        if (predRes.status === 'fulfilled' && Array.isArray(predRes.value.data?.predictions?.weeklyForecast)) {
          setWeeklyForecast(predRes.value.data.predictions.weeklyForecast);
        }
      } catch (e) {}
    };

    fetchAnalytics();
  }, []);

  const handleExportPDF = () => {
    const reportText = `
===================================================================
PARKNEX-AI ADVANCED PICTORIAL & AI RESEARCH ANALYTICS REPORT
===================================================================
Generated On: ${new Date().toLocaleString()}
System Availability: ${kpis.systemAvailabilityPercent}

1. AI PERFORMANCE KPIS:
-------------------------------------------------------------------
- Parking Efficiency:             ${kpis.parkingEfficiencyPercent}
- Recommendation Accuracy:        ${kpis.recommendationAccuracyPercent}
- Occupancy Prediction Forecast:   ${kpis.predictionAccuracyPercent}
- Average Search Time Saved:       ${kpis.avgSearchTimeSavedMins}

2. ZONE PICTORIAL UTILIZATION BREAKDOWN:
-------------------------------------------------------------------
${zones.map(z => `- ${z.name}: ${z.occupied || 0}/${z.total || 100} slots (${Math.round(((z.occupied || 0)/(z.total || 100))*100)}% Occupied)`).join('\n')}

3. DEPLOYED AI MODEL REGISTRY:
-------------------------------------------------------------------
${models.map((m, i) => `${i + 1}. ${m.name} (${m.version}) | Accuracy: ${m.accuracyPercent}% | Status: ${m.status}`).join('\n')}

===================================================================
Verified by ParkNex-AI Computer Vision & Predictive Analytics Core
    `;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ParkNex_AI_Pictorial_Analytics_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvHeaders = ['Zone_Name', 'Total_Capacity', 'Occupied_Slots', 'Occupancy_Percent', 'Classification'];
    const csvRows = zones.map(z => [
      `"${z.name}"`,
      `"${z.total || 100}"`,
      `"${z.occupied || 0}"`,
      `"${Math.round(((z.occupied || 0)/(z.total || 100))*100)}%"`,
      `"${z.isStaffOnly ? 'STAFF_EXCLUSIVE' : 'GENERAL_STUDENT'}"`
    ]);
    const csvContent = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ParkNex_AI_Zones_Analytics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      
      {/* HEADER SECTION */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1.25rem',
        background: 'rgba(15, 27, 46, 0.85)',
        padding: '1.5rem 1.75rem',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)', 
              color: '#FFFFFF', 
              padding: '0.25rem 0.65rem', 
              borderRadius: '8px', 
              fontSize: '0.75rem', 
              fontWeight: '800',
              letterSpacing: '0.5px' 
            }}>
              PICTORIAL ANALYTICS
            </span>
            <span style={{ fontSize: '0.82rem', color: '#34D399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', display: 'inline-block', boxShadow: '0 0 8px #34D399' }} />
              Live Sensor Telemetry
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            Visual Campus Intelligence & Predictive Charts
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Real-time pictorial occupancy curves, vehicle distribution donuts, 7-day forecast histograms, and vision AI health.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={handleExportPDF} style={{ gap: '0.45rem', fontSize: '0.85rem' }}>
            <Download size={15} /> Export Report
          </button>
          <button className="btn btn-outline" onClick={handleExportCSV} style={{ gap: '0.45rem', fontSize: '0.85rem' }}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* TOP SUMMARY STAT KPI CARDS */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34D399' }}><Award /></div>
          <div className="stat-info">
            <span className="label">Recommendation Accuracy</span>
            <span className="value" style={{ color: '#34D399' }}>{kpis.recommendationAccuracyPercent}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}><TrendingUp /></div>
          <div className="stat-info">
            <span className="label">Prediction Accuracy</span>
            <span className="value" style={{ color: '#38BDF8' }}>{kpis.predictionAccuracyPercent}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' }}><Cpu /></div>
          <div className="stat-info">
            <span className="label">System Availability</span>
            <span className="value" style={{ color: '#C084FC' }}>{kpis.systemAvailabilityPercent}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24' }}><Zap /></div>
          <div className="stat-info">
            <span className="label">Avg Search Time Saved</span>
            <span className="value" style={{ color: '#FBBF24' }}>{kpis.avgSearchTimeSavedMins}</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS: Pictorial View vs Model Registry */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
        paddingBottom: '0.5rem' 
      }}>
        <button 
          onClick={() => setActiveTab('pictorial')}
          style={{
            background: activeTab === 'pictorial' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: activeTab === 'pictorial' ? '1px solid #6366f1' : '1px solid transparent',
            color: activeTab === 'pictorial' ? '#FFFFFF' : '#94A3B8',
            padding: '0.6rem 1.25rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <BarChart2 size={16} color={activeTab === 'pictorial' ? '#6366f1' : '#94A3B8'} />
          Pictorial Charts & Visuals
        </button>

        <button 
          onClick={() => setActiveTab('explainable')}
          style={{
            background: activeTab === 'explainable' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: activeTab === 'explainable' ? '1px solid #6366f1' : '1px solid transparent',
            color: activeTab === 'explainable' ? '#FFFFFF' : '#94A3B8',
            padding: '0.6rem 1.25rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Zap size={16} color={activeTab === 'explainable' ? '#6366f1' : '#94A3B8'} />
          Explainable AI & Recommendations
        </button>

        <button 
          onClick={() => setActiveTab('models')}
          style={{
            background: activeTab === 'models' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: activeTab === 'models' ? '1px solid #6366f1' : '1px solid transparent',
            color: activeTab === 'models' ? '#FFFFFF' : '#94A3B8',
            padding: '0.6rem 1.25rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Cpu size={16} color={activeTab === 'models' ? '#6366f1' : '#94A3B8'} />
          AI Models & Vision Alerts
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PICTORIAL CHARTS & VISUALS (PRIMARY USER FOCUS)                     */}
      {/* ========================================================================= */}
      {activeTab === 'pictorial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* SECTION 1: 24-HOUR TRAFFIC SPLINE WAVE */}
          <div className="card" style={{ padding: '1.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <TrendingUp size={20} color="#38BDF8" /> 24-Hour Campus Inflow vs. Outflow Wave
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                  Smooth bezier spline showing live vehicle movements throughout academic shifts
                </p>
              </div>

              <div style={{ 
                background: 'rgba(56, 189, 248, 0.1)', 
                border: '1px solid rgba(56, 189, 248, 0.3)', 
                padding: '0.35rem 0.8rem', 
                borderRadius: '20px', 
                fontSize: '0.78rem', 
                fontWeight: '800', 
                color: '#38BDF8' 
              }}>
                Live Stream: Active
              </div>
            </div>

            <PictorialTrafficWave hoveredHour={hoveredHour} setHoveredHour={setHoveredHour} />
          </div>

          {/* SECTION 2: TWO-COLUMN PICTORIAL METRICS (ZONE BARS + PERMIT DONUT) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            
            {/* LEFT: PICTORIAL ZONE OCCUPANCY BARS */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart2 size={18} color="#6366f1" /> Zone Capacity & Utilization
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                    Color-coded visual bars (Optimal &lt;60%, Moderate 60-85%, Critical &gt;85%)
                  </p>
                </div>
              </div>

              <PictorialZoneBars zones={zones} />
            </div>

            {/* RIGHT: PICTORIAL DONUT CHART (PERMITS) */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Car size={18} color="#C084FC" /> Vehicle & Permit Distribution
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                    Visual circular breakdown of campus parking space allocations
                  </p>
                </div>
              </div>

              <PictorialDonutChart />
            </div>

          </div>

          {/* SECTION 3: 7-DAY FORECAST HISTOGRAM & AI MODEL RADIAL GAUGES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            
            {/* 7-DAY FORECAST BARS */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} color="#38BDF8" /> 7-Day Predictive Demand Histogram
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                    LSTM machine learning forecast based on exam schedules & academic calendar
                  </p>
                </div>
              </div>

              <PictorialWeeklyForecast weeklyForecast={weeklyForecast} />
            </div>

            {/* AI MODEL RADIAL ACCURACY GAUGES */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cpu size={18} color="#34D399" /> AI Vision & Pipeline Health Gauges
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                    Circular radial progress meters representing production inference accuracy
                  </p>
                </div>
              </div>

              <PictorialRadialGauges models={models} />
            </div>

          </div>

          {/* SECTION 4: CAMPUS ARCHITECTURAL SCHEMATIC HEATMAP */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Compass size={20} color="#FBBF24" /> Campus Parking Architectural Schematic
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                  Live visual bird’s-eye schematic with automated sensor state and occupancy heat levels
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: '700' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34D399' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399' }} /> Optimal
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#C084FC' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C084FC' }} /> Staff Zone
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#F87171' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F87171' }} /> Critical Peak
                </span>
              </div>
            </div>

            <PictorialCampusHeatmap zones={zones} />
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXPLAINABLE AI & RECOMMENDATIONS                                   */}
      {/* ========================================================================= */}
      {activeTab === 'explainable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <Zap size={22} color="var(--primary)" /> Explainable AI Decision Support
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {optimizations.map((opt) => (
                <div key={opt.id} style={{ padding: '1.25rem', background: 'rgba(99,102,241,0.06)', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>{opt.title}</strong>
                    <span className="badge badge-success">Confidence: {Math.round(opt.confidenceScore * 100)}%</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#CBD5E1', marginBottom: '0.75rem', lineHeight: '1.6' }}>
                    {opt.explanation}
                  </p>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#6366f1' }}>
                    Impact: {opt.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI MODEL REGISTRY & VISION ALERTS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'models' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* VISION AI ANOMALIES */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#F87171' }}>
              <Eye size={22} color="#F87171" /> Vision AI Anomaly Detection Feed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visionAlerts.map((v) => (
                <div key={v.id} style={{ padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.08)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: '800', color: '#FBBF24', fontSize: '0.85rem' }}>{v.type}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{v.time}</span>
                  </div>
                  <strong style={{ color: '#FFFFFF', display: 'block', fontSize: '0.95rem' }}>{v.plateNumber} ({v.location})</strong>
                  <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '0.2rem' }}>
                    Vision Detection Confidence: {Math.round(v.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI MODEL REGISTRY TABLE */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
              <Cpu size={22} color="#6366f1" /> Deployed AI Model Registry & Performance Metrics
            </h3>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Model Architecture</th>
                    <th>Version</th>
                    <th>Accuracy Metric</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, idx) => (
                    <tr key={idx}>
                      <td><strong style={{ color: '#FFFFFF' }}>{m.name}</strong></td>
                      <td><code style={{ color: '#6366f1', fontWeight: '700' }}>{m.version}</code></td>
                      <td style={{ color: '#34D399', fontWeight: '800' }}>{m.accuracyPercent}%</td>
                      <td><span className="badge badge-success">{m.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
