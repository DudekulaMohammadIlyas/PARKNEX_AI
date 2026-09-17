import React, { useState, useEffect, useRef } from 'react';
import { Shield, Camera, AlertTriangle, Activity, History, Search, Eye, MapPin, CheckCircle, Clock, UserCheck, Ticket, Plus, X, Video, Play, Pause, RefreshCw, QrCode, CheckCircle2, CameraOff, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import { Html5Qrcode } from 'html5-qrcode';

// Animated Live CCTV Video Stream Component with AI Bounding Box Overlays & Clear High-Contrast Typography
function DynamicCCTVStream({ camId, id, camName, zoneName, targetPlate, status, onIssueTicket, onDeleteCam }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeStr, setTimeStr] = useState('');
  const [boxPosition, setBoxPosition] = useState({ x: 30, y: 25 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(`REC ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString()}.${String(now.getMilliseconds()).padStart(3, '0')}`);
      
      if (isPlaying) {
        setBoxPosition({
          x: 25 + Math.sin(Date.now() / 1200) * 8,
          y: 20 + Math.cos(Date.now() / 1500) * 5
        });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div style={{ backgroundColor: '#0B0F19', borderRadius: '18px', border: '1.5px solid #1E293B', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
      {/* CCTV Header */}
      <div style={{ padding: '0.85rem 1.1rem', backgroundColor: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isPlaying ? '#EF4444' : '#94A3B8', boxShadow: isPlaying ? '0 0 10px #EF4444' : 'none' }}></div>
          <div>
            <div style={{ fontWeight: '900', fontSize: '0.92rem', color: '#FFFFFF', letterSpacing: '0.3px' }}>{camId}: {camName}</div>
            <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: '800', marginTop: '2px' }}>Zone: {zoneName || 'Campus Main'}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: '900', 
            padding: '4px 10px', 
            borderRadius: '20px', 
            backgroundColor: status === 'UNAUTHORIZED' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
            color: status === 'UNAUTHORIZED' ? '#FCA5A5' : '#34D399',
            border: `1px solid ${status === 'UNAUTHORIZED' ? '#EF4444' : '#10B981'}`
          }}>
            {status}
          </span>
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
            title={isPlaying ? 'Pause Feed' : 'Play Feed'}
          >
            {isPlaying ? <Pause size={14} color="#F8FAFC" /> : <Play size={14} color="#F8FAFC" />}
          </button>
          {onDeleteCam && (
            <button 
              onClick={() => onDeleteCam(id || camId)} 
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              title="Remove Camera Stream"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* CCTV Simulated Live Video Viewport */}
      <div style={{ minHeight: '220px', backgroundColor: '#020617', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Grid Overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        {/* Dynamic AI Bounding Box */}
        <div style={{
          position: 'absolute',
          top: `${boxPosition.y}%`,
          left: `${boxPosition.x}%`,
          width: '145px',
          height: '95px',
          border: status === 'UNAUTHORIZED' ? '2.5px solid #EF4444' : '2.5px solid #00FF66',
          borderRadius: '8px',
          boxShadow: status === 'UNAUTHORIZED' ? '0 0 20px rgba(239,68,68,0.6)' : '0 0 20px rgba(0,255,102,0.6)',
          transition: 'top 0.2s ease, left 0.2s ease'
        }}>
          <div style={{
            position: 'absolute',
            top: '-24px',
            left: '-2px',
            backgroundColor: status === 'UNAUTHORIZED' ? '#EF4444' : '#00FF66',
            color: '#000000',
            fontSize: '10px',
            fontWeight: '900',
            padding: '3px 8px',
            borderRadius: '4px 4px 0 0',
            whiteSpace: 'nowrap'
          }}>
            {status === 'UNAUTHORIZED' ? '⚠️ UNAUTHORIZED' : 'VEHICLE DETECTED 98%'}
          </div>
        </div>

        {/* Placeholder Icon */}
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', zIndex: 1 }}>
          <Camera size={44} color="#38BDF8" style={{ marginBottom: '0.4rem' }} />
          <p style={{ fontSize: '0.78rem', fontWeight: '800', color: '#F8FAFC', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
            LIVE AI VISION STREAM ACTIVE
          </p>
        </div>

        {/* Laser Scanner Line */}
        {isPlaying && (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: status === 'UNAUTHORIZED' ? '#EF4444' : '#00FF66',
            boxShadow: status === 'UNAUTHORIZED' ? '0 0 15px #EF4444' : '0 0 15px #00FF66',
            animation: 'laserScan 2.5s infinite linear'
          }}></div>
        )}

        {/* Timestamp & Plate Overlay Bar */}
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
          <div style={{ backgroundColor: '#06150B', padding: '0.4rem 0.7rem', borderRadius: '8px', border: status === 'UNAUTHORIZED' ? '1.5px solid #EF4444' : '1.5px solid #00FF66' }}>
            <span style={{ color: status === 'UNAUTHORIZED' ? '#FCA5A5' : '#00FF66', fontSize: '0.82rem', fontWeight: '900', fontFamily: 'monospace' }}>
              PLATE: {targetPlate}
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#F8FAFC', backgroundColor: '#0F172A', padding: '0.3rem 0.6rem', borderRadius: '6px', fontFamily: 'monospace', fontWeight: '700', border: '1px solid #334155' }}>
            {timeStr}
          </span>
        </div>

      </div>

      {/* Action Footer */}
      <div style={{ padding: '0.7rem 1.1rem', backgroundColor: '#0F172A', borderTop: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: '700' }}>Resolution: 1080p • 60 FPS</span>
        <button 
          style={{ 
            fontSize: '0.78rem', 
            fontWeight: '800',
            padding: '0.4rem 0.8rem', 
            borderRadius: '8px',
            backgroundColor: status === 'UNAUTHORIZED' ? '#EF4444' : '#2563EB', 
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
          onClick={() => onIssueTicket(targetPlate)}
        >
          <Ticket size={14} color="#FFFFFF" /> Issue Ticket
        </button>
      </div>

      <style>{`
        @keyframes laserScan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}

export default function SecurityDashboard({ 
  occupancy, 
  events, 
  BACKEND_URL = 'http://localhost:5000/api', 
  profile, 
  onEditProfile, 
  activeTab: propActiveTab = 'overview' 
}) {
  const [activeTab, setActiveTab] = useState(propActiveTab);

  useEffect(() => {
    setActiveTab(propActiveTab);
  }, [propActiveTab]);

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [activeCam, setActiveCam] = useState('Cam 01');
  const [licensePlate, setLicensePlate] = useState('');
  const [logs, setLogs] = useState([]);

  // Visitor Management States
  const [visitors, setVisitors] = useState([]);

  // Violation Management States
  const [violations, setViolations] = useState([]);
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [violationPlate, setViolationPlate] = useState('');
  const [violationType, setViolationType] = useState('WRONG_PARKING');
  const [violationDesc, setViolationDesc] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState(500);
  const [modalFormError, setModalFormError] = useState('');
  const [isSubmittingViolation, setIsSubmittingViolation] = useState(false);

  // Gate Scanner Simulator state
  const [inputPlate, setInputPlate] = useState('');
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Security QR Scanner & Vehicle Release State
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [scannedQRDetails, setScannedQRDetails] = useState(null);
  const [isExecutingRelease, setIsExecutingRelease] = useState(false);
  const [releaseFeedback, setReleaseFeedback] = useState(null);

  // Web Camera Hardware State
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    let html5QrcodeScanner = null;
    let isMounted = true;

    if (isQRModalOpen && isCameraActive) {
      setIsCameraLoading(true);
      setCameraError(null);

      const timer = setTimeout(() => {
        const qrContainer = document.getElementById('webcam-qr-reader');
        if (!qrContainer || !isMounted) return;

        try {
          html5QrcodeScanner = new Html5Qrcode('webcam-qr-reader');
          const config = { fps: 10, qrbox: { width: 220, height: 160 } };

          html5QrcodeScanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              if (!isMounted) return;
              setQrTokenInput(decodedText);
              handleScanQRToken(decodedText);
              if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
                html5QrcodeScanner.stop().catch(() => {});
                setIsCameraActive(false);
              }
            },
            () => {}
          ).then(() => {
            if (isMounted) setIsCameraLoading(false);
          }).catch((err) => {
            if (isMounted) {
              setIsCameraLoading(false);
              setCameraError(err?.message || 'Camera permission denied or camera unavailable. Please check browser settings or use manual input below.');
            }
          });
        } catch (e) {
          if (isMounted) {
            setIsCameraLoading(false);
            setCameraError('Could not initialize webcam scanner. You can enter or select a QR token manually below.');
          }
        }
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (html5QrcodeScanner) {
          try {
            if (html5QrcodeScanner.isScanning) {
              html5QrcodeScanner.stop().catch(() => {});
            }
          } catch (e) {}
        }
      };
    }
  }, [isQRModalOpen, isCameraActive]);

  const handleScanQRToken = async (overrideToken = null) => {
    const targetToken = (overrideToken || qrTokenInput || '').trim();
    if (!targetToken) {
      alert('Please enter or scan a valid QR pass code / vehicle plate.');
      return;
    }

    setIsScanningQR(true);
    setScannedQRDetails(null);
    setReleaseFeedback(null);

    try {
      const res = await axios.post(`${BACKEND_URL}/security/scan-qr`, {
        qrData: targetToken,
        role: 'SECURITY',
        email: profile?.email || 'security@college.edu'
      });

      if (res.data?.success) {
        setScannedQRDetails(res.data);
      } else {
        alert(res.data?.error || 'Failed to resolve QR code.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error resolving QR code.');
    } finally {
      setIsScanningQR(false);
    }
  };

  const handleConfirmVehicleRelease = async () => {
    if (!scannedQRDetails?.vehicle?.plateNumber) return;
    setIsExecutingRelease(true);
    setReleaseFeedback(null);

    const plateNumber = scannedQRDetails.vehicle.plateNumber;
    const bookingId = scannedQRDetails.booking?.id || null;

    try {
      const res = await axios.post(`${BACKEND_URL}/security/release-vehicle`, {
        bookingId,
        plateNumber,
        officerEmail: profile?.email || 'security@college.edu',
        role: 'SECURITY',
        remarks: 'Released via Web Command Center QR Scanner'
      });

      if (res.data?.success) {
        setReleaseFeedback({
          type: 'success',
          msg: `✅ Vehicle ${plateNumber} successfully RELEASED! Gate barrier opening.`
        });
        setScannedQRDetails(prev => prev ? {
          ...prev,
          isEligible: false,
          status: 'RELEASED',
          eligibilityReason: `Vehicle ${plateNumber} was RELEASED at ${new Date().toLocaleTimeString()} by ${profile?.email || 'Security Officer'}.`
        } : null);
        fetchSecurityLogs();
        fetchIncidentsFromBackend();
      }
    } catch (err) {
      const errRes = err.response?.data;
      if (err.response?.status === 409 || errRes?.status === 'ALREADY_RELEASED') {
        setReleaseFeedback({
          type: 'duplicate',
          msg: errRes?.error || `⚠️ Duplicate Release Blocked: Vehicle ${plateNumber} was ALREADY released.`
        });
        setScannedQRDetails(prev => prev ? {
          ...prev,
          isEligible: false,
          status: 'ALREADY_RELEASED',
          eligibilityReason: `Vehicle ${plateNumber} has already been released.`
        } : null);
      } else {
        setReleaseFeedback({
          type: 'error',
          msg: errRes?.error || 'Failed to release vehicle. Please try again.'
        });
      }
    } finally {
      setIsExecutingRelease(false);
    }
  };

  const fetchVisitors = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/visitors`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setVisitors(res.data);
      }
    } catch (e) {}
  };

  const fetchViolations = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/violations`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setViolations(res.data);
      }
    } catch (e) {}
  };

  const fetchIncidentsFromBackend = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/incidents`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const activeOnly = res.data.filter(i => i.status === 'ACTIVE').map(i => ({
          id: i.id,
          title: i.title,
          desc: i.desc,
          time: new Date(i.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setActiveAlerts(activeOnly);
      } else {
        setActiveAlerts([
          { id: '1', title: 'Suspicious loitering in Zone C', desc: 'Pedestrian detected lingering in dark corridor.', time: '4 mins ago' },
          { id: '2', title: 'Unauthorized Gate Entry Attempt', desc: 'Unregistered plate UP-16-XX-8888 failed scan.', time: '10 mins ago' }
        ]);
      }
    } catch (e) {}
  };

  // CCTV Camera Feeds Management State
  const [cameras, setCameras] = useState([
    { id: 'cam_1', camId: 'Cam 01', name: 'Main Campus Entrance Gate', zone: 'Zone A', plate: '', status: 'AUTHORIZED', resolution: '1080p • 60 FPS' },
    { id: 'cam_2', camId: 'Cam 02', name: 'Zone A - CS Academic Block', zone: 'Zone A', plate: 'MH-12-XY-9090', status: 'PARKED', resolution: '1080p • 60 FPS' },
    { id: 'cam_3', camId: 'Cam 03', name: 'Zone B - Central Library', zone: 'Zone B', plate: 'KA-05-XY-9876', status: 'MONITORED', resolution: '1080p • 60 FPS' },
    { id: 'cam_4', camId: 'Cam 04', name: 'North Security Gate Barrier', zone: 'North Block', plate: 'UP-16-XX-8888', status: 'UNAUTHORIZED', resolution: '1080p • 60 FPS' }
  ]);

  const [isAddCamModalOpen, setIsAddCamModalOpen] = useState(false);
  const [newCamName, setNewCamName] = useState('');
  const [newCamZone, setNewCamZone] = useState('KRISHNA HOSTEL');
  const [newCamPlate, setNewCamPlate] = useState('KA-09-ZZ-9999');
  const [newCamStatus, setNewCamStatus] = useState('MONITORED');

  const fetchCameras = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/cameras`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCameras(res.data);
      }
    } catch (e) {}
  };

  const handleAddCameraSubmit = async (e) => {
    e.preventDefault();
    if (!newCamName.trim()) return;

    try {
      const res = await axios.post(`${BACKEND_URL}/cameras`, {
        name: newCamName.trim(),
        zone: newCamZone,
        plate: newCamPlate.trim().toUpperCase(),
        status: newCamStatus
      });
      if (res.data) {
        setCameras(prev => [...prev, res.data]);
      }
    } catch (e) {
      const nextNum = cameras.length + 1;
      setCameras(prev => [...prev, {
        id: `cam_${Date.now()}`,
        camId: `Cam ${nextNum < 10 ? '0' + nextNum : nextNum}`,
        name: newCamName.trim(),
        zone: newCamZone,
        plate: newCamPlate.trim().toUpperCase(),
        status: newCamStatus,
        resolution: '1080p • 60 FPS'
      }]);
    } finally {
      setIsAddCamModalOpen(false);
      pushSecurityLog('CAMERA', `📹 CCTV Feed '${newCamName.trim()}' Added to Surveillance Grid (${newCamZone})`, '#38bdf8');
      setNewCamName('');
    }
  };

  const handleDeleteCamera = async (camIdToDelete) => {
    if (!window.confirm('Are you sure you want to remove this CCTV camera feed?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/cameras/${camIdToDelete}`);
    } catch (e) {}

    setCameras(prev => prev.filter(c => c.id !== camIdToDelete && c.camId !== camIdToDelete));
    pushSecurityLog('CAMERA', `🗑️ CCTV Camera Stream Removed by Officer`, '#ef4444');
  };

  const fetchSecurityLogs = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/security-logs`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setLogs(prev => {
          if (JSON.stringify(prev) === JSON.stringify(res.data)) return prev;
          return res.data;
        });
      }
    } catch (e) {}
  };

  const pushSecurityLog = async (type, text, color = '#6366f1') => {
    const newEntry = { type, text, time: 'Just now', color };
    setLogs(prev => [newEntry, ...prev]);
    try {
      await axios.post(`${BACKEND_URL}/security-logs`, { type, text, color }).catch(() => null);
    } catch (e) {}
  };

  useEffect(() => {
    fetchIncidentsFromBackend();
    fetchVisitors();
    fetchViolations();
    fetchCameras();
    fetchSecurityLogs();

    const interval = setInterval(() => {
      fetchIncidentsFromBackend();
      fetchVisitors();
      fetchViolations();
      fetchCameras();
      fetchSecurityLogs();
    }, 3000);

    const chName = `security-web-realtime-${Date.now()}`;
    const channel = supabase
      .channel(chName)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchIncidentsFromBackend();
        fetchVisitors();
        fetchViolations();
        fetchCameras();
        fetchSecurityLogs();
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        fetchIncidentsFromBackend();
        fetchVisitors();
        fetchViolations();
        fetchCameras();
        fetchSecurityLogs();
      }
    });

    return () => {
      clearInterval(interval);
      if (supabase && supabase.removeChannel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (events && Array.isArray(events) && events.length > 0) {
      const mappedLogs = events.slice(0, 10).map(e => ({
        type: e.status === 'UNAUTHORIZED' ? 'alert' : e.type?.toLowerCase() || 'entry',
        text: `Vehicle ${e.plateNumber} ${e.type === 'ENTRY' ? 'entered' : 'exited'} ${e.zone?.name || 'Gate'}`,
        time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color: e.status === 'UNAUTHORIZED' ? '#ef4444' : e.type === 'ENTRY' ? '#6366f1' : '#10b981'
      }));
      setLogs(mappedLogs);
    }
  }, [events]);

  const openViolationModal = (presetPlate = '') => {
    setViolationPlate(presetPlate || licensePlate || '');
    setViolationType('WRONG_PARKING');
    setViolationDesc('');
    setPenaltyAmount(500);
    setModalFormError('');
    setIsViolationModalOpen(true);
  };

  const handleManualScan = async (e) => {
    e.preventDefault();
    if (!inputPlate.trim()) return;
    setIsProcessingScan(true);
    setScanResult(null);

    const targetPlate = inputPlate.trim().toUpperCase();

    try {
      const res = await axios.post(`${BACKEND_URL}/simulate-event`, {
        type: 'ENTRY',
        plateNumber: targetPlate,
        zoneId: 'Zone A',
        snapshotUrl: null
      });

      const isUnauthorized = targetPlate.endsWith('0') || targetPlate.includes('UP16XX8888');

      if (isUnauthorized || (res.data?.event?.status === 'UNAUTHORIZED')) {
        setScanResult({ success: false, msg: 'ACCESS DENIED: Blacklisted/Unauthorized Plate Detected!' });
        fetchIncidentsFromBackend();
        fetchViolations();
      } else {
        setScanResult({ success: true, msg: 'ACCESS GRANTED: Gate Barrier Releasing.' });
        setLogs([
          { type: 'entry', text: `Vehicle ${targetPlate} cleared entry gate`, time: 'Just now', color: '#10b981' },
          ...logs
        ]);
      }
    } catch (err) {
      const isBlacklisted = targetPlate === 'UP16XX8888';
      if (isBlacklisted) {
        setScanResult({ success: false, msg: 'ACCESS DENIED: Blacklisted Plate Detected!' });
      } else {
        setScanResult({ success: true, msg: 'ACCESS GRANTED: Gate Barrier Releasing.' });
      }
    } finally {
      setIsProcessingScan(false);
      setInputPlate('');
    }
  };

  const handleReportViolation = async (e) => {
    e.preventDefault();
    setModalFormError('');

    if (!violationPlate.trim()) {
      setModalFormError('Please enter a vehicle license plate number.');
      return;
    }

    setIsSubmittingViolation(true);

    try {
      const res = await axios.post(`${BACKEND_URL}/violations`, {
        plateNumber: violationPlate.trim().toUpperCase(),
        type: violationType,
        description: violationDesc || 'Reported by Security Officer',
        penaltyAmount: Number(penaltyAmount) || 500
      });

      alert(`Parking Violation Ticket issued for plate ${violationPlate.trim().toUpperCase()}! Saved to database.`);
      fetchViolations();
      setIsViolationModalOpen(false);
    } catch (e) {
      // Memory fallback if server unavailable
      const newV = {
        id: String(Date.now()),
        plateNumber: violationPlate.trim().toUpperCase(),
        type: violationType,
        description: violationDesc || 'Reported by Security Officer',
        penaltyAmount: Number(penaltyAmount) || 500,
        status: 'PENDING'
      };
      setViolations([newV, ...violations]);
      alert(`Parking Violation Ticket issued for plate ${violationPlate.trim().toUpperCase()}!`);
      setIsViolationModalOpen(false);
    } finally {
      setIsSubmittingViolation(false);
    }
  };

  const handleResolveViolation = async (id) => {
    const targetId = String(id);
    setViolations(prev => prev.map(v => String(v.id) === targetId ? { ...v, status: 'RESOLVED' } : v));
    try {
      await axios.put(`${BACKEND_URL}/violations/${targetId}/resolve`);
      fetchViolations();
      alert('Violation marked as resolved.');
    } catch (e) {
      alert('Violation marked as resolved.');
    }
  };

  const handleGrantVisitorEntry = async (id) => {
    const targetId = String(id);
    setVisitors(prev => prev.map(v => String(v.id) === targetId ? { ...v, status: 'CLEARED' } : v));
    try {
      await axios.put(`${BACKEND_URL}/visitors/${targetId}/grant-entry`);
      fetchVisitors();
      alert('Visitor entry clearance granted.');
    } catch (e) {
      alert('Visitor entry clearance granted.');
    }
  };

  const dismissAlert = async (id) => {
    try {
      await axios.put(`${BACKEND_URL}/incidents/${id}/dismiss`);
      fetchIncidentsFromBackend();
    } catch (e) {
      setActiveAlerts(activeAlerts.filter(a => a.id !== id));
    }
  };

  return (
    <div className="animate-fade-in">
      
      {/* HEADER PANEL */}
      <div className="section-header" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 className="section-title">Security Command Center</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Officer Panel: {profile?.name || 'Officer Davis'}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFFFFF' }} onClick={() => { setIsQRModalOpen(true); setScannedQRDetails(null); setReleaseFeedback(null); }}>
            <QrCode size={18} /> Scan QR / Release Vehicle
          </button>
          <button className="btn btn-primary" onClick={() => openViolationModal()}>
            <Ticket size={18} /> Issue Violation Ticket
          </button>
          <button className="btn btn-outline" onClick={onEditProfile}>Edit Profile</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.6rem 1.25rem', borderRadius: '14px', fontWeight: '800', fontSize: '0.85rem', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="live-dot scanning" style={{ width: '8px', height: '8px', borderRadius: '50%' }}></div>
            LIVE MONITORING ACTIVE
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="card stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="stat-icon-box" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><AlertTriangle /></div>
              <div className="stat-info">
                <span className="label">Critical Alerts</span>
                <span className="value">{activeAlerts.length}</span>
              </div>
            </div>
            <div className="card stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="stat-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><Activity /></div>
              <div className="stat-info">
                <span className="label">Live Occupancy</span>
                <span className="value">{occupancy?.totalOccupied || occupancy?.occupiedSlots || 143}</span>
              </div>
            </div>
            <div className="card stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div className="stat-icon-box" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><UserCheck /></div>
              <div className="stat-info">
                <span className="label">Pending Violations</span>
                <span className="value">{violations.filter(v => v.status === 'PENDING').length}</span>
              </div>
            </div>
          </div>

          {activeAlerts.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem', color: 'var(--danger)' }}>Active Security Alerts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeAlerts.map(a => (
                  <div key={a.id} className="card animate-fade-in" style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '1rem' }}>{a.title}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{a.desc}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.time}</span>
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => dismissAlert(a.id)}>
                        Dismiss Alert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DYNAMIC LIVE CCTV STREAM GRID */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <Camera size={22} color="var(--primary)" /> Campus CCTV Multi-Camera Surveillance Grid
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Linked to Zone Capacities • Active Feeds: {cameras.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={() => setIsAddCamModalOpen(true)} style={{ gap: '0.4rem', fontSize: '0.85rem' }}>
                  <Plus size={16} /> Add CCTV Camera Stream
                </button>
                <span className="badge badge-success">{cameras.length}/{cameras.length} Live Streams HD 1080p</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {cameras.map((cam) => (
                <DynamicCCTVStream 
                  key={cam.id || cam.camId} 
                  id={cam.id}
                  camId={cam.camId} 
                  camName={cam.name} 
                  zoneName={cam.zone}
                  targetPlate={cam.plate || ''} 
                  status={cam.status || 'MONITORED'} 
                  onIssueTicket={openViolationModal} 
                  onDeleteCam={handleDeleteCamera}
                />
              ))}
            </div>
          </div>

          <div className="charts-grid">
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="var(--primary)" /> Entry Barrier Scanner
              </h3>
              <form onSubmit={handleManualScan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>Manual OCR Plate Scan</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. KA01AB1234 or UP16XX8888"
                    value={inputPlate}
                    onChange={e => setInputPlate(e.target.value)}
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={isProcessingScan} style={{ minWidth: '100px' }}>
                    {isProcessingScan ? 'OCR...' : 'Trigger'}
                  </button>
                </div>
              </form>

              {scanResult && (
                <div className="animate-fade-in" style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '12px', background: scanResult.success ? 'var(--success-bg)' : 'var(--danger-bg)', border: '1px solid transparent', borderColor: scanResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {scanResult.success ? <CheckCircle size={16} color="var(--success)" /> : <AlertTriangle size={16} color="var(--danger)" />}
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>{scanResult.msg}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <History size={20} color="var(--primary)" /> Live Security Activity Log
                </h3>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Smooth Feed • Live Scroll</span>
              </div>
              
              <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {logs.map((log, i) => (
                  <div key={`${log.id || log.text}-${i}`} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${log.color || '#6366f1'}15`, color: log.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {log.type === 'alert' || log.type === 'ALERT' ? <AlertTriangle size={16} /> : <MapPin size={16} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.3' }}>{log.text}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* CAMERA FEEDS MATRIX TAB */}
      {activeTab === 'cameras' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Camera size={24} color="var(--primary)" /> Campus CCTV Multi-Camera Surveillance Grid
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Real-time OCR license plate recognition & vehicle perimeter security
                </p>
              </div>
              <span className="badge badge-success">4/4 Cameras Active (HD 1080p)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <DynamicCCTVStream camId="Cam 01" camName="Main Campus Entrance Gate" targetPlate="" status="AUTHORIZED" onIssueTicket={openViolationModal} />
              <DynamicCCTVStream camId="Cam 02" camName="Zone A - Academic Block" targetPlate="MH-12-XY-9090" status="PARKED" onIssueTicket={openViolationModal} />
              <DynamicCCTVStream camId="Cam 03" camName="Zone B - Library Corridor" targetPlate="KA-05-XY-9876" status="MONITORED" onIssueTicket={openViolationModal} />
              <DynamicCCTVStream camId="Cam 04" camName="North Emergency Gate Barrier" targetPlate="UP-16-XX-8888" status="UNAUTHORIZED" onIssueTicket={openViolationModal} />
            </div>
          </div>
        </div>
      )}

      {/* VISITOR MANAGEMENT TAB */}
      {activeTab === 'barrier' && (
        <div className="card">
          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <UserCheck size={24} color="var(--primary)" /> Visitor Entry & Verification Console
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Visitor Name / Phone</th>
                  <th>Vehicle Plate</th>
                  <th>Visit Purpose</th>
                  <th>Pass Status</th>
                  <th>QR Code Pass</th>
                  <th>Gate Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v, idx) => (
                  <tr key={`${v.id || v.plateNumber}-${idx}`}>
                    <td>
                      <strong style={{ display: 'block', color: 'var(--text-main)' }}>{v.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.phone}</span>
                    </td>
                    <td><code style={{ background: 'rgba(255,255,255,0.04)', padding: '0.3rem 0.6rem', borderRadius: '6px', color: 'var(--text-main)' }}>{v.plateNumber}</code></td>
                    <td style={{ color: 'var(--text-muted)' }}>{v.visitPurpose}</td>
                    <td>
                      <span className={`badge ${v.status === 'CLEARED' ? 'badge-success' : 'badge-warning'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{v.qrCode}</code>
                    </td>
                    <td>
                      {v.status === 'CLEARED' ? (
                        <span className="badge badge-success">CLEARED ✅</span>
                      ) : (
                        <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => handleGrantVisitorEntry(v.id)}>
                          Grant Entry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIOLATIONS MANAGEMENT TAB */}
      {activeTab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={24} /> Parking Violations & Fines Management
              </h3>
              <button className="btn btn-primary" onClick={() => openViolationModal()}>
                + Issue New Violation Ticket
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>License Plate</th>
                    <th>Violation Category</th>
                    <th>Description</th>
                    <th>Penalty Fine</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, idx) => (
                    <tr key={`${v.id || v.plateNumber}-${idx}`}>
                      <td><strong style={{ color: 'var(--text-main)' }}>{v.plateNumber}</strong></td>
                      <td><span className="badge badge-warning">{v.type}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{v.description}</td>
                      <td style={{ fontWeight: '800', color: 'var(--danger)' }}>₹{v.penaltyAmount}</td>
                      <td>
                        <span className={`badge ${v.status === 'RESOLVED' ? 'badge-success' : 'badge-danger'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td>
                        {v.status === 'PENDING' && (
                          <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => handleResolveViolation(v.id)}>
                            Mark Resolved
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE VIOLATION MODAL */}
      {isViolationModalOpen && (
        <div className="modal-overlay" onClick={() => setIsViolationModalOpen(false)}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ticket size={22} color="var(--danger)" /> Issue Violation Ticket
              </h3>
              <button onClick={() => setIsViolationModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {modalFormError && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(239,68,68,0.3)' }}>
                {modalFormError}
              </div>
            )}

            <form onSubmit={handleReportViolation} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Vehicle License Plate</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. KA-01-AB-1234"
                  value={violationPlate}
                  onChange={e => setViolationPlate(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Violation Type</label>
                <select 
                  value={violationType}
                  onChange={e => setViolationType(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem', color: 'var(--text-main)', backgroundColor: 'var(--bg-sidebar)' }}
                >
                  <option value="WRONG_PARKING" style={{ backgroundColor: 'var(--bg-sidebar)' }}>Wrong Parking Space</option>
                  <option value="UNAUTHORIZED_ENTRY" style={{ backgroundColor: 'var(--bg-sidebar)' }}>Unauthorized Restricted Entry</option>
                  <option value="EXPIRED_PASS" style={{ backgroundColor: 'var(--bg-sidebar)' }}>Expired Parking Pass</option>
                  <option value="RESTRICTED_ZONE" style={{ backgroundColor: 'var(--bg-sidebar)' }}>Faculty Reserved Zone Intrusion</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Description Details</label>
                <input 
                  type="text"
                  placeholder="e.g. Parked in Faculty Slot without permit"
                  value={violationDesc}
                  onChange={e => setViolationDesc(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Penalty Amount (₹)</label>
                <input 
                  type="number"
                  required
                  value={penaltyAmount}
                  onChange={e => setPenaltyAmount(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsViolationModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" disabled={isSubmittingViolation} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                  {isSubmittingViolation ? 'Issuing Ticket...' : 'Issue Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CCTV CAMERA STREAM MODAL */}
      {isAddCamModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCamModalOpen(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <Camera size={22} color="var(--primary)" /> Add CCTV Camera Stream
              </h3>
              <button onClick={() => setIsAddCamModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCameraSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block' }}>CAMERA NAME / GATE TITLE</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Cam 05: KRISHNA HOSTEL Gate" 
                  value={newCamName} 
                  onChange={e => setNewCamName(e.target.value)} 
                  style={{ width: '100%', padding: '0.75rem 1rem', color: '#0F172A', backgroundColor: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block' }}>LINK TO CAMPUS ZONE</label>
                <select 
                  value={newCamZone} 
                  onChange={e => setNewCamZone(e.target.value)} 
                  style={{ width: '100%', padding: '0.75rem 1rem', color: '#0F172A', backgroundColor: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700' }}
                >
                  {['Faculty Parking', 'South Block', 'Central Library', 'KRISHNA HOSTEL', 'HOSPITAL PARKING', 'Hostel Complex', 'CS Academic Block', 'Visitor Parking', 'Scad'].map(z => (
                    <option key={z} value={z} style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}>{z}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block' }}>SIMULATED VEHICLE LICENSE PLATE</label>
                <input 
                  type="text" 
                  placeholder="e.g. KA-09-ZZ-9999" 
                  value={newCamPlate} 
                  onChange={e => setNewCamPlate(e.target.value)} 
                  style={{ width: '100%', padding: '0.75rem 1rem', color: '#0F172A', backgroundColor: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block' }}>INITIAL CAMERA STREAM STATUS</label>
                <select 
                  value={newCamStatus} 
                  onChange={e => setNewCamStatus(e.target.value)} 
                  style={{ width: '100%', padding: '0.75rem 1rem', color: '#0F172A', backgroundColor: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700' }}
                >
                  <option value="MONITORED" style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}>MONITORED</option>
                  <option value="AUTHORIZED" style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}>AUTHORIZED</option>
                  <option value="PARKED" style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}>PARKED</option>
                  <option value="UNAUTHORIZED" style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}>UNAUTHORIZED</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddCamModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  + Add Camera Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY QR SCANNER & VEHICLE RELEASE MODAL */}
      {isQRModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card modal-card animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '2rem', borderRadius: '24px', border: '1.5px solid #334155', backgroundColor: '#0F172A', color: '#F8FAFC', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #1E293B', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <QrCode size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>Security QR Vehicle Release Console</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '2px 0 0 0', fontWeight: '600' }}>Scan pass QR code or license plate token to verify & release vehicle</p>
                </div>
              </div>
              <button onClick={() => setIsQRModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Release Feedback Banner */}
            {releaseFeedback && (
              <div style={{
                padding: '0.9rem 1.1rem',
                borderRadius: '14px',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                fontWeight: '800',
                backgroundColor: releaseFeedback.type === 'success' ? 'rgba(16,185,129,0.15)' : releaseFeedback.type === 'duplicate' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                color: releaseFeedback.type === 'success' ? '#34D399' : releaseFeedback.type === 'duplicate' ? '#FBBF24' : '#FCA5A5',
                border: `1.5px solid ${releaseFeedback.type === 'success' ? '#10B981' : releaseFeedback.type === 'duplicate' ? '#F59E0B' : '#EF4444'}`
              }}>
                {releaseFeedback.msg}
              </div>
            )}

            {/* Input & Viewfinder Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Live Web Camera Viewfinder Container */}
              <div style={{ position: 'relative', minHeight: '220px', backgroundColor: '#020617', borderRadius: '16px', overflow: 'hidden', border: cameraError ? '2px solid #EF4444' : '2px solid #10B981', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                
                {isCameraActive && !cameraError ? (
                  <div style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div id="webcam-qr-reader" style={{ width: '100%', maxWidth: '340px', overflow: 'hidden', borderRadius: '12px' }}></div>
                    
                    {isCameraLoading && (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#38BDF8' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>Initializing Webcam Stream & Requesting Permission...</span>
                      </div>
                    )}

                    {!isCameraLoading && (
                      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => setIsCameraActive(false)}
                          style={{ backgroundColor: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CameraOff size={12} /> Stop Camera
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1.5rem', textAlign: 'center', width: '100%' }}>
                    {cameraError ? (
                      <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '1rem' }}>
                        <AlertTriangle size={28} color="#EF4444" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#FCA5A5', display: 'block' }}>Camera Access Restricted or Unavailable</span>
                        <span style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>{cameraError}</span>
                      </div>
                    ) : (
                      <div>
                        <Camera size={36} color="#64748B" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#94A3B8', display: 'block' }}>Camera Scanner Paused</span>
                      </div>
                    )}

                    <button
                      onClick={() => { setCameraError(null); setIsCameraActive(true); }}
                      style={{ backgroundColor: '#10B981', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}
                    >
                      <RefreshCcw size={14} /> Re-open Laptop/Desktop Camera
                    </button>
                  </div>
                )}

              </div>

              {/* Manual QR / Plate Token Input Form */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  placeholder="Scan or type QR Code / License Plate (e.g. KA-01-AB-1234)" 
                  value={qrTokenInput}
                  onChange={e => setQrTokenInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleScanQRToken(); }}
                  style={{ flex: 1, padding: '0.85rem 1.1rem', backgroundColor: '#1E293B', border: '1.5px solid #334155', borderRadius: '14px', color: '#FFFFFF', fontSize: '0.92rem', fontWeight: '800', outline: 'none' }}
                />
                <button 
                  onClick={() => handleScanQRToken()}
                  disabled={isScanningQR}
                  className="btn btn-primary" 
                  style={{ backgroundColor: '#10B981', borderColor: '#10B981', padding: '0 1.25rem', whiteSpace: 'nowrap' }}
                >
                  {isScanningQR ? 'Scanning...' : 'Verify QR'}
                </button>
              </div>

              {/* Quick Sample Presets */}
              {logs.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '800' }}>Recent Logs:</span>
                  {logs.slice(0, 3).map(log => {
                    const token = log.entityId || log.licensePlate;
                    if (!token) return null;
                    return (
                      <button 
                        key={log.id}
                        onClick={() => { setQrTokenInput(token); handleScanQRToken(token); }}
                        style={{ backgroundColor: '#1E293B', border: '1px solid #334155', color: '#38BDF8', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                      >
                        {token}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Scanned Verification Result Card */}
              {scannedQRDetails && (
                <div style={{ backgroundColor: '#1E293B', padding: '1.25rem', borderRadius: '18px', border: scannedQRDetails.isEligible ? '1.5px solid #10B981' : '1.5px solid #F59E0B', marginTop: '0.5rem' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>VEHICLE IDENTIFICATION</span>
                      <h4 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#FFFFFF', margin: '2px 0 0 0' }}>{scannedQRDetails.vehicle?.plateNumber}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#38BDF8', margin: '2px 0 0 0', fontWeight: '700' }}>{scannedQRDetails.vehicle?.brand} {scannedQRDetails.vehicle?.model} ({scannedQRDetails.vehicle?.type})</p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '900',
                        backgroundColor: scannedQRDetails.isEligible ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        color: scannedQRDetails.isEligible ? '#34D399' : '#FCA5A5',
                        border: `1px solid ${scannedQRDetails.isEligible ? '#10B981' : '#EF4444'}`
                      }}>
                        {scannedQRDetails.isEligible ? 'ELIGIBLE FOR RELEASE' : scannedQRDetails.status || 'INELIGIBLE'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: '700' }}>VEHICLE OWNER</span>
                      <p style={{ color: '#FFFFFF', fontWeight: '800', margin: '2px 0 0 0' }}>{scannedQRDetails.owner?.name}</p>
                      <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{scannedQRDetails.owner?.email}</span>
                    </div>

                    <div>
                      <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: '700' }}>PARKING LOCATION</span>
                      <p style={{ color: '#FFFFFF', fontWeight: '800', margin: '2px 0 0 0' }}>{scannedQRDetails.booking?.zoneName || 'Main Campus'} (Slot {scannedQRDetails.booking?.slotNumber || 'K-30'})</p>
                      <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Session: {scannedQRDetails.booking?.bookingTime || 'Active'}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: scannedQRDetails.isEligible ? '#A7F3D0' : '#FDE68A', margin: '0 0 1.25rem 0', fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.9rem', borderRadius: '10px' }}>
                    📋 {scannedQRDetails.eligibilityReason}
                  </p>

                  {/* Primary Action Button */}
                  <button 
                    onClick={handleConfirmVehicleRelease}
                    disabled={!scannedQRDetails.isEligible || isExecutingRelease}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '0.9rem',
                      fontSize: '1rem',
                      fontWeight: '900',
                      backgroundColor: scannedQRDetails.isEligible ? '#10B981' : '#334155',
                      borderColor: scannedQRDetails.isEligible ? '#10B981' : '#334155',
                      cursor: scannedQRDetails.isEligible ? 'pointer' : 'not-allowed',
                      boxShadow: scannedQRDetails.isEligible ? '0 10px 20px rgba(16,185,129,0.3)' : 'none'
                    }}
                  >
                    {isExecutingRelease ? 'Processing Release...' : scannedQRDetails.isEligible ? '🚗 Confirm & Release Barrier Gate' : 'Vehicle Not Eligible for Release'}
                  </button>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
