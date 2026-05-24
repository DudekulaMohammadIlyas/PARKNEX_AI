import React, { useState } from 'react';
import { BarChart3, PieChart, Map as MapIcon, Calendar, Download, ChevronDown } from 'lucide-react';

export default function Analytics() {
  const [selectedMonth, setSelectedMonth] = useState('Aug 2024');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const months = ['May 2024', 'Jun 2024', 'Jul 2024', 'Aug 2024'];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Successfully exported PDF report for ${selectedMonth}!`);
    }, 1500);
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <div className="section-header">
        <h2 className="section-title">Analytics & Reports</h2>
        
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', overflow: 'visible' }}>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-outline" onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} /> {selectedMonth} <ChevronDown size={14} />
            </button>
            
            {isMonthDropdownOpen && (
              <div className="card animate-fade-in" style={{ position: 'absolute', top: '50px', left: 0, zIndex: 60, width: '150px', padding: '0.5rem', boxShadow: 'var(--shadow)' }}>
                {months.map((m) => (
                  <button 
                    key={m} 
                    className="nav-item" 
                    style={{ width: '100%', border: 'none', background: selectedMonth === m ? 'var(--primary-light)' : 'none', textAlign: 'left', padding: '0.5rem 0.75rem', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedMonth(m);
                      setIsMonthDropdownOpen(false);
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={handleExport} disabled={isExporting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '130px', justifyContent: 'center' }}>
            {isExporting ? (
              <>Generating...</>
            ) : (
              <><Download size={18} /> Export Report</>
            )}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}><BarChart3 /></div>
          <div className="stat-info">
            <span className="label">Peak Occupancy</span>
            <span className="value">94%</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}><PieChart /></div>
          <div className="stat-info">
            <span className="label">Revenue ({selectedMonth.split(' ')[0]})</span>
            <span className="value">₹12.4L</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: '#fff7ed', color: '#f97316' }}><MapIcon /></div>
          <div className="stat-info">
            <span className="label">Busiest Zone</span>
            <span className="value">Zone A</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', borderStyle: 'dashed' }}>
        <div style={{ textAlign: 'center' }}>
          <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
          <p>Advanced Heatmaps and AI Insights for {selectedMonth} coming soon</p>
        </div>
      </div>
    </div>
  );
}
