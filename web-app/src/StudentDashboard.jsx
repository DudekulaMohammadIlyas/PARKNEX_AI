import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  CarFront, 
  ChevronRight,
  QrCode as QrIcon,
  Bell,
  Calendar,
  Zap,
  Plus,
  Trash2,
  ListFilter,
  History,
  Map as MapIcon,
  Sparkles,
  ShieldCheck,
  X,
  UserCheck,
  Building,
  Award,
  AlertTriangle,
  Bot,
  Search,
  Compass,
  TrendingUp,
  MessageSquare,
  Navigation,
  FileText,
  Check,
  Download,
  LogOut as ExitIcon,
  RefreshCw,
  ShieldAlert,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { supabase } from './supabaseClient';

// Helper functions for real-time calendar and clock matching
const getTodayDateStr = () => new Date().toISOString().split('T')[0];
const getCurrentTimeStr = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// Real Scannable QR Code Renderer using qrcode DataURL generator
function RealScannableQRCode({ value = 'PASS-STU-2026-8812', size = 160 }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    const dataStr = typeof value === 'string' ? value : JSON.stringify(value);
    QRCode.toDataURL(dataStr, {
      margin: 1,
      width: size,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => { if (isMounted) setQrDataUrl(url); })
      .catch(err => console.error("QR Code Error:", err));

    return () => { isMounted = false; };
  }, [value, size]);

  if (!qrDataUrl) {
    return (
      <div style={{ width: size, height: size, background: '#ffffff', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', textAlign: 'center' }}>
        <QrIcon size={36} color="var(--primary)" />
        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', marginTop: '0.4rem' }}>Generating QR...</span>
      </div>
    );
  }

  return (
    <img 
      src={qrDataUrl} 
      alt={`Scannable QR Code ${value}`} 
      style={{ width: size, height: size, borderRadius: '14px', display: 'block', boxShadow: '0 0 20px rgba(0,0,0,0.15)', border: '2px solid #ffffff' }} 
    />
  );
}

export default function StudentDashboard({ 
  occupancy, 
  BACKEND_URL = 'http://localhost:5000/api', 
  profile, 
  userRole,
  onEditProfile, 
  activeTab: propActiveTab, 
  setActiveTab: propSetActiveTab 
}) {
  const effectiveRole = (userRole || profile?.role || 'STUDENT').toUpperCase();
  const isStaffMember = effectiveRole === 'STAFF' || effectiveRole === 'FACULTY';
  const isStaffOrFaculty = isStaffMember;

  const [localActiveTab, setLocalActiveTab] = useState('overview');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;

  // Real-time Clock State Ticker
  const [liveClockTime, setLiveClockTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClockTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Digital Parking Pass State
  const [digitalPass, setDigitalPass] = useState(null);
  
  // Subscription & Expiration Countdown State (PERSISTED IN LOCALSTORAGE)
  const [passStartDate, setPassStartDate] = useState(() => {
    return localStorage.getItem('parknex_passStartDate') || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  });
  const [passValidityDate, setPassValidityDate] = useState(() => {
    const defaultExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return localStorage.getItem('parknex_passValidity') || defaultExp.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  });
  const [passPlanDays, setPassPlanDays] = useState(() => {
    return localStorage.getItem('parknex_passPlanDays') || '30';
  });
  const [daysRemaining, setDaysRemaining] = useState(() => {
    const saved = localStorage.getItem('parknex_daysRemaining');
    return saved ? Number(saved) : 30;
  });
  const [isAdvancePayModalOpen, setIsAdvancePayModalOpen] = useState(false);
  const [selectedPayTier, setSelectedPayTier] = useState('GRANT');

  // Campus Gate Exit Feature State (Security Only Clearance)
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitSessionDetails, setExitSessionDetails] = useState(null);
  const [exitConfirmedModal, setExitConfirmedModal] = useState(null);
  const activeBookingRef = useRef(null);
  const handledExitBookingIds = useRef(new Set());

  // Parking Violations & Fines State
  const [myViolations, setMyViolations] = useState([]);

  // Admin-Created Campus Zones Registry State (Role-scoped initial state)
  const [adminZones, setAdminZones] = useState(() => {
    const studentDefaultZones = [
      { id: 'z4', name: 'KRISHNA HOSTEL', total: 150, occupied: 0, free: 150, isStaffOnly: false, isFacultyOnly: false },
      { id: 'z2', name: 'South Block', total: 150, occupied: 0, free: 150, isStaffOnly: false, isFacultyOnly: false },
      { id: 'z3', name: 'Central Library', total: 80, occupied: 0, free: 80, isStaffOnly: false, isFacultyOnly: false },
      { id: 'z5', name: 'HOSPITAL PARKING', total: 200, occupied: 0, free: 200, isStaffOnly: false, isFacultyOnly: false },
      { id: 'z6', name: 'Hostel Complex', total: 200, occupied: 0, free: 200, isStaffOnly: false, isFacultyOnly: false },
      { id: 'z7', name: 'CS Academic Block', total: 120, occupied: 0, free: 120, isStaffOnly: false, isFacultyOnly: false },
      { id: 'z8', name: 'Visitor Parking', total: 50, occupied: 0, free: 50, isStaffOnly: false, isFacultyOnly: false },
      { id: 'z9', name: 'Scad', total: 75, occupied: 0, free: 75, isStaffOnly: false, isFacultyOnly: false }
    ];

    const staffExclusiveZones = [
      { id: 'z1', name: 'Staff Parking', total: 100, occupied: 0, free: 100, isStaffOnly: true, isFacultyOnly: true }
    ];

    // Staff ONLY see their designated staff zone; Students ONLY see student zones
    return isStaffMember ? staffExclusiveZones : studentDefaultZones;
  });

  // Distinct & Dynamic AI Recommendations State (Role-scoped initial state with live sync)
  const [aiRecommendations, setAiRecommendations] = useState(() => {
    if (isStaffMember) {
      return [
        { zoneId: 'z1', zoneName: 'Staff Parking', slotNumber: 'SP-01', distanceMeters: 45, availableSlots: 97, totalSlots: 100, score: 98, hasEvCharger: true, reason: '45m from Admin & Faculty Offices • 97% vacant • Staff Priority Bay • EV Fast Charger equipped' },
        { zoneId: 'z1', zoneName: 'Staff Parking', slotNumber: 'SP-02', distanceMeters: 48, availableSlots: 97, totalSlots: 100, score: 96, hasEvCharger: true, reason: '48m from Central Admin walkway • 97% vacant • Executive Shaded Bay' },
        { zoneId: 'z1', zoneName: 'Staff Parking', slotNumber: 'SP-03', distanceMeters: 50, availableSlots: 97, totalSlots: 100, score: 95, hasEvCharger: true, reason: '50m from Central Quad • 97% vacant • Reserved Executive Shade • FastPass barrier access' }
      ];
    }
    return [
      { zoneId: 'z4', zoneName: 'KRISHNA HOSTEL', slotNumber: 'K-04', distanceMeters: 80, availableSlots: 149, totalSlots: 150, score: 96, hasEvCharger: true, reason: '80m from Academic Block • Low congestion • EV Charger available' },
      { zoneId: 'z2', zoneName: 'South Block', slotNumber: 'S-04', distanceMeters: 120, availableSlots: 150, totalSlots: 150, score: 91, hasEvCharger: false, reason: '120m from Student Center • Shaded bays' },
      { zoneId: 'z3', zoneName: 'Central Library', slotNumber: 'C-04', distanceMeters: 100, availableSlots: 80, totalSlots: 80, score: 89, hasEvCharger: false, reason: '100m from CS Block • High vacancy' }
    ];
  });

  // AI Find My Vehicle State
  const [vehicleLocation, setVehicleLocation] = useState({
    slotNumber: 'K-30',
    currentZone: 'KRISHNA HOSTEL',
    entryTime: '09:00 AM',
    walkingDirections: [
      'Exit Computer Science Academic Block Gate 1',
      'Turn left towards Krishna Hostel Parking Courtyard',
      'Walk 150 meters to Row K',
      'Your vehicle is parked in Slot K-30'
    ]
  });
  const [isFindVehicleModalOpen, setIsFindVehicleModalOpen] = useState(false);

  // AI Student Chatbot States & Intelligence
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { 
      id: 'init-msg',
      sender: 'ai', 
      text: `👋 Hi ${profile?.name || 'there'}! I am your **ParkNex AI Assistant** (Campus Intelligent Assistant).\n\nI am connected to live campus telemetry. I can help you with real-time parking recommendations, finding your vehicle, checking digital passes, tariffs, or explaining slot booking.\n\nWhat can I help you with today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatConversationId, setChatConversationId] = useState(null);
  const [chatSuggestions, setChatSuggestions] = useState([
    'Where should I park right now?',
    'Why that slot?',
    'Book it for me',
    'How do I get there?',
    'Can I park my bike there?',
    'How much is it?',
    'Predict peak hours',
    'EV Charging',
    'Is it shaded?',
    'Find my car'
  ]);
  const chatMessagesEndRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isChatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setSpeakingMsgId(null);
    }
  }, [chatMessages, isChatLoading, isChatOpen]);

  // Voice Speech-to-Text Input (STT)
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      try { recognitionRef.current?.stop(); } catch (e) {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setChatInput(transcript);
          handleSendMessage(null, transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition failed to start:', err);
      setIsListening(false);
    }
  };

  // Voice Text-to-Speech Output (TTS)
  const handleSpeakText = (msgId, rawText) => {
    if (!window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanSpeech = (rawText || '')
      .replace(/[*#`_~]/g, '')
      .replace(/[•\-]/g, ', ')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Formatter for rich markdown-like chat bubble text
  const renderFormattedChatMessage = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
        {lines.map((line, lineIdx) => {
          if (!line.trim()) {
            return <div key={lineIdx} style={{ height: '0.35rem' }} />;
          }

          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
          const cleanLine = isBullet ? line.trim().replace(/^[•\-]\s*/, '') : line;

          const parts = [];
          const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
          let lastIndex = 0;
          let match;

          while ((match = regex.exec(cleanLine)) !== null) {
            if (match.index > lastIndex) {
              parts.push(cleanLine.substring(lastIndex, match.index));
            }
            const token = match[0];
            if (token.startsWith('**') && token.endsWith('**')) {
              parts.push(<strong key={match.index} style={{ color: '#FFFFFF', fontWeight: '800' }}>{token.slice(2, -2)}</strong>);
            } else if (token.startsWith('*') && token.endsWith('*')) {
              parts.push(<em key={match.index} style={{ color: '#E2E8F0', fontStyle: 'italic' }}>{token.slice(1, -1)}</em>);
            } else if (token.startsWith('`') && token.endsWith('`')) {
              parts.push(
                <code key={match.index} style={{ background: 'rgba(255,255,255,0.15)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.8rem', color: '#93C5FD' }}>
                  {token.slice(1, -1)}
                </code>
              );
            }
            lastIndex = regex.lastIndex;
          }
          if (lastIndex < cleanLine.length) {
            parts.push(cleanLine.substring(lastIndex));
          }

          if (isBullet) {
            return (
              <div key={lineIdx} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start', paddingLeft: '0.2rem' }}>
                <span style={{ color: '#818CF8', fontSize: '0.9rem', lineHeight: '1.4' }}>•</span>
                <span style={{ flex: 1 }}>{parts}</span>
              </div>
            );
          }

          return <div key={lineIdx}>{parts}</div>;
        })}
      </div>
    );
  };

  // User Email Scoping for New User Isolation
  const userEmail = profile?.email || '';

  // Vehicles registry state (SCOPED TO LOGGED-IN USER EMAIL)
  const [vehicles, setVehicles] = useState(() => {
    if (!userEmail) return [];
    const userVehiclesKey = `parknex_vehicles_${userEmail}`;
    const saved = localStorage.getItem(userVehiclesKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return []; // Clean state until API or user adds vehicle
  });

  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [newVehicleForm, setNewVehicleForm] = useState({
    brand: '',
    model: '',
    color: '',
    plateNumber: '',
    type: '4-Wheeler'
  });

  // Dynamic booking selection states
  const [selectedVehicle, setSelectedVehicle] = useState(() => vehicles[0]?.plate || '');
  const [passSelectedVehicle, setPassSelectedVehicle] = useState(() => vehicles[0]?.plate || '');

  // Keep selectedVehicle in sync if vehicles change
  useEffect(() => {
    if (vehicles.length > 0) {
      if (!vehicles.some(v => v.plate === selectedVehicle)) {
        setSelectedVehicle(vehicles[0].plate);
      }
      if (!vehicles.some(v => v.plate === passSelectedVehicle)) {
        setPassSelectedVehicle(vehicles[0].plate);
      }
    } else {
      setSelectedVehicle('');
      setPassSelectedVehicle('');
    }
  }, [vehicles]);

  // Helper to generate UNIQUE, RICH CAMERA-SCANNABLE QR Code payload per vehicle
  const getVehicleQRPayload = (targetPlate) => {
    const vObj = vehicles.find(v => v.plate === targetPlate) || vehicles[0];
    if (!vObj) return '';
    return JSON.stringify({
      system: "PARKNEX_AI_GATE_PASS",
      studentName: profile?.name || userEmail || 'Student',
      studentId: profile?.studentId || 'STU-2026-USER',
      passSerial: digitalPass?.passNumber || (userEmail ? `PASS-STU-${userEmail.split('@')[0].toUpperCase()}` : 'PASS-PENDING'),
      vehiclePlate: vObj.plate,
      vehicleBrand: vObj.brand,
      vehicleModel: vObj.model || 'Standard',
      vehicleType: vObj.type,
      color: vObj.color || 'Silver',
      validUntil: passValidityDate
    });
  };

  const [bookingDate, setBookingDate] = useState(() => getTodayDateStr());
  const [bookingTime, setBookingTime] = useState(() => getCurrentTimeStr());
  const [durationHours, setDurationHours] = useState(4);
  const [selectedZone, setSelectedZone] = useState(() => isStaffMember ? 'Staff Parking' : 'KRISHNA HOSTEL');
  const [selectedSlot, setSelectedSlot] = useState(() => isStaffMember ? 'SP-01' : 'K-04');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  // PERSISTED History list state (SCOPED TO LOGGED-IN USER EMAIL)
  const [historyList, setHistoryList] = useState(() => {
    if (!userEmail) return [];
    const userHistoryKey = `parknex_historyList_${userEmail}`;
    const saved = localStorage.getItem(userHistoryKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return []; // Clean initial state
  });

  // REAL-TIME ALL CAMPUS BOOKINGS (Synchronized across all users for live slot occupancy)
  const [allCampusBookings, setAllCampusBookings] = useState([]);

  // PERSISTED Statement Receipts State (SCOPED TO LOGGED-IN USER EMAIL)
  const [receiptsList, setReceiptsList] = useState(() => {
    if (!userEmail) return [];
    const userReceiptsKey = `parknex_receiptsList_${userEmail}`;
    const saved = localStorage.getItem(userReceiptsKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return []; // Clean initial state
  });

  // Save vehicles to localStorage on change (Scoped by user email)
  useEffect(() => {
    const userVehiclesKey = `parknex_vehicles_${userEmail}`;
    localStorage.setItem(userVehiclesKey, JSON.stringify(vehicles));
  }, [vehicles, userEmail]);

  // Save historyList to localStorage on change (Scoped by user email)
  useEffect(() => {
    const userHistoryKey = `parknex_historyList_${userEmail}`;
    localStorage.setItem(userHistoryKey, JSON.stringify(historyList));
  }, [historyList, userEmail]);

  // Save receiptsList to localStorage on change (Scoped by user email)
  useEffect(() => {
    const userReceiptsKey = `parknex_receiptsList_${userEmail}`;
    localStorage.setItem(userReceiptsKey, JSON.stringify(receiptsList));
  }, [receiptsList, userEmail]);

  // Selected map zone state
  const [activeMapZone, setActiveMapZone] = useState(() => isStaffMember ? 'Staff Parking' : 'KRISHNA HOSTEL');

  // Strict mutual exclusivity:
  // - Staff members ONLY see their allocated Staff zones ("staff only should park only in their respected allocated zones, they should not and unable to park in normal zones")
  // - Students ONLY see normal student campus zones (staff zones hidden)
  const displayedZones = (adminZones || []).filter(z => {
    const isStaffZone = z.isStaffOnly || z.isFacultyOnly || (z.name || '').toLowerCase().includes('staff') || (z.name || '').toLowerCase().includes('faculty') || z.type === 'Staff Only' || z.type === 'Faculty Only' || z.type === 'STAFF_ONLY';
    if (isStaffMember) {
      return isStaffZone;
    } else {
      return !isStaffZone;
    }
  });

  const selectableZones = displayedZones;

  // Keep selection strictly constrained to role-permitted zones
  useEffect(() => {
    if (isStaffMember) {
      if (!selectedZone.toLowerCase().includes('staff') && !selectedZone.toLowerCase().includes('faculty')) {
        setSelectedZone('Staff Parking');
        setSelectedSlot('SP-01');
      }
      if (!activeMapZone.toLowerCase().includes('staff') && !activeMapZone.toLowerCase().includes('faculty')) {
        setActiveMapZone('Staff Parking');
      }
    } else {
      if (selectedZone.toLowerCase().includes('staff') || selectedZone.toLowerCase().includes('faculty')) {
        setSelectedZone('KRISHNA HOSTEL');
        setSelectedSlot('K-04');
      }
      if (activeMapZone.toLowerCase().includes('staff') || activeMapZone.toLowerCase().includes('faculty')) {
        setActiveMapZone('KRISHNA HOSTEL');
      }
    }
  }, [isStaffMember, selectedZone, activeMapZone]);

  // Fetch admin-created zones dynamically from PostgreSQL backend with role scoping
  const fetchAdminZonesAndSlots = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/zones?role=${effectiveRole}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const fetchedZones = res.data.map(z => ({
          id: z.id,
          name: z.name,
          total: Number(z.total || z.capacity || 100),
          occupied: Number(z.occupied || 0),
          free: z.free !== undefined ? Number(z.free) : Math.max(0, Number(z.total || 100) - Number(z.occupied || 0)),
          isStaffOnly: Boolean(z.isStaffOnly || z.isFacultyOnly || (z.name || '').toLowerCase().includes('staff') || (z.name || '').toLowerCase().includes('faculty') || z.type === 'Staff Only' || z.type === 'Faculty Only' || z.type === 'STAFF_ONLY'),
          isFacultyOnly: Boolean(z.isStaffOnly || z.isFacultyOnly || (z.name || '').toLowerCase().includes('staff') || (z.name || '').toLowerCase().includes('faculty')),
          slots: z.slots || []
        }));
        setAdminZones(fetchedZones);
      }
    } catch (e) {}
  };

  const fetchAIRecommendations = async () => {
    try {
      const dept = encodeURIComponent(profile?.department || 'General');
      const res = await axios.get(`${BACKEND_URL}/ai/recommendations?department=${dept}&role=${encodeURIComponent(effectiveRole)}&email=${encodeURIComponent(userEmail)}`);
      if (Array.isArray(res.data?.recommendations) && res.data.recommendations.length > 0) {
        const rawRecs = res.data.recommendations;
        const roleFiltered = isStaffMember
          ? rawRecs.filter(r => (r.zoneName || '').toLowerCase().includes('staff') || (r.zoneName || '').toLowerCase().includes('faculty'))
          : rawRecs.filter(r => !(r.zoneName || '').toLowerCase().includes('staff') && !(r.zoneName || '').toLowerCase().includes('faculty'));
        if (roleFiltered.length > 0) {
          setAiRecommendations(roleFiltered);
        } else if (!isStaffMember && rawRecs.length > 0) {
          setAiRecommendations(rawRecs);
        }
      }
    } catch (e) {}
  };

  const fetchFindVehicle = async () => {
    try {
      if (!vehicles || vehicles.length === 0) return;
      const targetPlate = vehicles[0]?.plate;
      if (!targetPlate) return;
      const res = await axios.get(`${BACKEND_URL}/ai/find-vehicle?plateNumber=${targetPlate}`);
      if (res.data && res.data.slotNumber) {
        setVehicleLocation(res.data);
      }
    } catch (e) {}
  };

  const fetchVehicles = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/vehicles`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setVehicles(res.data.map(v => ({
          id: v.id,
          brand: v.brand || 'Vehicle',
          model: v.model || 'Standard',
          color: v.color || 'Silver',
          type: v.type === 'TWO_WHEELER' ? '2-Wheeler' : v.type === 'ELECTRIC_VEHICLE' ? 'EV' : '4-Wheeler',
          plate: v.plateNumber,
          status: 'Verified'
        })));
      }
    } catch (err) {}
  };

  const fetchMyDigitalPass = async () => {
    try {
      const email = userEmail || 'student@college.edu';
      const role = effectiveRole;
      const res = await axios.get(`${BACKEND_URL}/passes/my-pass?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`);
      if (res.data?.passNumber) {
        setDigitalPass(res.data);
        if (res.data.formattedValidUntil) setPassValidityDate(res.data.formattedValidUntil);
        if (res.data.formattedValidFrom) setPassStartDate(res.data.formattedValidFrom);
        if (res.data.daysRemaining !== undefined) setDaysRemaining(res.data.daysRemaining);
        if (res.data.durationDays !== undefined) setPassPlanDays(String(res.data.durationDays));
        if (Array.isArray(res.data.history) && res.data.history.length > 0) {
          setReceiptsList(res.data.history.map(h => ({
            id: h.invoiceId || h.id,
            desc: h.planTitle || `${h.plan} Pass Renewal`,
            amount: h.amount,
            status: h.status || 'PAID',
            date: new Date(h.issuedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          })));
        }
      }
    } catch (e) {}
  };

  const fetchMyViolations = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/violations/my-violations?email=${encodeURIComponent(userEmail)}`);
      if (Array.isArray(res.data)) {
        setMyViolations(res.data);
      }
    } catch (e) {}
  };

  const fetchBookings = async () => {
    try {
      // 1. Fetch user's own bookings
      const res = await axios.get(`${BACKEND_URL}/bookings/my-bookings?email=${encodeURIComponent(userEmail)}`);
      if (Array.isArray(res.data)) {
        const mapped = res.data.map(b => ({
          id: b.id || `b_${Date.now()}`,
          date: b.bookingDate || b.date || new Date().toISOString().split('T')[0],
          time: `${b.bookingTime || b.time || '09:00 AM'} (${b.durationHours || 4} hrs)`,
          zone: b.zoneName || b.slot?.zone?.name || 'KRISHNA HOSTEL',
          slot: b.slotNumber || b.slot?.slotNumber || 'K-30',
          vehicle: b.vehiclePlate || b.plateNumber || b.vehicle?.plateNumber || 'NO VEHICLE',
          duration: `${b.durationHours || 4} Hours`,
          status: b.status || 'CONFIRMED',
          releasedBy: b.releasedBy || null,
          releasedAt: b.releasedAt || null
        }));
        
        // AUTOMATIC EXIT DETECTION: If an active booking was cleared by security
        const activeBefore = activeBookingRef.current;
        const currentActive = mapped.find(b => b.status === 'CONFIRMED');
        const latestExited = mapped.find(b => b.status === 'EXITED' || b.status === 'RELEASED');

        if (activeBefore && !currentActive && latestExited && !handledExitBookingIds.current.has(latestExited.id)) {
          handledExitBookingIds.current.add(latestExited.id);
          setIsExitModalOpen(false);
          setExitConfirmedModal({
            plate: latestExited.vehicle,
            slot: latestExited.slot,
            zone: latestExited.zone,
            duration: latestExited.duration,
            releasedBy: latestExited.releasedBy || 'Security Officer',
            releasedAt: latestExited.releasedAt || new Date().toISOString()
          });
        }

        activeBookingRef.current = currentActive || null;

        setHistoryList(prev => {
          const map = new Map();
          mapped.forEach(m => map.set(m.id, m));
          prev.forEach(p => {
            if (!map.has(p.id)) {
              map.set(p.id, p);
            }
          });
          const result = Array.from(map.values());
          const userHistoryKey = `parknex_historyList_${userEmail}`;
          localStorage.setItem(userHistoryKey, JSON.stringify(result));
          return result;
        });
      }

      // 2. Fetch ALL campus bookings across all users for live slot matrix occupancy
      const allRes = await axios.get(`${BACKEND_URL}/bookings/all`);
      if (Array.isArray(allRes.data)) {
        setAllCampusBookings(allRes.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAdminZonesAndSlots();
    fetchVehicles();
    fetchMyDigitalPass();
    fetchAIRecommendations();
    fetchFindVehicle();
    fetchBookings();
    fetchMyViolations();

    const interval = setInterval(() => {
      fetchAdminZonesAndSlots();
      fetchBookings();
      fetchMyViolations();
    }, 8000);

    const chName = `student-dashboard-realtime-${Date.now()}`;
    const channel = supabase
      .channel(chName)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchAdminZonesAndSlots();
        fetchBookings();
        fetchVehicles();
        fetchMyViolations();
        fetchAIRecommendations();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          fetchAdminZonesAndSlots();
          fetchBookings();
          fetchVehicles();
          fetchMyViolations();
          fetchAIRecommendations();
        }
      });

    return () => {
      clearInterval(interval);
      if (supabase && supabase.removeChannel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // ACCURATE FULL CAPACITY HELPER: Builds ALL slots (e.g. 150 for KRISHNA HOSTEL)
  const getSlotsForZone = (zoneNameStr) => {
    const targetAdminZone = adminZones.find(z => z.name === zoneNameStr || z.name?.toLowerCase() === zoneNameStr?.toLowerCase());
    
    let prefix = zoneNameStr.split(' ')[0].charAt(0).toUpperCase();
    if (zoneNameStr.startsWith('Staff Block') || zoneNameStr.startsWith('Faculty Block')) prefix = 'SB';
    else if (zoneNameStr.startsWith('Staff Parking') || zoneNameStr.startsWith('Faculty Parking')) prefix = 'SP';
    else if (zoneNameStr.startsWith('Staff')) prefix = 'SP';
    else if (zoneNameStr.startsWith('CS Academic')) prefix = 'CS';
    else if (zoneNameStr.startsWith('Central Library')) prefix = 'CL';
    else if (zoneNameStr.startsWith('Hostel Complex')) prefix = 'HC';
    else if (zoneNameStr.startsWith('HOSPITAL')) prefix = 'H';
    else if (zoneNameStr.startsWith('KRISHNA')) prefix = 'K';
    else if (zoneNameStr.startsWith('Near Temple')) prefix = 'T';
    else if (zoneNameStr.startsWith('North')) prefix = 'N';
    else if (zoneNameStr.startsWith('South')) prefix = 'S';
    else if (zoneNameStr.startsWith('Visitor')) prefix = 'V';

    const count = targetAdminZone?.total || (zoneNameStr === 'KRISHNA HOSTEL' ? 150 : zoneNameStr === 'HOSPITAL PARKING' || zoneNameStr === 'Hostel Complex' ? 200 : 100);
    const slots = [];

    const isZoneStaffOnly = Boolean(targetAdminZone?.isStaffOnly || targetAdminZone?.isFacultyOnly || zoneNameStr.toLowerCase().includes('staff') || zoneNameStr.toLowerCase().includes('faculty'));
    const normSelectedZone = zoneNameStr.trim().toLowerCase();

    for (let i = 1; i <= count; i++) {
      const numStr = `${prefix}-${String(i).padStart(2, '0')}`;

      // Check if slot is ACTIVE CONFIRMED by the CURRENT logged-in user
      const isBookedByMe = historyList.some(b => {
        const bSlot = (b.slot || b.slotNumber || '').replace(/^Slot\s*/i, '').trim().toUpperCase();
        const bZone = (b.zone || b.zoneName || '').replace(/^Zone\s*/i, '').trim().toLowerCase();
        const bDate = b.date || b.bookingDate;
        return bSlot === numStr.toUpperCase() && 
               (bZone === normSelectedZone || bZone.includes(normSelectedZone) || normSelectedZone.includes(bZone)) &&
               bDate === bookingDate && 
               b.status === 'CONFIRMED';
      });

      // Check if slot is ACTIVE CONFIRMED by ANY user across the entire campus
      const isBookedByAnyone = allCampusBookings.some(b => {
        const bSlot = (b.slotNumber || b.slot || b.slot?.slotNumber || '').replace(/^Slot\s*/i, '').trim().toUpperCase();
        const bZone = (b.zoneName || b.zone || b.slot?.zone?.name || '').replace(/^Zone\s*/i, '').trim().toLowerCase();
        const bDate = b.bookingDate || b.date;
        return bSlot === numStr.toUpperCase() && 
               (bZone === normSelectedZone || bZone.includes(normSelectedZone) || normSelectedZone.includes(bZone)) &&
               bDate === bookingDate && 
               b.status === 'CONFIRMED';
      });

      let st = 'AVAILABLE';
      if (isBookedByMe) {
        st = 'OCCUPIED'; // Turn RED / TAKEN when CONFIRMED
      } else if (isBookedByAnyone) {
        st = 'OCCUPIED'; // Turn RED / TAKEN when booked by another user!
      } else if (isZoneStaffOnly) {
        // Dedicated Staff Zone: 100% available to Staff, but blocked as STAFF ONLY for non-staff
        st = isStaffMember ? 'AVAILABLE' : 'STAFF';
      }

      slots.push({
        number: numStr,
        status: st,
        isMyBooking: isBookedByMe,
        ev: i % 4 === 0
      });
    }
    return slots;
  };

  // Compute ACCURATE free slots count dynamically for any zone
  const getAccurateZoneOccupancy = (zoneObj) => {
    const totalCapacity = Number(zoneObj.total || zoneObj.capacity || 100);
    const zName = (zoneObj.name || '').toLowerCase();
    
    // Count real-time confirmed bookings in this zone for the selected date
    const bookedInZone = allCampusBookings.filter(b => {
      const bZone = (b.zoneName || b.zone || b.slot?.zone?.name || '').toLowerCase();
      const bDate = b.bookingDate || b.date;
      return b.status === 'CONFIRMED' && (bZone === zName || zName.includes(bZone) || bZone.includes(zName)) && (!bookingDate || bDate === bookingDate);
    }).length;

    const baseOccupied = Number(zoneObj.occupied !== undefined ? zoneObj.occupied : 0);
    const occupiedCount = Math.max(baseOccupied, bookedInZone);
    const freeSlots = Math.max(0, totalCapacity - occupiedCount);

    return {
      freeSlots,
      totalCapacity,
      occupiedCount
    };
  };

  const handleSendMessage = async (e, directText) => {
    if (e && e.preventDefault) e.preventDefault();
    const userText = (directText || chatInput || '').trim();
    if (!userText || isChatLoading) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const token = localStorage.getItem('parknex_token') || localStorage.getItem('token');
      const resolvedEmail = userEmail || profile?.email || localStorage.getItem('parknex_user_email') || 'student@college.edu';
      const resolvedName = profile?.name || 'Student';
      const resolvedRole = effectiveRole || 'STUDENT';

      const res = await axios.post(`${BACKEND_URL}/ai/chat`, {
        message: userText,
        conversationId: chatConversationId,
        userEmail: resolvedEmail,
        userName: resolvedName,
        userRole: resolvedRole
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 25000
      });

      if (res.data?.reply) {
        if (res.data.conversationId) setChatConversationId(res.data.conversationId);
        if (Array.isArray(res.data.suggestions) && res.data.suggestions.length > 0) {
          setChatSuggestions(res.data.suggestions);
        }
        setChatMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: res.data.reply,
          actionPayload: res.data.actionPayload || null,
          meta: res.data.meta || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error('Empty AI response from server');
      }
    } catch (err) {
      console.warn('AI Chat Assistant error:', err);
      let fallbackText = "🤖 **ParkNex AI Assistant**: Connected to campus live database.\n\nRecommendation: **Slot K-04 in KRISHNA HOSTEL** (80m from Academic Block) is currently optimal for your schedule.";
      let action = { type: 'BOOK_RECOMMENDED_SLOT', zoneName: 'KRISHNA HOSTEL', slotNumber: 'K-04' };

      const lower = userText.toLowerCase();
      if (lower.includes('car') || lower.includes('vehicle') || lower.includes('parked') || lower.includes('find')) {
        fallbackText = `🚗 **Parked Vehicle Grounding**:\nYour vehicle is linked to **${vehicleLocation?.currentZone || 'KRISHNA HOSTEL'}** (Slot **${vehicleLocation?.slotNumber || 'K-30'}**).\n\n• Entry: ${vehicleLocation?.entryTime || '09:00 AM'}\n• Proximity: ~150 meters from CS Academic Block\n• Status: Safely Parked`;
        action = { type: 'VIEW_VEHICLE_LOCATION' };
      } else if (lower.includes('pass') || lower.includes('billing') || lower.includes('valid')) {
        fallbackText = `🎟️ **Smart Parking Pass Status**:\nYour Semester Parking Pass is **ACTIVE & VERIFIED**.\n\n• Validity: Remaining 493 Days\n• Campus Zone Access: All Zones\n• Real-Time Barrier Clearance: ENABLED`;
        action = { type: 'VIEW_PASS', target: 'billing' };
      } else if (lower.includes('free') || lower.includes('fee') || lower.includes('cost')) {
        fallbackText = `💳 **Campus Tariffs**:\nCampus parking is **100% FREE** for all students and faculty with registered license plates and active semester passes.`;
        action = null;
      }

      setChatMessages(prev => [...prev, {
        id: `ai_fb_${Date.now()}`,
        sender: 'ai',
        text: fallbackText,
        actionPayload: action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatAction = (action) => {
    if (!action) return;
    if (action.type === 'BOOK_RECOMMENDED_SLOT' || action.action === 'BOOK_SLOT') {
      setSelectedZone(action.zoneName || 'KRISHNA HOSTEL');
      setSelectedSlot(action.slotNumber || 'K-04');
      setActiveTab('book');
      setIsChatOpen(false);
    } else if (action.type === 'VIEW_VEHICLE_LOCATION') {
      setIsFindVehicleModalOpen(true);
      setIsChatOpen(false);
    } else if (action.type === 'VIEW_PASS' || action.target === 'billing') {
      setActiveTab('billing');
      setIsChatOpen(false);
    } else if (action.target === 'feedback') {
      setActiveTab('feedback');
      setIsChatOpen(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      { 
        id: `init_${Date.now()}`,
        sender: 'ai', 
        text: `👋 Chat cleared! How else can I assist your campus parking today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChatConversationId(null);
  };

  const handleBookRecommendedSlot = (rec) => {
    setSelectedZone(rec.zoneName);
    setSelectedSlot(rec.slotNumber);
    setActiveTab('book');
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicleForm.brand || !newVehicleForm.plateNumber) return;

    try {
      await axios.post(`${BACKEND_URL}/vehicles`, {
        brand: newVehicleForm.brand,
        model: newVehicleForm.model || 'Standard',
        color: newVehicleForm.color || 'White',
        plateNumber: newVehicleForm.plateNumber.toUpperCase(),
        type: newVehicleForm.type
      });
      alert('Vehicle successfully registered with campus security!');
      fetchVehicles();
    } catch (err) {
      setVehicles(prev => [
        {
          id: String(Date.now()),
          brand: newVehicleForm.brand,
          model: newVehicleForm.model || 'Standard',
          color: newVehicleForm.color || 'White',
          type: newVehicleForm.type,
          plate: newVehicleForm.plateNumber.toUpperCase(),
          status: 'Verified'
        },
        ...prev
      ]);
      alert('Vehicle added to your registered list.');
    } finally {
      setIsAddVehicleModalOpen(false);
      setNewVehicleForm({ brand: '', model: '', color: '', plateNumber: '', type: '4-Wheeler' });
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/vehicles/${vehicleId}`);
      fetchVehicles();
    } catch (e) {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
    }
  };

  // STRICT VEHICLE CONFLICT & DUPLICATE PREVENTING BOOKING HANDLER
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (isBookingSubmitting) return;

    if (!selectedSlot) {
      alert('Please select an available parking slot from the map grid below.');
      return;
    }

    const targetPlate = passSelectedVehicle || selectedVehicle || (vehicles.length > 0 ? vehicles[0]?.plate : '');

    if (!targetPlate || vehicles.length === 0) {
      alert("🚗 No Registered Vehicle Found!\n\nYou must register your vehicle before booking a parking slot. Please add your vehicle details now.");
      setIsAddVehicleModalOpen(true);
      return;
    }

    // Role-based staff zone reservation protection:
    // - Students cannot book in Staff zones
    // - Staff members CAN ONLY book in Staff zones (they cannot and are unable to park in normal zones)
    const targetZoneObj = adminZones.find(z => z.name === selectedZone);
    const isTargetZoneStaffOnly = selectedZone.toLowerCase().includes('staff') || 
      selectedZone.toLowerCase().includes('faculty') || 
      targetZoneObj?.isStaffOnly ||
      targetZoneObj?.isFacultyOnly;

    if (isTargetZoneStaffOnly && !isStaffMember) {
      alert(`⛔ Access Denied!\n\nZone "${selectedZone}" is a dedicated Staff parking area. Students are not permitted to reserve slots here. Please select an authorized student campus zone.`);
      setSelectedZone('KRISHNA HOSTEL');
      return;
    }

    if (!isTargetZoneStaffOnly && isStaffMember) {
      alert(`⛔ Access Denied!\n\nStaff members must park exclusively in dedicated Staff zones (e.g. "Staff Parking"). You are not permitted to book parking in general student zones.`);
      setSelectedZone('Staff Parking');
      return;
    }

    // 1. Check if this specific slot in this zone is ALREADY booked for the selected date (Personal or Campus-wide)!
    const normSelectedZone = selectedZone.trim().toLowerCase();
    const normSelectedSlot = selectedSlot.replace(/^Slot\s*/i, '').trim().toUpperCase();

    const isSlotBookedLocally = historyList.some(b => {
      const bSlot = (b.slot || b.slotNumber || '').replace(/^Slot\s*/i, '').trim().toUpperCase();
      const bZone = (b.zone || b.zoneName || '').replace(/^Zone\s*/i, '').trim().toLowerCase();
      const bDate = b.date || b.bookingDate;
      return bSlot === normSelectedSlot && 
             (bZone === normSelectedZone || bZone.includes(normSelectedZone) || normSelectedZone.includes(bZone)) && 
             bDate === bookingDate && 
             b.status === 'CONFIRMED';
    });

    const isSlotBookedCampusWide = allCampusBookings.some(b => {
      const bSlot = (b.slotNumber || b.slot || b.slot?.slotNumber || '').replace(/^Slot\s*/i, '').trim().toUpperCase();
      const bZone = (b.zoneName || b.zone || b.slot?.zone?.name || '').replace(/^Zone\s*/i, '').trim().toLowerCase();
      const bDate = b.bookingDate || b.date;
      return bSlot === normSelectedSlot && 
             (bZone === normSelectedZone || bZone.includes(normSelectedZone) || normSelectedZone.includes(bZone)) && 
             bDate === bookingDate && 
             b.status === 'CONFIRMED';
    });

    if (isSlotBookedLocally || isSlotBookedCampusWide) {
      alert(`⚠️ Slot ${selectedSlot} in ${selectedZone} is ALREADY reserved for ${bookingDate} by another user.\n\nDuplicate bookings for the same slot on the same date are not allowed. Please choose a different slot or select a different date.`);
      return;
    }

    // 2. Check if the SAME VEHICLE already has an active reservation on the SAME DATE!
    const existingVehicleBooking = historyList.find(b => 
      b.vehicle === targetPlate && 
      b.date === bookingDate && 
      b.status === 'CONFIRMED'
    );

    if (existingVehicleBooking) {
      alert(`⚠️ Vehicle ${targetPlate} ALREADY has an active reservation on ${bookingDate} (${existingVehicleBooking.slot} in ${existingVehicleBooking.zone}).\n\nA single vehicle cannot park in multiple slots at the same time. Please select another registered vehicle or choose a different date for this booking.`);
      return;
    }

    setIsBookingSubmitting(true);

    const newBookingData = {
      bookingDate,
      bookingTime,
      durationHours,
      zoneName: selectedZone,
      slotNumber: selectedSlot,
      plateNumber: targetPlate,
      userEmail: userEmail
    };

    try {
      const res = await axios.post(`${BACKEND_URL}/bookings`, newBookingData);
      const serverBooking = res.data?.booking || res.data;
      const actualBookingId = serverBooking?.id || String(Date.now());

      const newEntry = {
        id: actualBookingId,
        date: bookingDate,
        time: `${bookingTime} (${durationHours} hrs)`,
        zone: selectedZone,
        slot: selectedSlot,
        vehicle: targetPlate,
        duration: `${durationHours} Hours`,
        status: 'CONFIRMED'
      };

      alert(`Booking Confirmed! Vehicle ${targetPlate} reserved Slot ${selectedSlot} in ${selectedZone} for ${bookingDate}.`);
      
      const updatedHistory = [newEntry, ...historyList.filter(h => h.id !== actualBookingId)];
      setHistoryList(updatedHistory);
      setAllCampusBookings(prev => [newBookingData, ...prev]);

      // Reset selectedSlot to next free slot
      const availableList = getSlotsForZone(selectedZone);
      const nextFree = availableList.find(s => s.number !== selectedSlot && s.status === 'AVAILABLE')?.number || '';
      setSelectedSlot(nextFree);

      setIsBookingSubmitting(false);
      fetchAIRecommendations();
      fetchAdminZonesAndSlots();
      fetchBookings();
      setActiveTab('history');
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to reserve slot ${selectedSlot}. Please try another slot.`;
      alert(`⚠️ Booking Rejected:\n\n${errorMsg}`);
      setIsBookingSubmitting(false);
      fetchBookings();
    }
  };

  // CAMPUS EXIT GATE PASS DISPLAY (Clearance via Security Officer Scan)
  const handleExitCampusGate = (session) => {
    setExitSessionDetails(session);
    setIsExitModalOpen(true);
  };

  // PERSISTENT ADVANCE PERMIT RENEWAL PAYMENT HANDLER
  const handleConfirmAdvancePayment = () => {
    const isPaid = selectedPayTier === 'PAID';
    const amount = isPaid ? '₹500.00' : '₹0.00';
    const invId = `INV-2026-${Math.floor(10 + Math.random() * 90)}`;
    const newValidity = 'December 31, 2027';

    setPassValidityDate(newValidity);
    setDaysRemaining(493);

    localStorage.setItem('parknex_passValidity', newValidity);
    localStorage.setItem('parknex_daysRemaining', '493');

    const newReceipt = {
      id: invId,
      desc: isPaid ? 'Advance 2027 Annual Premium Parking Pass' : 'Fall 2027 Semester Subsidized Parking Grant',
      amount: amount,
      status: 'PAID',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    };

    const updatedReceipts = [newReceipt, ...receiptsList];
    setReceiptsList(updatedReceipts);
    localStorage.setItem('parknex_receiptsList', JSON.stringify(updatedReceipts));

    alert(`🎉 Advance Renewal Payment Successful (${amount})! Your campus parking permit has been extended until ${newValidity} (493 Days remaining). Changes saved permanently!`);
    setIsAdvancePayModalOpen(false);
  };

  const downloadStatementPDF = () => {
    const dept = profile?.department;
    const term = profile?.academicTerm;

    if (!dept || !term) {
      alert("🎓 Academic Profile Incomplete!\n\nPlease enter your Department and Academic Term under Edit Profile before generating your parking permit statement.");
      if (onEditProfile) onEditProfile();
      return;
    }

    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 28, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PARKNEX-AI SMART CAMPUS PLATFORM', 14, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL DIGITAL PARKING PERMIT & STATEMENT RECEIPT', 14, 21);

      // Section: Permit Holder Info
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PERMIT HOLDER INFORMATION', 14, 38);

      doc.setLineWidth(0.5);
      doc.setDrawColor(99, 102, 241);
      doc.line(14, 41, 196, 41);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      const infoLines = [
        `Student Name:    ${profile?.name || userEmail.split('@')[0]}`,
        `Department:      ${dept}`,
        `Academic Term:   ${term}`,
        `Pass Serial No:  ${digitalPass?.passNumber || ('PASS-STU-' + userEmail.split('@')[0].toUpperCase())}`,
        `Permit Category: Student Tier (100% University Subsidized)`,
        `Primary Vehicle: ${passSelectedVehicle || (vehicles.length > 0 ? vehicles[0].plate : 'AP-CS-0234')}`
      ];

      let y = 50;
      infoLines.forEach(line => {
        doc.text(line, 14, y);
        y += 6.5;
      });

      y += 6;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('STATEMENT RECEIPT SUMMARY', 14, y);
      y += 3;
      doc.line(14, y, 196, y);
      y += 8;

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      receiptsList.forEach((r, idx) => {
        doc.text(`${idx + 1}. ${r.desc} | Amount: ${r.amount} | Status: ${r.status} | Date: ${r.date}`, 14, y);
        y += 6.5;
      });

      y += 6;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('PARKING RESERVATION LOGS', 14, y);
      y += 3;
      doc.line(14, y, 196, y);
      y += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      historyList.forEach((h, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${i + 1}. Date: ${h.date} | Time: ${h.time} | Zone: ${h.zone} | Slot: ${h.slot} | Plate: ${h.vehicle} | Status: ${h.status}`, 14, y);
        y += 6;
      });

      y += 10;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on ${new Date().toLocaleString()} • Digitally Signed & Sealed by ParkNex-AI System`, 14, y);

      const safeName = (profile?.name || userEmail.split('@')[0] || 'User').replace(/\s+/g, '_');
      doc.save(`ParkNex_Parking_Statement_${safeName}_2026.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert('Error generating PDF file.');
    }
  };

  const handleDownloadPDFStatement = downloadStatementPDF;

  const currentVehicleHasBookingOnSelectedDate = historyList.some(b => 
    b.vehicle === selectedVehicle && 
    b.date === bookingDate && 
    b.status === 'CONFIRMED'
  );

  const activeParkedSession = historyList.find(b => b.status === 'CONFIRMED');

  const getGreeting = () => {
    const curHour = new Date().getHours();
    if (curHour >= 4 && curHour < 12) return 'Good morning';
    if (curHour >= 12 && curHour < 17) return 'Good afternoon';
    if (curHour >= 17 && curHour < 22) return 'Good evening';
    return 'Welcome';
  };
  const studentDisplayName = profile?.name || (userEmail ? (userEmail.includes('@') ? userEmail.split('@')[0] : userEmail) : (isStaffMember ? 'Staff Member' : 'Student'));
  const totalOpenSlots = (displayedZones || []).reduce((sum, z) => sum + Math.max(0, (z.free !== undefined ? Number(z.free) : (Number(z.total || 0) - Number(z.occupied || 0)))), 0);

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <style>{`
        @keyframes sparkleGlow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            filter: drop-shadow(0 0 3px rgba(245, 158, 11, 0.5));
          }
          50% {
            opacity: 0.35;
            transform: scale(1.18);
            filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.9));
          }
        }
        @keyframes clockPulseGlow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.45;
          }
        }
        .animate-sparkle-glow {
          display: inline-flex;
          animation: sparkleGlow 1.2s ease-in-out infinite;
        }
        .animate-clock-pulse {
          display: inline-flex;
          animation: clockPulseGlow 1.5s ease-in-out infinite;
        }
      `}</style>
      
      {/* HEADER PANEL WITH REAL-TIME CALENDAR & CLOCK TICKER */}
      <div className="section-header" style={{ flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.85rem', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
            {getGreeting()}, {studentDisplayName}!{' '}
            <span className="animate-sparkle-glow" style={{ display: 'inline-flex' }}>
              <Sparkles size={24} color="#fbbf24" />
            </span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(99, 102, 241, 0.22)', color: '#C7D2FE', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800', border: '1px solid rgba(199, 210, 254, 0.4)' }}>
              🎓 {profile?.department ? `${profile.department}${profile?.academicTerm ? ` • ${profile.academicTerm}` : ''}` : 'Campus Student Parking Member'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.22)', color: '#6EE7B7', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800', border: '1px solid rgba(110, 231, 183, 0.4)' }}>
              🟢 Permit Active • Fast ANPR Ready
            </span>
            {onEditProfile && (
              <button onClick={onEditProfile} style={{ background: 'none', border: 'none', color: '#A5B4FC', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline', padding: '0.2rem 0.4rem' }}>
                ✏️ Edit Profile Info
              </button>
            )}
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.22)', color: '#93C5FD', border: '1px solid rgba(147, 197, 253, 0.4)', fontWeight: '800', fontSize: '0.82rem', padding: '0.35rem 0.85rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="animate-clock-pulse">
                <Clock size={14} color="#93C5FD" />
              </span>
              LIVE CLOCK: {liveClockTime} ({bookingDate})
            </span>
          </div>
        </div>
        
        {/* INTERACTIVE HEADER NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => setIsChatOpen(!isChatOpen)} style={{ gap: '0.5rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', border: 'none', borderRadius: '24px', fontWeight: '900', color: '#FFFFFF', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}>
            <Bot size={18} /> AI Assistant
          </button>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'book', label: 'Book a Slot' },
            { id: 'vehicles', label: 'My Vehicles' },
            { id: 'map', label: 'Campus Map' },
            { id: 'billing', label: 'Passes & Billing' },
            { id: 'history', label: 'Parking History' },
            { id: 'feedback', label: 'Feedback' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className="btn"
                style={{
                  borderRadius: '24px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  padding: '0.55rem 1.15rem',
                  background: isActive ? 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#FFFFFF' : '#F1F5F9',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.22)',
                  boxShadow: isActive ? '0 4px 18px rgba(99, 102, 241, 0.45)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 1. OVERVIEW TAB ================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* CAMPUS WELCOME & REAL-TIME PARKING READINESS HERO CARD */}
          <div className="card animate-fade-in" style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #1E293B 100%)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '24px',
            padding: '2rem 2.25rem',
            color: '#FFFFFF',
            boxShadow: '0 12px 35px rgba(15, 23, 42, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background subtle glow effect */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            {/* Top row badge & live gate clearance indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#A5B4FC', border: '1px solid rgba(165, 180, 252, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} color="#A5B4FC" /> ParkNex AI Campus Hub
                </span>
                <span style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#6EE7B7', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  ANPR Barrier Gates 1 & 2 Active
                </span>
              </div>
              <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: '700' }}>
                Term: 2026 Academic Session • Student Priority Pass
              </span>
            </div>

            {/* Main Welcome Message */}
            <div style={{ maxWidth: '850px', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FFFFFF', margin: '0 0 0.5rem 0', letterSpacing: '-0.01em' }}>
                Welcome to your Campus Parking Hub, {studentDisplayName}!
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#CBD5E1', lineHeight: '1.6', fontWeight: '500' }}>
                Automated barrier clearance is enabled for your verified vehicles. Real-time slot guidance, AI-assisted parking recommendations, and digital FastPass clearance are synchronized across campus gates.
              </p>
            </div>

            {/* Quick Metrics Bar with Ample Padding */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Campus Bays</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#38BDF8', marginTop: '0.2rem' }}>
                  {totalOpenSlots} Open
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700' }}>Across {adminZones.length || 9} Campus Lots</span>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registered Vehicles</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#34D399', marginTop: '0.2rem' }}>
                  {vehicles.length} {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700' }}>Fast ANPR Auto-Clearance</span>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Digital FastPass</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#FBBF24', marginTop: '0.2rem' }}>
                  {daysRemaining} Days Left
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700' }}>Active until {passValidityDate}</span>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setActiveTab('book')} 
                style={{ borderRadius: '14px', padding: '0.7rem 1.4rem', fontWeight: '900', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', border: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)' }}
              >
                <Zap size={17} /> Reserve a Bay Now
              </button>
              <button 
                className="btn" 
                onClick={() => setActiveTab('map')} 
                style={{ borderRadius: '14px', padding: '0.7rem 1.3rem', fontWeight: '800', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.18)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <MapIcon size={17} /> Live Campus Map
              </button>
              <button 
                className="btn" 
                onClick={() => setIsChatOpen(true)} 
                style={{ borderRadius: '14px', padding: '0.7rem 1.3rem', fontWeight: '800', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', border: 'none', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
              >
                <Bot size={17} /> Ask AI Assistant
              </button>
              <button 
                className="btn" 
                onClick={() => setActiveTab('billing')} 
                style={{ borderRadius: '14px', padding: '0.7rem 1.3rem', fontWeight: '800', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.18)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <QrIcon size={17} /> Digital Pass & Billing
              </button>
            </div>
          </div>
          
          {/* ACTIVE VIOLATIONS & FINES WARNING CARD */}
          {myViolations.some(v => v.status === 'PENDING') && (
            <div id="student-violations-card" className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)', border: '2px solid #ef4444', borderRadius: '20px', padding: '1.25rem 1.75rem', color: '#fff', boxShadow: '0 8px 25px rgba(239,68,68,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.6rem', background: 'rgba(239,68,68,0.25)', borderRadius: '12px', border: '1px solid #fca5a5' }}>
                    <AlertTriangle size={26} color="#fca5a5" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: '#fef2f2', letterSpacing: '0.3px' }}>
                      ⚠️ Active Parking Violation Ticket Issued
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: '#fecaca', fontWeight: '600' }}>
                      Security Enforcement Notice • Action Required
                    </span>
                  </div>
                </div>
                <span className="badge" style={{ background: '#ef4444', color: '#ffffff', fontWeight: '900', padding: '0.4rem 0.85rem', borderRadius: '12px' }}>
                  {myViolations.filter(v => v.status === 'PENDING').length} PENDING TICKET(S)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myViolations.filter(v => v.status === 'PENDING').map((viol, vIdx) => (
                  <div key={viol.id || vIdx} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '14px', padding: '1rem', border: '1px solid rgba(239,68,68,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#ffffff', fontFamily: 'monospace' }}>{viol.plateNumber}</strong>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.4)', color: '#fecaca', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '800' }}>
                          {viol.type || 'WRONG_PARKING'}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>
                        {viol.description || 'Reported by Security Officer'} • Issued by: <strong>{viol.issuedBy || 'Security Officer'}</strong>
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>
                        Issued: {viol.issuedAt ? new Date(viol.issuedAt).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fbbf24', display: 'block' }}>
                        Fine: ₹{viol.penaltyAmount || 500}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: '700' }}>
                        Clear at Security Gate Desk
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE PARKED SESSION & CAMPUS GATE CHECKOUT ACTION CARD */}
          {activeParkedSession && (
            <div className="card" style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', border: '1px solid #10b981', borderRadius: '20px', padding: '1.25rem 1.75rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 8px 25px rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.2)', borderRadius: '14px' }}>
                  <CarFront size={28} color="#ffffff" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px', opacity: 0.9 }}>Active Parked Vehicle</span>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: '900', margin: '0.1rem 0' }}>
                    Vehicle {activeParkedSession.vehicle} is Parked in Slot {activeParkedSession.slot} ({activeParkedSession.zone})
                  </h4>
                  <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Session: {activeParkedSession.time} • Date: {activeParkedSession.date}</span>
                </div>
              </div>
              <button 
                className="btn" 
                onClick={() => handleExitCampusGate(activeParkedSession)}
                style={{ background: '#ffffff', color: '#047857', fontWeight: '900', padding: '0.75rem 1.5rem', borderRadius: '14px', border: 'none', gap: '0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center' }}
              >
                <QrIcon size={18} /> Show Exit QR Pass to Security
              </button>
            </div>
          )}

          {/* HIGH-CONTRAST DYNAMIC AI PARKING RECOMMENDATIONS CARD */}
          <div className="card" style={{ background: 'rgba(15, 27, 46, 0.84)', border: '1px solid rgba(255, 255, 255, 0.14)', borderRadius: '24px', boxShadow: '0 16px 40px -10px rgba(0,0,0,0.65)', padding: '1.75rem', color: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bot color="#818CF8" size={28} /> AI Recommended Parking Slots
              </h3>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#4ADE80', border: '1px solid rgba(74, 222, 128, 0.35)', fontSize: '0.82rem', padding: '0.4rem 0.9rem', fontWeight: '900' }}>
                AI MATCH CONFIDENCE: 96%
              </span>
            </div>

            {/* DYNAMIC DISTINCT RECOMMENDATIONS (UNIQUE SLOTS ACROSS ZONES) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {aiRecommendations.map((rec, i) => (
                <div key={i} style={{ background: 'rgba(255, 255, 255, 0.05)', border: i === 0 ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '18px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: i === 0 ? '0 8px 25px rgba(99,102,241,0.3)' : '0 4px 15px rgba(0,0,0,0.3)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '900', color: i === 0 ? '#A5B4FC' : '#94A3B8' }}>
                        {i === 0 ? '🏆 TOP PICK #1' : `#${i + 1} RECOMMENDATION`}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: '900', color: '#4ADE80' }}>{rec.score}% Match</span>
                    </div>
                    <h4 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#FFFFFF', marginBottom: '0.4rem', letterSpacing: '0.3px' }}>
                      Slot {rec.slotNumber} ({rec.zoneName})
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: '#CBD5E1', marginBottom: '1.25rem', lineHeight: '1.4', fontWeight: '500' }}>{rec.reason}</p>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '0.65rem', justifyContent: 'center', fontSize: '0.92rem', fontWeight: '900', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', color: '#ffffff', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }} onClick={() => handleBookRecommendedSlot(rec)}>
                    Reserve Slot {rec.slotNumber}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* STATS GRID & SHORTCUT CARDS */}
          <div className="stats-grid">
            <div className="card stat-card" style={{ borderLeft: '4px solid var(--primary)', cursor: 'pointer' }} onClick={() => setActiveTab('billing')}>
              <div className="stat-icon-box" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><Award size={24} /></div>
              <div className="stat-info">
                <span className="label">Digital Pass</span>
                {vehicles.length === 0 ? (
                  <>
                    <span className="value" style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>Pending Link</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: '800' }}>● Register Vehicle to Activate</span>
                  </>
                ) : (
                  <>
                    <span className="value" style={{ fontSize: '1.05rem' }}>{digitalPass?.passNumber || `PASS-STU-${(userEmail || 'USER').split('@')[0].toUpperCase()}`}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '800' }}>● ACTIVE ({daysRemaining} Days Left)</span>
                  </>
                )}
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid var(--warning)', cursor: 'pointer' }} onClick={() => {
              if (historyList.some(h => h.status === 'CONFIRMED')) {
                setIsFindVehicleModalOpen(true);
              } else {
                setActiveTab('book');
              }
            }}>
              <div className="stat-icon-box" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><Compass size={24} /></div>
              <div className="stat-info">
                <span className="label">AI Find My Vehicle</span>
                {(() => {
                  const activeBooking = historyList.find(h => h.status === 'CONFIRMED');
                  if (activeBooking) {
                    return (
                      <>
                        <span className="value">Slot {activeBooking.slot}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '800' }}>{activeBooking.zone} • Click for route →</span>
                      </>
                    );
                  }
                  return (
                    <>
                      <span className="value" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>No Active Booking</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Reserve slot to track location</span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid var(--success)', cursor: 'pointer' }} onClick={() => setActiveTab('vehicles')}>
              <div className="stat-icon-box" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><CarFront size={24} /></div>
              <div className="stat-info">
                <span className="label">Primary Vehicle</span>
                {vehicles.length > 0 ? (
                  <>
                    <span className="value">{vehicles[0].plate}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{vehicles[0].brand} ({vehicles.length} Verified Vehicles)</span>
                  </>
                ) : (
                  <>
                    <span className="value" style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>No Vehicle Linked</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '800' }}>0 Verified Vehicles (Click to Add)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* FEEDBACK & RATINGS QUICK BANNER */}
          <div 
            className="card animate-fade-in" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)', 
              border: '1px solid rgba(37, 99, 235, 0.2)', 
              borderRadius: '20px', 
              padding: '1.25rem 1.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}
            onClick={() => setActiveTab('feedback')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563EB, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                <MessageSquare size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  How was your campus parking today?
                </h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  Share quick feedback on barrier clearance, AI suggestions, or parking bays. Your input shapes campus mobility!
                </p>
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ borderRadius: '12px', padding: '0.6rem 1.25rem', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={(e) => { e.stopPropagation(); setActiveTab('feedback'); }}
            >
              <Sparkles size={15} /> Rate Today's Experience →
            </button>
          </div>

          {/* DYNAMIC LIVE ACCURATE ADMIN ZONES CAPACITY CARDS */}
          <div className="charts-grid">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <MapPin size={20} color="var(--primary)" /> {isStaffMember ? 'Allocated Staff Parking Zone' : 'Campus Parking Zones & Live Vacancies'} ({displayedZones.length} Zone{displayedZones.length === 1 ? '' : 's'})
                </h3>
                <span style={{ fontSize: '0.75rem', color: isStaffMember ? '#a855f7' : 'var(--text-muted)', fontWeight: '800' }}>
                  {isStaffMember ? '⭐ Staff Exclusive Allocated Zone' : 'Student Permitted Zones'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.4rem' }}>
                {displayedZones.map((zone) => {
                  const { freeSlots, totalCapacity, occupiedCount } = getAccurateZoneOccupancy(zone);
                  const ratio = occupiedCount / (totalCapacity || 1);
                  const color = ratio > 0.9 ? 'var(--danger)' : ratio > 0.7 ? 'var(--warning)' : 'var(--success)';
                  const isStaffOnlyZone = zone.isStaffOnly || zone.isFacultyOnly;
                  return (
                    <div key={zone.id || zone.name} style={{ padding: '1.25rem', background: isStaffOnlyZone ? 'rgba(168, 85, 247, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '16px', border: isStaffOnlyZone ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>{zone.name}</span>
                        {isStaffOnlyZone && <span className="badge badge-warning" style={{ fontSize: '0.65rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' }}>⭐ STAFF ONLY</span>}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        <strong style={{ color: color }}>{freeSlots}</strong> / {totalCapacity} Free Slots
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, Math.round(ratio * 100))}%`, height: '100%', background: color, borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GATE SCANNABLE QR PASS CARD WITH VEHICLE SWITCHER */}
            {vehicles.length === 0 ? (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
                <QrIcon size={44} color="var(--primary)" style={{ opacity: 0.6, marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)' }}>No Vehicle Linked to QR Pass</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', maxWidth: '280px' }}>
                  Register your vehicle license plate under <strong>My Vehicles</strong> to activate your gate entrance QR pass.
                </p>
                <button className="btn btn-primary" onClick={() => setActiveTab('vehicles')} style={{ gap: '0.4rem', fontSize: '0.85rem' }}>
                  <Plus size={16} /> Register Your First Vehicle
                </button>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Gate Scannable QR Pass</h3>
                
                {/* VEHICLE SWITCHER PILLS FOR QR PASS */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
                  {vehicles.map(v => (
                    <button 
                      key={v.plate} 
                      onClick={() => setPassSelectedVehicle(v.plate)}
                      className={`btn ${passSelectedVehicle === v.plate ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                    >
                      {v.type === '2-Wheeler' ? '🏍️' : '🚗'} {v.plate}
                    </button>
                  ))}
                </div>

                <div style={{ padding: '0.75rem', background: '#fff', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '0.75rem', display: 'inline-flex', boxShadow: '0 0 25px rgba(99,102,241,0.25)' }}>
                  <RealScannableQRCode value={getVehicleQRPayload(passSelectedVehicle)} size={130} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '800', margin: 0 }}>
                  Unique Scannable QR for {passSelectedVehicle}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 2. BOOK A SLOT TAB (REAL TIME CALENDAR & CLOCK MATCHED) ================= */}
      {activeTab === 'book' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <Calendar size={24} color="var(--primary)" /> Reserve Campus Parking Space
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Select your vehicle, arrival schedule, and pick any slot in the selected Admin zone
                </p>
              </div>
              {selectedSlot && (
                <div style={{ padding: '0.6rem 1.25rem', background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '14px', color: '#10b981', fontWeight: '900', fontSize: '0.9rem' }}>
                  Selected Slot: {selectedSlot} ({selectedZone})
                </div>
              )}
            </div>

            {/* VEHICLE ACTIVE BOOKING CONFLICT WARNING BANNER */}
            {currentVehicleHasBookingOnSelectedDate && (
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '16px', color: '#fca5a5', fontWeight: '700', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <AlertTriangle size={24} color="var(--danger)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', color: '#ef4444', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Active Vehicle Reservation Found!</strong>
                  Vehicle <code style={{ color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>{selectedVehicle}</code> already has an active slot booked on <strong>{bookingDate}</strong>. A vehicle cannot be parked in multiple slots simultaneously. Select another vehicle or pick a different date.
                </div>
              </div>
            )}

            <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select Registered Vehicle</label>
                  <select 
                    value={selectedVehicle} 
                    onChange={e => setSelectedVehicle(e.target.value)} 
                    className="search-input" 
                    style={{ color: 'var(--text-main)', backgroundColor: 'var(--bg-sidebar)', paddingLeft: '1rem' }}
                  >
                    {vehicles.map(v => (
                      <option key={v.plate || v.id} value={v.plate} style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                        {v.brand} {v.model} ({v.plate}) - {v.type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DYNAMIC ADMIN ZONES SELECT DROPDOWN (ROLE SCOPED) */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {isStaffMember ? 'Select Allocated Staff Zone (Staff Exclusive)' : 'Select Parking Zone (Student Permitted)'}
                  </label>
                  <select 
                    value={selectedZone} 
                    onChange={e => {
                      const newZone = e.target.value;
                      setSelectedZone(newZone);
                      const availableList = getSlotsForZone(newZone);
                      const firstFree = availableList.find(s => s.status === 'AVAILABLE')?.number || `${newZone.charAt(0)}-01`;
                      setSelectedSlot(firstFree);
                    }} 
                    className="search-input" 
                    style={{ color: 'var(--text-main)', backgroundColor: 'var(--bg-sidebar)', paddingLeft: '1rem' }}
                  >
                    {selectableZones.map(z => (
                      <option key={z.id || z.name} value={z.name} style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                        {z.name} ({z.total} Slots{z.isStaffOnly || z.isFacultyOnly ? ' ⭐ Staff Allocated' : ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reservation Date (Real Time)</label>
                  <input 
                    type="date"
                    required
                    value={bookingDate}
                    onChange={e => {
                      const newDate = e.target.value;
                      setBookingDate(newDate);
                      const updatedSlots = getSlotsForZone(selectedZone);
                      const isCurrTaken = updatedSlots.find(s => s.number === selectedSlot)?.status === 'OCCUPIED';
                      if (isCurrTaken) {
                        const firstFree = updatedSlots.find(s => s.status === 'AVAILABLE')?.number || '';
                        setSelectedSlot(firstFree);
                      }
                    }}
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Arrival Time (Live Clock)</label>
                  <input 
                    type="time"
                    required
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Duration Required</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {[2, 4, 6, 8].map(hrs => (
                    <button
                      key={hrs}
                      type="button"
                      className={`btn ${durationHours === hrs ? 'btn-primary' : 'btn-outline'}`}
                      style={{ justifyContent: 'center' }}
                      onClick={() => setDurationHours(hrs)}
                    >
                      {hrs} Hours
                    </button>
                  ))}
                </div>
              </div>

              {/* FULL ACCURATE VISUAL SLOT PICKER MATRIX */}
              <div style={{ background: '#0a0f1d', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={20} color="var(--primary)" /> All {adminZones.find(z => z.name === selectedZone)?.total || 150} Admin Slots in {selectedZone} ({bookingDate})
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Slots marked TAKEN/RED are booked for {bookingDate}. Select another date to view free slots.</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: '700' }}>
                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>● Available</span>
                    <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>● Occupied / Booked</span>
                    {isStaffMember ? (
                      <span style={{ color: '#a855f7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>⭐ Staff Priority</span>
                    ) : (
                      <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>🔒 Staff Only</span>
                    )}
                    <span style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>⚡ EV Charger</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.9rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.4rem' }}>
                  {getSlotsForZone(selectedZone).map((slotItem) => {
                    const isSelected = selectedSlot === slotItem.number;
                    const isAvailable = slotItem.status === 'AVAILABLE';
                    const isStaffOnlySlot = slotItem.status === 'STAFF' || slotItem.status === 'FACULTY';
                    const isOccupied = slotItem.status === 'OCCUPIED';
                    const isAiRecommended = aiRecommendations.some(r => r.slotNumber === slotItem.number && r.zoneName === selectedZone);

                    return (
                      <button
                        key={slotItem.number}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slotItem.number)}
                        style={{
                          padding: '0.9rem 0.6rem',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #6366f1' : isAiRecommended ? '2px solid #818cf8' : isAvailable ? '1px solid rgba(16,185,129,0.4)' : isStaffOnlySlot ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(239,68,68,0.4)',
                          background: isSelected ? 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(168,85,247,0.4) 100%)' : isAiRecommended ? 'rgba(99,102,241,0.15)' : isAvailable ? 'rgba(16,185,129,0.06)' : isStaffOnlySlot ? 'rgba(168,85,247,0.06)' : 'rgba(239,68,68,0.12)',
                          color: isSelected ? '#ffffff' : isAiRecommended ? '#a5b4fc' : isAvailable ? '#34d399' : isStaffOnlySlot ? '#c084fc' : '#fca5a5',
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          boxShadow: isSelected ? '0 0 15px rgba(99,102,241,0.6)' : isAiRecommended ? '0 0 12px rgba(99,102,241,0.35)' : 'none',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          opacity: isOccupied ? 0.65 : 1
                        }}
                      >
                        {isAiRecommended && (
                          <span style={{ position: 'absolute', top: '-7px', right: '-4px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontSize: '0.55rem', fontWeight: '900', padding: '0.1rem 0.35rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.4)' }}>
                            AI PICK
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <span style={{ fontWeight: '900', fontSize: '1.05rem' }}>{slotItem.number}</span>
                          {slotItem.ev && <Zap size={14} color="#06b6d4" />}
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>
                          {isSelected ? 'SELECTED' : isAvailable ? (isAiRecommended ? 'AI RECOMMENDED' : 'FREE') : isStaffOnlySlot ? 'STAFF ONLY' : 'TAKEN'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isBookingSubmitting || !selectedSlot || currentVehicleHasBookingOnSelectedDate || getSlotsForZone(selectedZone).find(s => s.number === selectedSlot)?.status === 'OCCUPIED'}
                className="btn btn-primary" 
                style={{ 
                  padding: '1rem', 
                  justify: 'center', 
                  fontSize: '1.05rem', 
                  fontWeight: '800', 
                  background: isBookingSubmitting || currentVehicleHasBookingOnSelectedDate ? '#475569' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                  border: 'none',
                  cursor: isBookingSubmitting || currentVehicleHasBookingOnSelectedDate ? 'not-allowed' : 'pointer'
                }}
              >
                {isBookingSubmitting 
                  ? 'Confirming Reservation...' 
                  : currentVehicleHasBookingOnSelectedDate 
                  ? `Vehicle ${selectedVehicle} Already Parked on ${bookingDate}` 
                  : selectedSlot 
                  ? `Confirm & Book Slot ${selectedSlot} in ${selectedZone}` 
                  : 'Select an Available Slot Below'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= 3. MY VEHICLES TAB ================= */}
      {activeTab === 'vehicles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CarFront color="var(--primary)" size={24} /> My Registered Vehicles
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Manage vehicles linked to your campus parking pass and OCR entry gates
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsAddVehicleModalOpen(true)} style={{ gap: '0.5rem' }}>
                <Plus size={18} /> Register New Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                <CarFront size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Vehicles Registered Yet</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Register your vehicle license plate to enable automatic gate barrier access and slot booking.
                </p>
                <button className="btn btn-primary" onClick={() => setIsAddVehicleModalOpen(true)}>
                  + Register Your First Vehicle
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {vehicles.map((v) => (
                  <div key={v.id || v.plate} className="card animate-fade-in" style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CarFront size={22} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>{v.brand} {v.model}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.color} • {v.type}</span>
                          </div>
                        </div>
                        <span className="badge badge-success" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '0.25rem 0.65rem' }}>
                          VERIFIED
                        </span>
                      </div>

                      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>License Plate</span>
                        <code style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '1px' }}>{v.plate}</code>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem' }}
                        onClick={() => { setSelectedVehicle(v.plate); setActiveTab('book'); }}
                      >
                        Book with this
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', padding: '0.5rem 0.75rem' }}
                        onClick={() => handleDeleteVehicle(v.id)}
                        title="Delete vehicle"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 4. CAMPUS MAP TAB ================= */}
      {activeTab === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapIcon color="var(--primary)" size={24} /> Interactive Campus Parking Map
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {isStaffMember ? 'Live 2D layout of your designated Staff Parking Zone' : 'Live 2D layout of all student-accessible campus parking zones'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '90px', overflowY: 'auto' }}>
                {displayedZones.map(z => (
                  <button 
                    key={z.name} 
                    className={`btn ${activeMapZone === z.name ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => setActiveMapZone(z.name)}
                  >
                    {z.name} {z.isStaffOnly || z.isFacultyOnly ? '⭐' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* HIGH CONTRAST CLEAR READABLE MAP CONTAINER */}
            <div style={{ background: '#090d16', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '1.75rem', minHeight: '400px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.6 }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', position: 'relative', zIndex: 2, maxHeight: '480px', overflowY: 'auto', paddingRight: '0.4rem' }}>
                {displayedZones.map((z) => {
                  const { freeSlots, totalCapacity } = getAccurateZoneOccupancy(z);
                  const isSelectedZone = activeMapZone === z.name;
                  const isStaffOnlyZone = z.isStaffOnly || z.isFacultyOnly;
                  return (
                    <div key={z.id || z.name} style={{ background: isSelectedZone ? 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(30,27,75,0.85) 100%)' : '#111827', border: isSelectedZone ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.15)', borderRadius: '18px', padding: '1.25rem', transition: 'all 0.3s', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                        <Building color={isStaffOnlyZone ? '#c084fc' : '#818cf8'} size={22} />
                        <h4 style={{ color: '#ffffff', fontWeight: '900', fontSize: '1.1rem', margin: 0, letterSpacing: '0.3px' }}>
                          {z.name}
                        </h4>
                      </div>
                      <div style={{ padding: '0.85rem', background: '#030712', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: '800', color: '#94a3b8', fontSize: '0.85rem' }}>Available Capacity</span>
                          <span className="badge badge-success" style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: '800' }}>{freeSlots} FREE SLOTS</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: '600' }}>
                          Total: {totalCapacity} Slots {isStaffOnlyZone ? '⭐ Staff Exclusive' : ''}
                        </span>
                      </div>
                      <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem', justifyContent: 'center', fontWeight: '800', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none' }} onClick={() => { setSelectedZone(z.name); setActiveTab('book'); }}>
                        Select {z.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. PASSES & BILLING TAB (PREMIUM HIGH-CONTRAST LIGHT VIVID DESIGN) ================= */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SUBSCRIPTION EXPIRATION & ADVANCE PAY WARNING BANNER */}
          <div className="card" style={{ 
            background: daysRemaining <= 0 
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(15, 27, 46, 0.95) 100%)' 
              : (daysRemaining <= 3 
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 27, 46, 0.95) 100%)' 
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(15, 27, 46, 0.95) 100%)'), 
            border: daysRemaining <= 0 
              ? '2px solid rgba(248, 113, 113, 0.65)' 
              : (daysRemaining <= 3 
                ? '2px solid rgba(251, 191, 36, 0.65)' 
                : '2px solid rgba(52, 211, 153, 0.65)'), 
            borderRadius: '24px', 
            padding: '1.5rem 2rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1.25rem', 
            boxShadow: daysRemaining <= 0 
              ? '0 10px 35px rgba(239, 68, 68, 0.28)' 
              : (daysRemaining <= 3 
                ? '0 10px 35px rgba(245, 158, 11, 0.28)' 
                : '0 10px 35px rgba(16, 185, 129, 0.25)')
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '320px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: daysRemaining <= 0 ? 'rgba(239, 68, 68, 0.25)' : (daysRemaining <= 3 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'),
                border: daysRemaining <= 0 ? '1.5px solid rgba(248, 113, 113, 0.6)' : (daysRemaining <= 3 ? '1.5px solid rgba(251, 191, 36, 0.6)' : '1.5px solid rgba(52, 211, 153, 0.6)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={32} color={daysRemaining <= 0 ? '#F87171' : (daysRemaining <= 3 ? '#FBBF24' : '#34D399')} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <h4 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '0.2px' }}>
                    Permit Validity: {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} Days Remaining`}
                  </h4>
                  <span style={{ 
                    background: daysRemaining <= 0 ? 'rgba(239, 68, 68, 0.3)' : (daysRemaining <= 3 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'), 
                    color: daysRemaining <= 0 ? '#F87171' : (daysRemaining <= 3 ? '#FBBF24' : '#34D399'),
                    border: daysRemaining <= 0 ? '1px solid rgba(248, 113, 113, 0.6)' : (daysRemaining <= 3 ? '1px solid rgba(251, 191, 36, 0.6)' : '1px solid rgba(52, 211, 153, 0.6)'),
                    fontWeight: '900',
                    fontSize: '0.82rem',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '10px',
                    letterSpacing: '0.5px'
                  }}>
                    {digitalPass?.statusBadge || (daysRemaining <= 0 ? '⛔ EXPIRED' : '● ACTIVE')}
                  </span>
                </div>
                <p style={{ color: '#E2E8F0', fontSize: '0.92rem', margin: '0 0 0.65rem 0', fontWeight: '600', lineHeight: '1.5' }}>
                  Your Digital Campus Parking Permit is valid until <strong style={{ color: daysRemaining <= 0 ? '#F87171' : (daysRemaining <= 3 ? '#FBBF24' : '#34D399'), textDecoration: 'underline' }}>{passValidityDate}</strong>. RFID Barrier auto-clearance is active.
                </p>
                {/* Visual Progress Bar */}
                <div style={{ width: '100%', maxWidth: '460px', height: '10px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
                  <div style={{ 
                    width: `${Math.max(3, digitalPass?.validityPercentage || Math.min(100, Math.round((daysRemaining / 30) * 100)))}%`, 
                    height: '100%', 
                    background: daysRemaining <= 0 ? 'linear-gradient(90deg, #dc2626, #ef4444)' : (daysRemaining <= 3 ? 'linear-gradient(90deg, #d97706, #f59e0b)' : 'linear-gradient(90deg, #10b981, #34d399)'),
                    borderRadius: '6px',
                    boxShadow: daysRemaining <= 0 ? '0 0 10px rgba(239, 68, 68, 0.8)' : (daysRemaining <= 3 ? '0 0 10px rgba(245, 158, 11, 0.8)' : '0 0 10px rgba(52, 211, 153, 0.8)'),
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <button 
                className="btn" 
                onClick={fetchMyDigitalPass}
                title="Sync Live with Campus Gate"
                style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', fontWeight: '800', border: '1.5px solid rgba(255, 255, 255, 0.25)', padding: '0.8rem 1.2rem', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
              >
                <RefreshCw size={17} color="#FFFFFF" /> Sync
              </button>
              <button 
                className="btn" 
                onClick={() => setIsAdvancePayModalOpen(true)}
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', fontWeight: '900', border: 'none', padding: '0.8rem 1.6rem', borderRadius: '14px', gap: '0.6rem', boxShadow: '0 6px 20px rgba(99,102,241,0.45)', cursor: 'pointer', fontSize: '0.92rem', display: 'flex', alignItems: 'center' }}
              >
                <CreditCard size={19} color="#ffffff" /> {daysRemaining <= 0 ? 'Reactivate Permit' : 'Pay Advance Renewal'}
              </button>
            </div>
          </div>

          <div className="charts-grid">
            
            {/* DIGITAL PASS CARD - PREMIUM HIGH CONTRAST GLASSMORPHIC CARD */}
            {vehicles.length === 0 ? (
              <div className="card" style={{ background: 'rgba(15, 27, 46, 0.95)', borderRadius: '24px', padding: '2.5rem 2rem', color: '#FFFFFF', border: '1.5px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 16px 45px rgba(0,0,0,0.6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CarFront size={54} color="#818CF8" style={{ marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#FFFFFF', marginBottom: '0.5rem' }}>Digital Pass Pending Vehicle Link</h4>
                <p style={{ fontSize: '0.92rem', color: '#CBD5E1', marginBottom: '1.5rem', maxWidth: '420px', lineHeight: '1.5' }}>
                  Welcome, <strong style={{ color: '#FFFFFF' }}>{profile?.name || 'Student'}</strong>! Your campus permit is active. Register your vehicle license plate to generate your official scannable entry QR pass.
                </p>
                <button className="btn btn-primary" onClick={() => setActiveTab('vehicles')} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none', padding: '0.85rem 1.6rem', fontWeight: '900', gap: '0.5rem', borderRadius: '14px' }}>
                  <Plus size={19} /> Register Vehicle & Activate QR Pass
                </button>
              </div>
            ) : (
              <div className="card" style={{ background: 'rgba(15, 27, 46, 0.95)', borderRadius: '26px', padding: '2rem', color: '#FFFFFF', border: '1.5px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 16px 45px rgba(0,0,0,0.6), 0 0 30px rgba(99, 102, 241, 0.18)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '1rem' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: '900', fontSize: '1.15rem', color: '#818CF8', letterSpacing: '0.8px', display: 'block' }}>PARKNEX DIGITAL CAMPUS PASS</span>
                    <span style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', fontWeight: '700', marginTop: '0.15rem' }}>Academic Semester Permit</span>
                  </div>
                  <span style={{ 
                    background: daysRemaining <= 0 ? 'rgba(239, 68, 68, 0.25)' : (daysRemaining <= 3 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'), 
                    color: daysRemaining <= 0 ? '#F87171' : (daysRemaining <= 3 ? '#FBBF24' : '#34D399'),
                    border: daysRemaining <= 0 ? '1.5px solid rgba(248, 113, 113, 0.6)' : (daysRemaining <= 3 ? '1.5px solid rgba(251, 191, 36, 0.6)' : '1.5px solid rgba(52, 211, 153, 0.6)'),
                    fontWeight: '900',
                    fontSize: '0.82rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '10px'
                  }}>
                    ● ACTIVE ({daysRemaining}d Left)
                  </span>
                </div>

                {/* HIGH CONTRAST MULTI-VEHICLE QR SWITCHER */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#CBD5E1', display: 'block', marginBottom: '0.75rem', fontWeight: '800' }}>
                    Select Vehicle to Display Scannable QR Code:
                  </span>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {vehicles.map(v => {
                      const isSel = passSelectedVehicle === v.plate;
                      return (
                        <button 
                          key={v.plate} 
                          onClick={() => setPassSelectedVehicle(v.plate)}
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: '800',
                            padding: '0.5rem 1rem',
                            borderRadius: '12px',
                            border: isSel ? '2px solid #818CF8' : '1.5px solid rgba(255, 255, 255, 0.18)',
                            background: isSel ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' : 'rgba(255, 255, 255, 0.08)',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            boxShadow: isSel ? '0 0 16px rgba(99, 102, 241, 0.6)' : 'none',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <span>{v.type === '2-Wheeler' ? '🏍️' : v.type === 'EV' ? '⚡' : '🚗'}</span>
                          <span>{v.plate}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SCANNABLE QR CODE CONTAINER */}
                <div style={{ margin: '0.75rem auto', background: '#FFFFFF', padding: '1rem', borderRadius: '22px', display: 'inline-flex', boxShadow: '0 12px 35px rgba(0,0,0,0.5)', border: '2px solid rgba(255, 255, 255, 0.4)' }}>
                  <RealScannableQRCode value={getVehicleQRPayload(passSelectedVehicle)} size={165} />
                </div>

                {/* USER NAME & PASS SERIAL (CRISP PURE WHITE FOR ABSOLUTE LEGIBILITY) */}
                <h4 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#FFFFFF', marginTop: '1rem', marginBottom: '0.25rem', letterSpacing: '0.3px' }}>
                  {profile?.name || userEmail.split('@')[0]}
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#A5B4FC', fontWeight: '800', marginBottom: '1.35rem' }}>
                  Pass Serial: {digitalPass?.passNumber || `PARKNEX-PASS-STU-${userEmail.split('@')[0].toUpperCase()}`}
                </p>

                {/* DETAILS GRID (HIGH CONTRAST GLASSMORPHIC CONTAINER) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255, 255, 255, 0.05)', padding: '1.25rem', borderRadius: '20px', textAlign: 'left', border: '1.5px solid rgba(255, 255, 255, 0.12)' }}>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Department</span>
                    <strong style={{ color: profile?.department ? '#FFFFFF' : '#FBBF24', fontSize: '0.95rem', fontWeight: '900' }}>{profile?.department || '⚠️ Not Set (Edit Profile)'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Academic Term</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: '900' }}>{profile?.academicTerm || '⚠️ Not Set (Edit Profile)'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Start Date</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: '900' }}>{passStartDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Valid Until</span>
                    <strong style={{ color: '#34D399', fontSize: '0.95rem', fontWeight: '900' }}>{passValidityDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Renewal Plan</span>
                    <strong style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: '900' }}>{passPlanDays === '1' ? 'Daily Plan (1 Day)' : passPlanDays === '180' ? 'Semester Plan (180 Days)' : 'Monthly Plan (30 Days)'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Active QR Vehicle</span>
                    <strong style={{ color: '#38BDF8', fontSize: '1rem', fontWeight: '900' }}>{passSelectedVehicle || (vehicles.length > 0 ? vehicles[0].plate : 'NONE')}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT CARD: TIER & STATEMENTS (HIGH CONTRAST) */}
            <div className="card" style={{ background: 'rgba(15, 27, 46, 0.95)', border: '1.5px solid rgba(255, 255, 255, 0.15)', borderRadius: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem', boxShadow: '0 16px 45px rgba(0,0,0,0.6)' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#FFFFFF' }}>
                  <CreditCard size={24} color="#818CF8" /> Campus Parking Tier & Receipts
                </h3>

                {/* ACTIVE SUBSCRIPTION BOX */}
                <div style={{ padding: '1.35rem', background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid rgba(52, 211, 153, 0.4)', borderRadius: '18px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: '900' }}>Active Student Subscription</strong>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.5)', fontWeight: '900' }}>100% Subsidized</span>
                  </div>
                  <p style={{ color: '#CBD5E1', fontSize: '0.88rem', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                    Your campus parking permit is subsidized under the University Student Transportation Grant. {daysRemaining} Days remaining before expiration.
                  </p>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: '900', color: '#FFFFFF', marginBottom: '1rem' }}>Recent Statement Receipts</h4>
                {receiptsList.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1.5px solid rgba(255,255,255,0.12)' }}>
                    <CreditCard size={32} color="#818CF8" style={{ opacity: 0.8, marginBottom: '0.5rem' }} />
                    <span style={{ display: 'block', color: '#FFFFFF', fontSize: '0.9rem', fontWeight: '800' }}>No Billing Invoices Yet</span>
                    <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Receipts for slot reservations and advance permit renewals will be recorded here.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '220px', overflowY: 'auto' }}>
                    {receiptsList.map(inv => (
                      <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.15rem', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', border: '1.5px solid rgba(255,255,255,0.12)' }}>
                        <div>
                          <strong style={{ display: 'block', color: '#FFFFFF', fontSize: '0.9rem', fontWeight: '800' }}>{inv.desc}</strong>
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: '600' }}>{inv.id} • {inv.date}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: '900', color: '#34D399', fontSize: '1rem' }}>{inv.amount}</span>
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.4)', fontWeight: '900', display: 'block', marginTop: '0.25rem' }}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: '0.6rem', background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)', color: '#FFFFFF', fontWeight: '900', padding: '0.9rem 1.5rem', borderRadius: '14px', border: 'none', boxShadow: '0 4px 20px rgba(236, 72, 153, 0.45)', cursor: 'pointer', fontSize: '0.95rem' }} onClick={handleDownloadPDFStatement}>
                  <Download size={19} /> Download Statement (PDF)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= 6. PARKING HISTORY TAB ================= */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History color="var(--primary)" size={24} /> Parking Session History & Logs
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Complete log of your previous campus parking bookings, entries, and exits
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ gap: '0.4rem', fontSize: '0.8rem' }} onClick={handleDownloadPDFStatement}>
                  <Download size={16} /> Export Statement PDF
                </button>
                <button className="btn btn-primary" onClick={() => setActiveTab('book')}>
                  + Book New Slot
                </button>
              </div>
            </div>

            {historyList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                <History size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Parking History Found</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Your completed and upcoming parking reservations will appear here.
                </p>
                <button className="btn btn-primary" onClick={() => setActiveTab('book')}>
                  Reserve a Parking Slot
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time Window</th>
                      <th>Zone & Slot</th>
                      <th>Vehicle Plate</th>
                      <th>Duration</th>
                      <th>Session Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((h, i) => (
                      <tr key={`history-${h.id || 'item'}-${i}`}>
                        <td><strong style={{ color: 'var(--text-main)' }}>{h.date}</strong></td>
                        <td style={{ color: 'var(--text-muted)' }}>{h.time}</td>
                        <td>
                          <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{h.slot}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{h.zone}</span>
                        </td>
                        <td><code style={{ background: 'rgba(255,255,255,0.04)', padding: '0.2rem 0.5rem', borderRadius: '6px', color: 'var(--text-main)' }}>{h.vehicle}</code></td>
                        <td style={{ color: 'var(--text-muted)' }}>{h.duration}</td>
                        <td>
                          {h.status === 'CONFIRMED' ? (
                            <button 
                              className="btn btn-outline" 
                              onClick={() => handleExitCampusGate(h)}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--primary)', color: 'var(--primary)', gap: '0.3rem' }}
                            >
                              <QrIcon size={14} /> Show Exit QR Pass
                            </button>
                          ) : (
                            <span className="badge badge-success" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                              {h.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADVANCE PERMIT RENEWAL PAYMENT MODAL */}
      {isAdvancePayModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAdvancePayModalOpen(false)}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', background: '#0F172A', border: '1.5px solid rgba(99, 102, 241, 0.45)', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.85)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
                <CreditCard color="#818CF8" size={24} /> Advance Permit Renewal
              </h3>
              <button onClick={() => setIsAdvancePayModalOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.4rem', borderRadius: '10px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.14)', border: '1.5px solid rgba(99,102,241,0.4)', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: '#A5B4FC', display: 'block', marginBottom: '0.25rem', fontWeight: '700' }}>CURRENT PERMIT VALIDITY</span>
                <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>Start: {passStartDate} • Valid Until: <span style={{ color: '#34D399' }}>{passValidityDate}</span> ({daysRemaining} Days Left)</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.65rem', color: '#CBD5E1' }}>Select Renewal Plan Option</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  <div 
                    onClick={() => setSelectedPayTier('DAILY')}
                    style={{ 
                      padding: '1.1rem', 
                      borderRadius: '16px', 
                      border: selectedPayTier === 'DAILY' ? '2px solid #818CF8' : '1.5px solid rgba(255, 255, 255, 0.15)', 
                      background: selectedPayTier === 'DAILY' ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.05)', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      boxShadow: selectedPayTier === 'DAILY' ? '0 0 16px rgba(99, 102, 241, 0.35)' : 'none'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', color: '#FFFFFF', fontSize: '0.95rem', fontWeight: '800' }}>🗓️ 1-Day Pass Renewal</strong>
                      <span style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem', display: 'block' }}>Valid for 1 Day from current expiry</span>
                    </div>
                    <span style={{ fontWeight: '900', color: '#34D399', fontSize: '1.1rem' }}>₹50.00</span>
                  </div>

                  <div 
                    onClick={() => setSelectedPayTier('MONTHLY')}
                    style={{ 
                      padding: '1.1rem', 
                      borderRadius: '16px', 
                      border: selectedPayTier === 'MONTHLY' || selectedPayTier === 'GRANT' ? '2px solid #818CF8' : '1.5px solid rgba(255, 255, 255, 0.15)', 
                      background: selectedPayTier === 'MONTHLY' || selectedPayTier === 'GRANT' ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.05)', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      boxShadow: (selectedPayTier === 'MONTHLY' || selectedPayTier === 'GRANT') ? '0 0 16px rgba(99, 102, 241, 0.35)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ display: 'block', color: '#FFFFFF', fontSize: '0.95rem', fontWeight: '800' }}>🗓️ Monthly Pass Renewal (30 Days)</strong>
                        <span style={{ background: '#4F46E5', color: '#fff', fontSize: '0.7rem', fontWeight: '900', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>POPULAR</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem', display: 'block' }}>Valid for 30 Days covering all campus zones</span>
                    </div>
                    <span style={{ fontWeight: '900', color: '#818CF8', fontSize: '1.1rem' }}>₹499.00</span>
                  </div>

                  <div 
                    onClick={() => setSelectedPayTier('SEMESTER')}
                    style={{ 
                      padding: '1.1rem', 
                      borderRadius: '16px', 
                      border: selectedPayTier === 'SEMESTER' ? '2px solid #A855F7' : '1.5px solid rgba(255, 255, 255, 0.15)', 
                      background: selectedPayTier === 'SEMESTER' ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255, 255, 255, 0.05)', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      boxShadow: selectedPayTier === 'SEMESTER' ? '0 0 16px rgba(168, 85, 247, 0.35)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ display: 'block', color: '#FFFFFF', fontSize: '0.95rem', fontWeight: '800' }}>🎓 Semester Pass Renewal (180 Days)</strong>
                        <span style={{ background: '#9333EA', color: '#fff', fontSize: '0.7rem', fontWeight: '900', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>BEST VALUE</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.2rem', display: 'block' }}>Full Academic Semester access with VIP EV Charging</span>
                    </div>
                    <span style={{ fontWeight: '900', color: '#C084FC', fontSize: '1.1rem' }}>₹1,499.00</span>
                  </div>

                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setIsAdvancePayModalOpen(false)} style={{ flex: 1, justifyContent: 'center', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', border: '1.5px solid rgba(255, 255, 255, 0.22)', padding: '0.85rem' }}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, justifyContent: 'center', gap: '0.6rem', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: '#FFFFFF', fontWeight: '900', boxShadow: '0 4px 18px rgba(99, 102, 241, 0.5)', padding: '0.85rem' }}
                onClick={async () => {
                  const planDays = selectedPayTier === 'DAILY' ? 1 : selectedPayTier === 'SEMESTER' ? 180 : 30;
                  const planTitle = selectedPayTier === 'DAILY' ? '1-Day Daily Quick Pass' : selectedPayTier === 'SEMESTER' ? '180-Day Semester All-Access Pass' : '30-Day Monthly Commuter Pass';
                  const amount = selectedPayTier === 'DAILY' ? '₹50.00' : selectedPayTier === 'SEMESTER' ? '₹1,499.00' : '₹499.00';

                  try {
                    const targetEmail = userEmail || 'student@college.edu';
                    const res = await axios.post(`${BACKEND_URL}/passes/renew`, {
                      email: targetEmail,
                      planDays,
                      planTitle,
                      amount,
                      vehiclePlate: passSelectedVehicle || vehicles[0]?.plate || 'KA-01-AB-1234',
                      paymentMethod: 'Online Campus Pay'
                    });

                    if (res.data?.success && res.data.pass) {
                      const updatedPass = res.data.pass;
                      setDigitalPass(updatedPass);
                      setPassValidityDate(updatedPass.formattedValidUntil);
                      setDaysRemaining(updatedPass.daysRemaining);
                      setPassStartDate(updatedPass.formattedValidFrom);

                      if (res.data.receipt) {
                        const newRec = {
                          id: res.data.receipt.invoiceId || res.data.receipt.id,
                          desc: res.data.receipt.planTitle,
                          amount: res.data.receipt.amount,
                          status: 'PAID',
                          date: new Date(res.data.receipt.issuedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                        };
                        setReceiptsList(prev => [newRec, ...prev]);
                      }

                      alert(`🎉 Pass Renewed Successfully!\n\nPlan: ${planTitle}\nValid Until: ${updatedPass.formattedValidUntil} (${updatedPass.daysRemaining} Days remaining)\nInvoice #: ${res.data.receipt?.invoiceId || 'Recorded'}\n\nRFID gate barrier auto-clearance extended!`);
                      setIsAdvancePayModalOpen(false);
                    } else {
                      throw new Error(res.data?.message || 'Renewal not acknowledged');
                    }
                  } catch (err) {
                    console.error('Renewal Error:', err);
                    alert(`Renewal encountered an error. Please check your connection and try again.`);
                  }
                }}
              >
                <Check size={18} /> Confirm Plan Renewal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMPUS EXIT GATE QR PASS MODAL (SECURITY AUTHORITY ONLY) */}
      {isExitModalOpen && exitSessionDetails && (
        <div className="modal-overlay" onClick={() => setIsExitModalOpen(false)}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <QrIcon color="var(--primary)" size={24} /> Campus Exit QR Pass
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Show this pass to Security Officer at the Exit Gate Barrier
                </span>
              </div>
              <button onClick={() => setIsExitModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '22px', display: 'inline-flex', margin: '0 auto 1.25rem', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '2px solid #e2e8f0' }}>
              <RealScannableQRCode 
                value={JSON.stringify({
                  type: 'EXIT_PASS',
                  bookingId: exitSessionDetails.id,
                  vehiclePlate: exitSessionDetails.vehicle,
                  plateNumber: exitSessionDetails.vehicle,
                  slotNumber: exitSessionDetails.slot,
                  zoneName: exitSessionDetails.zone,
                  studentName: profile?.name || userEmail.split('@')[0],
                  studentEmail: userEmail
                })} 
                size={160} 
              />
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(255, 255, 255, 0.14)', padding: '1.25rem', borderRadius: '18px', textAlign: 'left', fontSize: '0.88rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700' }}>Vehicle Plate:</span>
                <strong style={{ color: '#FFFFFF', fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.5px' }}>{exitSessionDetails.vehicle}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700' }}>Vacating Slot:</span>
                <strong style={{ color: '#818CF8', fontWeight: '900' }}>{exitSessionDetails.slot} ({exitSessionDetails.zone})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700' }}>Session Duration:</span>
                <strong style={{ color: '#FFFFFF', fontWeight: '800' }}>{exitSessionDetails.duration}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700' }}>Gate Barrier Control:</span>
                <strong style={{ color: '#34D399', fontWeight: '900' }}>OFFICER SCAN & RELEASE ONLY</strong>
              </div>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1.5px solid rgba(96, 165, 250, 0.4)', borderRadius: '14px', padding: '0.9rem', marginBottom: '1.25rem', textAlign: 'left', fontSize: '0.82rem', color: '#93C5FD', lineHeight: '1.45', fontWeight: '600' }}>
              🛡️ <strong style={{ color: '#FFFFFF' }}>Security Enforcement Notice:</strong> Gate barrier checkout is strictly controlled by Campus Security personnel. Present this QR screen to the officer on duty at the barrier gate.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '14px', color: '#34D399', fontWeight: '900', fontSize: '0.88rem', marginBottom: '1.25rem', border: '1.5px solid rgba(52, 211, 153, 0.45)' }}>
              <span className="animate-clock-pulse">⏳</span> Waiting for Security Officer to scan & release gate...
            </div>

            <button className="btn btn-outline" onClick={() => setIsExitModalOpen(false)} style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem', fontWeight: '800', color: '#E2E8F0', borderColor: 'rgba(255, 255, 255, 0.25)' }}>
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMED BY SECURITY POPUP MODAL */}
      {exitConfirmedModal && (
        <div className="modal-overlay" onClick={() => setExitConfirmedModal(null)}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', textAlign: 'center', border: '2px solid #10b981', background: 'rgba(15, 27, 46, 0.98)', color: '#FFFFFF' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '35px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)' }}>
              <CheckCircle size={44} color="#34D399" />
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#FFFFFF', marginBottom: '0.4rem' }}>
              Exit Verified & Gate Released!
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#CBD5E1', marginBottom: '1.5rem', fontWeight: '600' }}>
              Your vehicle exit has been officially verified by Campus Security. The gate barrier has opened.
            </p>

            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid rgba(255, 255, 255, 0.14)', borderRadius: '18px', padding: '1.25rem', textAlign: 'left', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700' }}>Vehicle Plate:</span>
                <strong style={{ color: '#FFFFFF', fontFamily: 'monospace', fontSize: '1rem' }}>{exitConfirmedModal.plate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700' }}>Released Slot:</span>
                <strong style={{ color: '#60A5FA', fontWeight: '900' }}>{exitConfirmedModal.slot} ({exitConfirmedModal.zone})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700' }}>Verified By:</span>
                <strong style={{ color: '#34D399', fontWeight: '900' }}>{exitConfirmedModal.releasedBy}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700' }}>Barrier Gate:</span>
                <strong style={{ color: '#34D399', fontWeight: '900' }}>🟢 RELEASED / OPENED</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8', fontWeight: '700' }}>Exit Time:</span>
                <strong style={{ color: '#FFFFFF', fontWeight: '800' }}>{exitConfirmedModal.releasedAt ? new Date(exitConfirmedModal.releasedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}</strong>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={() => setExitConfirmedModal(null)}
              style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', padding: '0.85rem', fontSize: '1rem', fontWeight: '900' }}
            >
              Got It • Safe Drive!
            </button>
          </div>
        </div>
      )}

      {/* REGISTER NEW VEHICLE MODAL */}
      {isAddVehicleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddVehicleModalOpen(false)}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CarFront color="var(--primary)" size={22} /> Register Vehicle
              </h3>
              <button onClick={() => setIsAddVehicleModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Vehicle Brand / Manufacturer</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Honda, Hyundai, Royal Enfield"
                  value={newVehicleForm.brand}
                  onChange={e => setNewVehicleForm({ ...newVehicleForm, brand: e.target.value })}
                  className="search-input"
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Vehicle Model</label>
                <input 
                  type="text" 
                  placeholder="e.g. Civic, Creta, Classic 350"
                  value={newVehicleForm.model}
                  onChange={e => setNewVehicleForm({ ...newVehicleForm, model: e.target.value })}
                  className="search-input"
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>License Plate Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. KA-01-AB-1234"
                  value={newVehicleForm.plateNumber}
                  onChange={e => setNewVehicleForm({ ...newVehicleForm, plateNumber: e.target.value })}
                  className="search-input"
                  style={{ paddingLeft: '1rem', textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Vehicle Color</label>
                  <input 
                    type="text" 
                    placeholder="e.g. White, Black, Red"
                    value={newVehicleForm.color}
                    onChange={e => setNewVehicleForm({ ...newVehicleForm, color: e.target.value })}
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Vehicle Type</label>
                  <select 
                    value={newVehicleForm.type}
                    onChange={e => setNewVehicleForm({ ...newVehicleForm, type: e.target.value })}
                    className="search-input"
                    style={{ paddingLeft: '1rem', color: 'var(--text-main)', backgroundColor: 'var(--bg-sidebar)' }}
                  >
                    <option value="4-Wheeler" style={{ backgroundColor: 'var(--bg-sidebar)' }}>4-Wheeler Car</option>
                    <option value="2-Wheeler" style={{ backgroundColor: 'var(--bg-sidebar)' }}>2-Wheeler Bike</option>
                    <option value="EV" style={{ backgroundColor: 'var(--bg-sidebar)' }}>Electric Vehicle (EV)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddVehicleModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI STUDENT CHATBOT DRAWER (CAMPUS INTELLIGENT ASSISTANT) */}
      {isChatOpen && (
        <div 
          className="card animate-fade-in" 
          style={{ 
            position: 'fixed', 
            bottom: '1.5rem', 
            right: '1.5rem', 
            width: '410px', 
            height: '570px', 
            maxWidth: 'calc(100vw - 2rem)', 
            maxHeight: 'calc(100vh - 3rem)', 
            zIndex: 9999, 
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 35px rgba(99, 102, 241, 0.3)', 
            border: '1px solid rgba(139, 92, 246, 0.45)', 
            borderRadius: '22px', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 0, 
            overflow: 'hidden',
            background: 'rgba(11, 17, 32, 0.98)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* DRAWER HEADER */}
          <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '1rem 1.25rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <Bot size={22} color="#FFFFFF" />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', fontWeight: '900', letterSpacing: '-0.01em', color: '#FFFFFF' }}>ParkNex AI Assistant</strong>
                <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#E0E7FF' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80', display: 'inline-block', boxShadow: '0 0 8px #4ADE80' }}></span>
                  Campus Intelligent Assistant • Ollama Live
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button 
                onClick={handleClearChat} 
                title="Clear Conversation"
                style={{ background: 'rgba(255, 255, 255, 0.12)', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <RefreshCw size={15} />
              </button>
              <button 
                onClick={() => setIsChatOpen(false)} 
                title="Close Assistant"
                style={{ background: 'rgba(255, 255, 255, 0.12)', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* QUICK PROMPT SUGGESTIONS CHIPS */}
          <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '0.4rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {chatSuggestions.slice(0, 10).map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(null, sug)}
                disabled={isChatLoading}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '20px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(129, 140, 248, 0.3)',
                  color: '#C7D2FE',
                  cursor: isChatLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  if (!isChatLoading) {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={e => {
                  if (!isChatLoading) {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                    e.currentTarget.style.color = '#C7D2FE';
                  }
                }}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* MESSAGES THREAD */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.06) 0%, #070b14 100%)' }}>
            {chatMessages.map((m, idx) => {
              const isAi = m.sender === 'ai';
              const msgId = m.id || `msg_${idx}`;
              const isSpeaking = speakingMsgId === msgId;
              return (
                <div 
                  key={msgId} 
                  style={{ 
                    alignSelf: isAi ? 'flex-start' : 'flex-end', 
                    maxWidth: '88%', 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div 
                    style={{ 
                      background: isAi ? 'rgba(30, 41, 59, 0.85)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                      color: '#F8FAFC', 
                      padding: '0.8rem 1rem', 
                      borderRadius: isAi ? '18px 18px 18px 4px' : '18px 18px 4px 18px', 
                      fontSize: '0.84rem', 
                      lineHeight: '1.45',
                      border: isAi ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: isAi ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 15px rgba(99, 102, 241, 0.35)',
                      position: 'relative'
                    }}
                  >
                    {/* Read-Aloud Voice Output Audio Toggle for AI messages */}
                    {isAi && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', paddingBottom: '0.35rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#818CF8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Bot size={13} color="#818CF8" /> ParkNex AI
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSpeakText(msgId, m.text)}
                          title={isSpeaking ? "Stop reading aloud" : "Read message aloud"}
                          style={{
                            background: isSpeaking ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                            border: isSpeaking ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: isSpeaking ? '#F87171' : '#94A3B8',
                            borderRadius: '6px',
                            padding: '0.2rem 0.45rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX size={12} color="#F87171" />
                              <span>Mute</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={12} color="#94A3B8" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {isAi ? renderFormattedChatMessage(m.text) : m.text}

                    {/* INTERACTIVE ACTION BUTTON (IF RECOMMENDED BY AI) */}
                    {isAi && m.actionPayload && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {m.actionPayload.type === 'BOOK_RECOMMENDED_SLOT' && (
                          <button
                            type="button"
                            onClick={() => handleChatAction(m.actionPayload)}
                            className="btn btn-primary"
                            style={{ 
                              fontSize: '0.76rem', 
                              padding: '0.45rem 0.85rem', 
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              border: 'none',
                              color: '#FFFFFF',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <Zap size={14} /> Reserve Slot {m.actionPayload.slotNumber} Now
                          </button>
                        )}
                        {m.actionPayload.type === 'VIEW_VEHICLE_LOCATION' && (
                          <button
                            type="button"
                            onClick={() => handleChatAction(m.actionPayload)}
                            className="btn"
                            style={{ 
                              fontSize: '0.76rem', 
                              padding: '0.45rem 0.85rem', 
                              borderRadius: '12px',
                              background: 'rgba(99, 102, 241, 0.2)',
                              border: '1px solid rgba(129, 140, 248, 0.4)',
                              color: '#FFFFFF',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <Compass size={14} color="#818CF8" /> Find My Vehicle
                          </button>
                        )}
                        {m.actionPayload.type === 'VIEW_PASS' && (
                          <button
                            type="button"
                            onClick={() => handleChatAction(m.actionPayload)}
                            className="btn"
                            style={{ 
                              fontSize: '0.76rem', 
                              padding: '0.45rem 0.85rem', 
                              borderRadius: '12px',
                              background: 'rgba(234, 179, 8, 0.15)',
                              border: '1px solid rgba(234, 179, 8, 0.4)',
                              color: '#FEF08A',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <QrIcon size={14} /> View Digital Pass
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748B', alignSelf: isAi ? 'flex-start' : 'flex-end', paddingLeft: isAi ? '0.4rem' : 0, paddingRight: isAi ? 0 : '0.4rem' }}>
                    {m.timestamp || ''}
                  </div>
                </div>
              );
            })}

            {/* AI THINKING LOADING INDICATOR */}
            {isChatLoading && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '85%', display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(30, 41, 59, 0.7)', padding: '0.75rem 1rem', borderRadius: '18px 18px 18px 4px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Bot size={17} color="#818CF8" className="animate-pulse" />
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>
                  ParkNex AI is analyzing campus telemetry...
                </span>
                <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '2px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#818CF8', animation: 'ping 1s infinite' }}></span>
                </span>
              </div>
            )}

            <div ref={chatMessagesEndRef} />
          </div>

          {/* INPUT FORM WITH VOICE MIC & SEND BUTTON */}
          <form 
            onSubmit={handleSendMessage} 
            style={{ 
              padding: '0.75rem 0.85rem', 
              borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
              background: 'rgba(15, 23, 42, 0.95)', 
              display: 'flex', 
              gap: '0.5rem',
              alignItems: 'center'
            }}
          >
            <input 
              type="text"
              placeholder="Ask where to park, predict rush, EV bays..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={isChatLoading}
              className="search-input"
              style={{ 
                flex: 1,
                padding: '0.65rem 0.95rem', 
                fontSize: '0.85rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF'
              }}
            />

            {/* Voice Input STT Mic Button */}
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={isChatLoading}
              title={isListening ? "Listening... Click to stop" : "Speak to ParkNex AI (Voice Input)"}
              style={{
                padding: '0.62rem',
                borderRadius: '12px',
                background: isListening 
                  ? 'rgba(239, 68, 68, 0.25)' 
                  : 'rgba(255, 255, 255, 0.08)',
                border: isListening 
                  ? '1.5px solid rgba(239, 68, 68, 0.8)' 
                  : '1px solid rgba(255, 255, 255, 0.15)',
                color: isListening ? '#EF4444' : '#CBD5E1',
                cursor: isChatLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isListening ? '0 0 14px rgba(239, 68, 68, 0.6)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isListening ? <MicOff size={16} color="#EF4444" /> : <Mic size={16} color="#CBD5E1" />}
            </button>

            <button 
              type="submit" 
              disabled={!chatInput.trim() || isChatLoading}
              className="btn btn-primary" 
              style={{ 
                padding: '0.65rem 0.95rem',
                borderRadius: '12px',
                background: (!chatInput.trim() || isChatLoading) ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#FFFFFF',
                cursor: (!chatInput.trim() || isChatLoading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: '700',
                fontSize: '0.82rem'
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* AI FIND MY VEHICLE MODAL */}
      {isFindVehicleModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFindVehicleModalOpen(false)}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass color="var(--primary)" size={24} /> AI Find My Vehicle
              </h3>
              <button onClick={() => setIsFindVehicleModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid var(--primary-hover)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Parked Vehicle</span>
                <code style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: '900' }}>{passSelectedVehicle || vehicles[0]?.plate || 'NO VEHICLE LINKED'}</code>
              </div>

              <h4 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                {vehicleLocation?.currentZone || 'KRISHNA HOSTEL'} — Slot {vehicleLocation?.slotNumber || 'K-30'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: '700', marginBottom: '1rem' }}>
                ● ParkedSafely • Entry: {vehicleLocation?.entryTime || '09:00 AM'} (2h 45m duration)
              </p>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Turn-by-Turn Walking Directions:</strong>
                <ol style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(vehicleLocation?.walkingDirections || [
                    'Exit Computer Science Academic Block Gate 1',
                    'Turn left towards Krishna Hostel Parking Courtyard',
                    'Walk 150 meters to Row K',
                    'Your vehicle is parked in Slot K-30'
                  ]).map((dir, i) => (
                    <li key={i}>{dir}</li>
                  ))}
                </ol>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setIsFindVehicleModalOpen(false)}>
              Got It
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
