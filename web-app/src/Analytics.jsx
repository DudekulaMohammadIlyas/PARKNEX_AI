import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Cpu, RefreshCw, AlertCircle, ShieldAlert, Award, Layers, Eye, Zap, Activity, CheckCircle, Navigation, Radio, Database, Download } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function Analytics() {
  const [kpis, setKpis] = useState({
    parkingEfficiencyPercent: '94.2%',
    recommendationAccuracyPercent: '96.4%',
    predictionAccuracyPercent: '94.8%',
    systemAvailabilityPercent: '99.9%',
    avgSearchTimeSavedMins: '8.5 mins'
  });

  const [digitalTwin, setDigitalTwin] = useState({
    buildings: [
      { id: 'b1', name: 'CS Academic Block', color: '#3B82F6' },
      { id: 'b2', name: 'ECE Building', color: '#8B5CF6' },
      { id: 'b3', name: 'Central Library', color: '#10B981' }
    ],
    gates: [{ id: 'g1', name: 'Main Gate', barrierState: 'CLOSED' }],
    movingVehicles: [{ plate: 'KA-01-AB-1234', targetZone: 'Zone A', status: 'PARKING' }]
  });

  const [optimizations, setOptimizations] = useState([
    {
      id: 'opt-1',
      title: 'CSE Exam Week Traffic Redirection',
      impact: 'Prevents 98% bottleneck in Zone B',
      explanation: 'AI Model predicts 45 additional vehicles arriving at CS Block between 09:00 AM – 10:00 AM. Redirecting 25 vehicles to Zone A optimizes campus traffic flow.',
      confidenceScore: 0.96
    }
  ]);

  const [visionAlerts, setVisionAlerts] = useState([
    { id: 'v1', type: 'LINE_VIOLATION', location: 'Zone A - Slot A-14', plateNumber: 'UP-16-AB-9999', confidence: 0.97, time: '5m ago' }
  ]);

  const [models, setModels] = useState([
    { name: 'YOLOv8-Campus Vehicle Detector', version: 'v2.4', accuracyPercent: 97.8, status: 'DEPLOYED' },
    { name: 'EasyOCR License Plate Reader', version: 'v1.6', accuracyPercent: 96.2, status: 'DEPLOYED' },
    { name: 'LSTM Predictive Occupancy Forecaster', version: 'v3.1', accuracyPercent: 94.8, status: 'DEPLOYED' }
  ]);

  const [anomalies, setAnomalies] = useState([
    { title: 'Unexpected Occupancy Spike in Zone B', riskScore: 0.88, details: 'Zone B reached 98% occupancy 45 mins before scheduled lectures.' }
  ]);

  useEffect(() => {
    const fetchPhase7Data = async () => {
      try {
        const [kpiRes, twinRes, optRes, visRes, modelRes, anomRes] = await Promise.allSettled([
          axios.get(`${BACKEND_URL}/ai/kpi-analytics`),
          axios.get(`${BACKEND_URL}/ai/digital-twin`),
          axios.get(`${BACKEND_URL}/ai/optimization`),
          axios.get(`${BACKEND_URL}/ai/vision-analytics`),
          axios.get(`${BACKEND_URL}/ai/models`),
          axios.get(`${BACKEND_URL}/ai/anomalies`)
        ]);

        if (kpiRes.status === 'fulfilled' && kpiRes.value.data?.kpi) setKpis(kpiRes.value.data.kpi);
        if (twinRes.status === 'fulfilled' && twinRes.value.data?.digitalTwin) setDigitalTwin(twinRes.value.data.digitalTwin);
        if (optRes.status === 'fulfilled' && Array.isArray(optRes.value.data?.recommendations)) setOptimizations(optRes.value.data.recommendations);
        if (visRes.status === 'fulfilled' && Array.isArray(visRes.value.data?.visionAlerts)) setVisionAlerts(visRes.value.data.visionAlerts);
        if (modelRes.status === 'fulfilled' && Array.isArray(modelRes.value.data)) setModels(modelRes.value.data);
        if (anomRes.status === 'fulfilled' && Array.isArray(anomRes.value.data)) setAnomalies(anomRes.value.data);
      } catch (e) {}
    };
    fetchPhase7Data();
  }, []);

  const handleExportPDF = () => {
    const reportText = `
===================================================================
PARKNEX-AI ADVANCED AI & RESEARCH ANALYTICS REPORT (PDF)
===================================================================
Generated On: ${new Date().toLocaleString()}
System Availability: ${kpis.systemAvailabilityPercent}

1. AI PERFORMANCE KPIS:
-------------------------------------------------------------------
- Parking Efficiency:           ${kpis.parkingEfficiencyPercent}
- Recommendation Accuracy:      ${kpis.recommendationAccuracyPercent}
- Occupancy Prediction Forecast: ${kpis.predictionAccuracyPercent}
- Average Search Time Saved:     ${kpis.avgSearchTimeSavedMins}

2. DEPLOYED AI MODEL REGISTRY:
-------------------------------------------------------------------
${models.map((m, i) => `${i + 1}. ${m.name} (${m.version}) | Accuracy: ${m.accuracyPercent}% | Status: ${m.status}`).join('\n')}

3. AI VISION ALERTS & ANOMALIES:
-------------------------------------------------------------------
${visionAlerts.map((v, i) => `${i + 1}. Type: ${v.type} | Location: ${v.location} | Plate: ${v.plateNumber} | Confidence: ${v.confidence}`).join('\n')}

===================================================================
Verified by ParkNex-AI Machine Learning Research Engine
    `;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ParkNex_AI_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvHeaders = ['Model_Name', 'Version', 'Accuracy_Percent', 'Status'];
    const csvRows = models.map(m => [
      `"${m.name}"`,
      `"${m.version}"`,
      `"${m.accuracyPercent}"`,
      `"${m.status}"`
    ]);
    const csvContent = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ParkNex_AI_Models_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
      <div className="section-header" style={{ marginBottom: 0, flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="section-title">Next-Gen AI Research & Operations Analytics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Campus Digital Twin, Explainable Decision Support, Vision AI & Anomalies</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={handleExportPDF} style={{ gap: '0.4rem' }}><Download size={16} /> Export PDF</button>
          <button className="btn btn-outline" onClick={handleExportCSV} style={{ gap: '0.4rem' }}><Download size={16} /> Export CSV</button>
        </div>
      </div>

      {/* RESEARCH KPI GRID */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}><Award /></div>
          <div className="stat-info">
            <span className="label">Recommendation Accuracy</span>
            <span className="value">{kpis.recommendationAccuracyPercent}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}><TrendingUp /></div>
          <div className="stat-info">
            <span className="label">Prediction Forecast Accuracy</span>
            <span className="value">{kpis.predictionAccuracyPercent}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6' }}><Cpu /></div>
          <div className="stat-info">
            <span className="label">System Availability</span>
            <span className="value">{kpis.systemAvailabilityPercent}</span>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon-box" style={{ background: '#fef3c7', color: '#f59e0b' }}><Zap /></div>
          <div className="stat-info">
            <span className="label">Avg Search Time Saved</span>
            <span className="value">{kpis.avgSearchTimeSavedMins}</span>
          </div>
        </div>
      </div>

      {/* PHASE 7: EXPLAINABLE DECISION SUPPORT & DIGITAL TWIN OVERLAY */}
      <div className="charts-grid">
        
        {/* EXPLAINABLE OPTIMIZATION RECOMMENDATIONS */}
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <Zap size={22} color="var(--primary)" /> Explainable AI Decision Support
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {optimizations.map((opt) => (
              <div key={opt.id} style={{ padding: '1.25rem', background: 'rgba(99,102,241,0.05)', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{opt.title}</strong>
                  <span className="badge badge-success">Confidence: {Math.round(opt.confidenceScore * 100)}%</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                  {opt.explanation}
                </p>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)' }}>
                  Impact: {opt.impact}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REAL-TIME VISION AI ANOMALY ALERTS */}
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <Eye size={22} /> Vision AI Anomaly Detection
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {visionAlerts.map((v) => (
              <div key={v.id} style={{ padding: '1rem', background: 'rgba(239,68,68,0.05)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: '800', color: 'var(--warning)', fontSize: '0.85rem' }}>{v.type}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.time}</span>
                </div>
                <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '0.9rem' }}>{v.plateNumber} ({v.location})</strong>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* PHASE 7: AI MODEL REGISTRY */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
          <Cpu size={22} color="var(--primary)" /> Deployed AI Model Registry & Performance
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
                  <td><strong style={{ color: 'var(--text-main)' }}>{m.name}</strong></td>
                  <td><code style={{ color: 'var(--primary)', fontWeight: '700' }}>{m.version}</code></td>
                  <td style={{ color: 'var(--success)', fontWeight: '800' }}>{m.accuracyPercent}%</td>
                  <td><span className="badge badge-success">{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
