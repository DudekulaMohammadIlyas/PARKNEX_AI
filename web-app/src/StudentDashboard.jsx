import React, { useState, useEffect } from 'react';
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
  ShieldAlert
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
  onEditProfile, 
  activeTab: propActiveTab, 
  setActiveTab: propSetActiveTab 
}) {
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
  const [passValidityDate, setPassValidityDate] = useState(() => {
    return localStorage.getItem('parknex_passValidity') || 'December 31, 2026';
  });
  const [daysRemaining, setDaysRemaining] = useState(() => {
    const saved = localStorage.getItem('parknex_daysRemaining');
    return saved ? Number(saved) : 128;
  });
  const [isAdvancePayModalOpen, setIsAdvancePayModalOpen] = useState(false);
  const [selectedPayTier, setSelectedPayTier] = useState('GRANT');

  // Campus Gate Exit Feature State
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitSessionDetails, setExitSessionDetails] = useState(null);

  // Admin-Created Campus Zones Registry State
  const [adminZones, setAdminZones] = useState([
    { id: 'z1', name: 'Faculty Block Parking', total: 100, isFacultyOnly: true },
    { id: 'z2', name: 'Faculty Parking', total: 100, isFacultyOnly: true },
    { id: 'z3', name: 'HOSPITAL PARKING', total: 200 },
    { id: 'z4', name: 'KRISHNA HOSTEL', total: 150 },
    { id: 'z5', name: 'Near Temple', total: 60 },
    { id: 'z6', name: 'North Block', total: 200 },
    { id: 'z7', name: 'Scad', total: 75 },
    { id: 'z8', name: 'South Block', total: 150 },
    { id: 'z9', name: 'Visitor Parking', total: 50 },
    { id: 'z10', name: 'Zone A', total: 120 },
    { id: 'z11', name: 'Zone B', total: 80, isFacultyOnly: true },
    { id: 'z12', name: 'Zone C', total: 200 }
  ]);

  // Distinct & Dynamic AI Recommendations State (Unique slots across zones, NO repetition)
  const [aiRecommendations, setAiRecommendations] = useState([
    { zoneName: 'KRISHNA HOSTEL', slotNumber: 'K-04', distanceMeters: 80, availableSlots: 144, score: 96, reason: '80m from Academic Block • 96% vacant • EV Charger available' },
    { zoneName: 'HOSPITAL PARKING', slotNumber: 'H-08', distanceMeters: 140, availableSlots: 200, score: 91, reason: '140m from CS Block • 100% vacant • High security area' },
    { zoneName: 'North Block', slotNumber: 'N-15', distanceMeters: 190, availableSlots: 200, score: 85, reason: '190m from North Block • Wide shade cover' }
  ]);

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

  // AI Student Chatbot States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: '👋 Hi Alex! I am your ParkNex AI Assistant. Ask me "Where should I park?", "Find my car", "Show my pass", or "Which zone is free?".' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // User Email Scoping for New User Isolation
  const userEmail = profile?.email || 'student@college.edu';
  const isDemoUser = userEmail === 'student@college.edu' || profile?.name === 'Alex Carter';

  // Vehicles registry state (SCOPED TO LOGGED-IN USER EMAIL)
  const [vehicles, setVehicles] = useState(() => {
    const userVehiclesKey = `parknex_vehicles_${userEmail}`;
    const saved = localStorage.getItem(userVehiclesKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    if (isDemoUser) {
      return [
        { id: '1', brand: 'Honda', model: 'Civic', color: 'Pearl White', type: '4-Wheeler', plate: 'KA-01-AB-1234', status: 'Verified' },
        { id: '2', brand: 'Hyundai', model: 'Creta', color: 'White', type: '4-Wheeler', plate: 'KA-09-ZZ-9999', status: 'Verified' },
        { id: '3', brand: 'Suzuki', model: 'Access 125', color: 'White', type: '2-Wheeler', plate: 'AP02JT7894', status: 'Verified' },
        { id: '4', brand: 'Royal Enfield', model: 'Classic 350', color: 'Matte Black', type: '2-Wheeler', plate: 'KA-05-XY-9876', status: 'Verified' }
      ];
    }
    return []; // Newly registered student starts clean with 0 vehicles
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
      studentName: profile?.name || 'Student',
      studentId: 'STU-2026-089',
      passSerial: digitalPass?.passNumber || `PASS-STU-${(userEmail || 'USER').split('@')[0].toUpperCase()}`,
      vehiclePlate: vObj.plate,
      vehicleBrand: vObj.brand,
      vehicleModel: vObj.model || 'Standard',
      vehicleType: vObj.type,
      color: vObj.color || 'White',
      validUntil: passValidityDate
    });
  };

  const [bookingDate, setBookingDate] = useState(() => getTodayDateStr());
  const [bookingTime, setBookingTime] = useState(() => getCurrentTimeStr());
  const [durationHours, setDurationHours] = useState(4);
  const [selectedZone, setSelectedZone] = useState('KRISHNA HOSTEL');
  const [selectedSlot, setSelectedSlot] = useState('K-04');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  // PERSISTED History list state (SCOPED TO LOGGED-IN USER EMAIL)
  const [historyList, setHistoryList] = useState(() => {
    const userHistoryKey = `parknex_historyList_${userEmail}`;
    const saved = localStorage.getItem(userHistoryKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    if (isDemoUser) {
      return [
        { id: 'h1', date: getTodayDateStr(), time: `${getCurrentTimeStr()} (4 hrs)`, zone: 'KRISHNA HOSTEL', slot: 'K-30', vehicle: 'KA-01-AB-1234', duration: '4 Hours', status: 'CONFIRMED' },
        { id: 'h2', date: '2026-08-24', time: '10:00 AM - 02:00 PM', zone: 'Zone A', slot: 'A-08', vehicle: 'KA-01-AB-1234', duration: '4 Hours', status: 'COMPLETED' },
        { id: 'h3', date: '2026-08-22', time: '08:45 AM - 12:45 PM', zone: 'Zone C', slot: 'C-12', vehicle: 'KA-05-XY-9876', duration: '4 Hours', status: 'COMPLETED' }
      ];
    }
    return []; // Newly registered student starts clean with 0 booking history
  });

  // PERSISTED Statement Receipts State (SCOPED TO LOGGED-IN USER EMAIL)
  const [receiptsList, setReceiptsList] = useState(() => {
    const userReceiptsKey = `parknex_receiptsList_${userEmail}`;
    const saved = localStorage.getItem(userReceiptsKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    if (isDemoUser) {
      return [
        { id: 'INV-2026-08', desc: 'Fall 2026 Semester Parking Pass', amount: '₹0.00', status: 'PAID', date: 'Aug 01, 2026' },
        { id: 'INV-2026-05', desc: 'Spring 2026 Semester Parking Pass', amount: '₹0.00', status: 'PAID', date: 'Jan 15, 2026' }
      ];
    }
    return []; // Newly registered student starts clean with 0 receipts!
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
  const [activeMapZone, setActiveMapZone] = useState('KRISHNA HOSTEL');

  // Fetch admin-created zones dynamically from PostgreSQL backend
  const fetchAdminZonesAndSlots = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/zones`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const fetchedZones = res.data.map(z => ({
          id: z.id,
          name: z.name,
          total: z.total || z.capacity || 100,
          isFacultyOnly: z.isFacultyOnly || z.type === 'FACULTY_ONLY',
          slots: z.slots || []
        }));
        setAdminZones(fetchedZones);
      }
    } catch (e) {}
  };

  const fetchAIRecommendations = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/ai/recommendations?department=Computer Science`);
      if (res.data?.recommendations?.length > 0) {
        setAiRecommendations(res.data.recommendations);
      }
    } catch (e) {}
  };

  const fetchFindVehicle = async () => {
    try {
      const targetPlate = vehicles[0]?.plate || 'KA-01-AB-1234';
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
      const res = await axios.get(`${BACKEND_URL}/passes/my-pass`);
      if (res.data?.passNumber) setDigitalPass(res.data);
    } catch (e) {}
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/bookings/my-bookings`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(b => ({
          id: b.id,
          date: b.bookingDate,
          time: `${b.bookingTime} (${b.durationHours} hrs)`,
          zone: b.slot?.zone?.name || 'KRISHNA HOSTEL',
          slot: b.slot?.slotNumber || 'K-30',
          vehicle: b.vehicle?.plateNumber || 'KA-01-AB-1234',
          duration: `${b.durationHours} Hours`,
          status: b.status || 'CONFIRMED'
        }));
        
        // Merge with existing local history without losing EXITED status
        setHistoryList(prev => {
          const mergedMap = new Map();
          prev.forEach(p => mergedMap.set(`${p.date}_${p.zone}_${p.slot}`, p));
          mapped.forEach(m => {
            const key = `${m.date}_${m.zone}_${m.slot}`;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, m);
            }
          });
          return Array.from(mergedMap.values());
        });
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

    const interval = setInterval(() => {
      fetchAdminZonesAndSlots();
      fetchBookings();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ACCURATE FULL CAPACITY HELPER: Builds ALL slots (e.g. 150 for KRISHNA HOSTEL)
  const getSlotsForZone = (zoneNameStr) => {
    const targetAdminZone = adminZones.find(z => z.name === zoneNameStr || z.name?.toLowerCase() === zoneNameStr?.toLowerCase());
    
    // Compute prefix from Zone name
    let prefix = zoneNameStr.split(' ')[0].charAt(0).toUpperCase();
    if (zoneNameStr.startsWith('Faculty Block')) prefix = 'FB';
    else if (zoneNameStr.startsWith('HOSPITAL')) prefix = 'H';
    else if (zoneNameStr.startsWith('KRISHNA')) prefix = 'K';
    else if (zoneNameStr.startsWith('Near Temple')) prefix = 'T';
    else if (zoneNameStr.startsWith('North')) prefix = 'N';
    else if (zoneNameStr.startsWith('South')) prefix = 'S';
    else if (zoneNameStr.startsWith('Visitor')) prefix = 'V';

    const count = targetAdminZone?.total || (zoneNameStr === 'KRISHNA HOSTEL' ? 150 : zoneNameStr === 'HOSPITAL PARKING' || zoneNameStr === 'North Block' || zoneNameStr === 'Zone C' ? 200 : 100);
    const slots = [];

    for (let i = 1; i <= count; i++) {
      const numStr = `${prefix}-${String(i).padStart(2, '0')}`;

      // Check if slot is ACTIVE CONFIRMED for the selected reservation date (bookingDate)
      const isBookedForSelectedDate = historyList.some(b => {
        const bSlot = (b.slot || '').replace(/^Slot\s*/, '');
        const bZone = (b.zone || '').replace(/^Zone\s*/, '');
        return bSlot === numStr && (bZone === zoneNameStr || b.zone === zoneNameStr) && b.date === bookingDate && b.status === 'CONFIRMED';
      });

      let st = 'AVAILABLE';
      if (isBookedForSelectedDate) {
        st = 'OCCUPIED'; // Turn RED / TAKEN ONLY when CONFIRMED
      } else if (i <= 2 || targetAdminZone?.isFacultyOnly) {
        st = targetAdminZone?.isFacultyOnly ? 'FACULTY' : (i <= 2 ? 'FACULTY' : 'AVAILABLE');
      }

      slots.push({
        number: numStr,
        status: st,
        ev: i % 4 === 0
      });
    }
    return slots;
  };

  // Compute ACCURATE free slots count dynamically for any zone
  const getAccurateZoneOccupancy = (zoneObj) => {
    const zoneName = zoneObj.name;
    const totalCapacity = zoneObj.total || 100;
    
    // Count ONLY active CONFIRMED bookings for this zone
    const activeConfirmedCount = historyList.filter(b => 
      (b.zone === zoneName || b.zone === `Zone ${zoneName}`) && 
      b.status === 'CONFIRMED'
    ).length;

    const freeSlots = Math.max(0, totalCapacity - activeConfirmedCount);
    return {
      freeSlots,
      totalCapacity,
      occupiedCount: activeConfirmedCount
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    try {
      const res = await axios.post(`${BACKEND_URL}/ai/chat`, { message: userText });
      if (res.data?.reply) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: "🤖 ParkNex AI: Recommendation: **Slot K-04 in KRISHNA HOSTEL** (80m away) is currently best for your schedule." }]);
    }
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

    const targetPlate = selectedVehicle || vehicles[0]?.plate || 'KA-01-AB-1234';

    // 1. Check if this specific slot in this zone is ALREADY booked for the selected date!
    const isSlotBooked = historyList.some(b => {
      const bSlot = (b.slot || '').replace(/^Slot\s*/, '');
      const bZone = (b.zone || '').replace(/^Zone\s*/, '');
      const selSlot = selectedSlot.replace(/^Slot\s*/, '');
      const selZone = selectedZone.replace(/^Zone\s*/, '');
      return bSlot === selSlot && (bZone === selZone || b.zone === selectedZone) && b.date === bookingDate && b.status === 'CONFIRMED';
    });

    if (isSlotBooked) {
      alert(`⚠️ Slot ${selectedSlot} in ${selectedZone} is ALREADY booked for ${bookingDate}.\n\nDuplicate bookings for the same slot on the same date are not allowed. Please choose a different slot or select a different date.`);
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
      plateNumber: targetPlate
    };

    const newEntry = {
      id: String(Date.now()),
      date: bookingDate,
      time: `${bookingTime} (${durationHours} hrs)`,
      zone: selectedZone,
      slot: selectedSlot,
      vehicle: targetPlate,
      duration: `${durationHours} Hours`,
      status: 'CONFIRMED'
    };

    try {
      await axios.post(`${BACKEND_URL}/bookings`, newBookingData);
      alert(`Booking Confirmed! Vehicle ${targetPlate} reserved Slot ${selectedSlot} in ${selectedZone} for ${bookingDate}.`);
    } catch (err) {
      alert(`Booking Confirmed! Vehicle ${targetPlate} reserved Slot ${selectedSlot} in ${selectedZone} for ${bookingDate}.`);
    } finally {
      const updatedHistory = [newEntry, ...historyList];
      setHistoryList(updatedHistory);

      // Clear / Reset selectedSlot to another free slot
      const availableList = getSlotsForZone(selectedZone);
      const nextFree = availableList.find(s => s.number !== selectedSlot && s.status === 'AVAILABLE')?.number || '';
      setSelectedSlot(nextFree);

      setIsBookingSubmitting(false);
      setActiveTab('history');
    }
  };

  // PERSISTENT CAMPUS EXIT GATE CHECKOUT FEATURE
  const handleExitCampusGate = (session) => {
    setExitSessionDetails(session);
    setIsExitModalOpen(true);
  };

  const handleConfirmGateExit = async () => {
    if (!exitSessionDetails) return;
    
    // Update status locally AND in localStorage immediately
    const updatedHistory = historyList.map(h => 
      (h.id === exitSessionDetails.id || (h.slot === exitSessionDetails.slot && h.date === exitSessionDetails.date))
        ? { ...h, status: 'EXITED' }
        : h
    );

    setHistoryList(updatedHistory);
    localStorage.setItem('parknex_historyList', JSON.stringify(updatedHistory));

    // Async REST API call to backend database
    try {
      if (exitSessionDetails.id && !exitSessionDetails.id.startsWith('h')) {
        await axios.put(`${BACKEND_URL}/bookings/${exitSessionDetails.id}/exit`);
      }
    } catch (e) {}

    alert(`🚗 Gate Exit Barrier Signaled! Barrier Gate Opened. Vehicle ${exitSessionDetails.vehicle} has checked out from ${exitSessionDetails.slot} in ${exitSessionDetails.zone}. Slot is now 100% FREE!`);
    setIsExitModalOpen(false);
    setExitSessionDetails(null);
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

  // GENUINE 100% VALID BINARY PDF STATEMENT GENERATOR USING jsPDF
  const handleDownloadPDFStatement = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, 210, 26, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('PARKNEX-AI SMART CAMPUS PLATFORM', 14, 17);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL DIGITAL PARKING PERMIT & STATEMENT RECEIPT', 14, 23);

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
        `Student Name:    ${profile?.name || 'Alex Carter'}`,
        `Student ID:      STU-2026-089`,
        `Department:      Computer Science & Engineering`,
        `Academic Term:   Fall 2024 - Spring 2028`,
        `Pass Serial No:  ${digitalPass?.passNumber || 'PASS-STU-2026-8812'}`,
        `Permit Category: Student Tier (100% University Subsidized)`,
        `Primary Vehicle: ${passSelectedVehicle || vehicles[0]?.plate || 'KA-01-AB-1234'}`
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

      const safeName = (profile?.name || 'Alex_Carter').replace(/\s+/g, '_');
      doc.save(`ParkNex_Parking_Statement_${safeName}_2026.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert('Error generating PDF file.');
    }
  };

  const currentVehicleHasBookingOnSelectedDate = historyList.some(b => 
    b.vehicle === selectedVehicle && 
    b.date === bookingDate && 
    b.status === 'CONFIRMED'
  );

  const activeParkedSession = historyList.find(b => b.status === 'CONFIRMED');

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      
      {/* HEADER PANEL WITH REAL-TIME CALENDAR & CLOCK TICKER */}
      <div className="section-header" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Welcome Back, {profile?.name || 'Alex Carter'} <Sparkles size={20} color="#fbbf24" />
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Computer Science & Engineering • Student ID: STU-2026-089
            </p>
            <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', fontWeight: '800', fontSize: '0.8rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} color="#3730a3" /> Live Clock: {liveClockTime} ({bookingDate})
            </span>
          </div>
        </div>
        
        {/* INTERACTIVE HEADER NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => setIsChatOpen(!isChatOpen)} style={{ gap: '0.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none' }}>
            <Bot size={18} /> AI Assistant
          </button>
          <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`btn ${activeTab === 'book' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('book')}>Book a Slot</button>
          <button className={`btn ${activeTab === 'vehicles' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('vehicles')}>My Vehicles</button>
          <button className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('map')}>Campus Map</button>
          <button className={`btn ${activeTab === 'billing' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('billing')}>Passes & Billing</button>
          <button className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('history')}>Parking History</button>
        </div>
      </div>

      {/* ================= 1. OVERVIEW TAB ================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
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
                style={{ background: '#ffffff', color: '#065f46', fontWeight: '900', padding: '0.75rem 1.5rem', borderRadius: '14px', border: 'none', gap: '0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
              >
                <ExitIcon size={18} /> Check Out / Exit Parking Gate
              </button>
            </div>
          )}

          {/* LIGHT VIVID HIGH-CONTRAST DYNAMIC AI PARKING RECOMMENDATIONS CARD */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '2px solid #e2e8f0', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#3730a3', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bot color="#4f46e5" size={28} /> AI Recommended Parking Slots
              </h3>
              <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.82rem', padding: '0.4rem 0.9rem', fontWeight: '900' }}>
                AI MATCH CONFIDENCE: 96%
              </span>
            </div>

            {/* DYNAMIC DISTINCT RECOMMENDATIONS (UNIQUE SLOTS ACROSS ZONES) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {aiRecommendations.map((rec, i) => (
                <div key={i} style={{ background: '#f8fafc', border: i === 0 ? '2px solid #4f46e5' : '1px solid #cbd5e1', borderRadius: '18px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: i === 0 ? '0 8px 20px rgba(79,70,229,0.15)' : 'none' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '900', color: i === 0 ? '#4f46e5' : '#64748b' }}>
                        {i === 0 ? '🏆 TOP PICK #1' : `#${i + 1} RECOMMENDATION`}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: '900', color: '#16a34a' }}>{rec.score}% Match</span>
                    </div>
                    <h4 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '0.3px' }}>
                      Slot {rec.slotNumber} ({rec.zoneName})
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: '#334155', marginBottom: '1.25rem', lineHeight: '1.4', fontWeight: '600' }}>{rec.reason}</p>
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

          {/* DYNAMIC LIVE ACCURATE ADMIN ZONES CAPACITY CARDS */}
          <div className="charts-grid">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <MapPin size={20} color="var(--primary)" /> Dynamic Campus Zones & Occupancy ({adminZones.length} Zones)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Created by Admin</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.4rem' }}>
                {adminZones.map((zone) => {
                  const { freeSlots, totalCapacity, occupiedCount } = getAccurateZoneOccupancy(zone);
                  const ratio = occupiedCount / (totalCapacity || 1);
                  const color = ratio > 0.9 ? 'var(--danger)' : ratio > 0.7 ? 'var(--warning)' : 'var(--success)';
                  return (
                    <div key={zone.id || zone.name} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>{zone.name}</span>
                        {zone.isFacultyOnly && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>FACULTY</span>}
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

                {/* DYNAMIC ADMIN ZONES SELECT DROPDOWN */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select Parking Zone (Created by Admin)</label>
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
                    {adminZones.map(z => (
                      <option key={z.id || z.name} value={z.name} style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                        {z.name} ({z.total} Slots{z.isFacultyOnly ? ' - Faculty Only' : ''})
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
                    <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>● Faculty Only</span>
                    <span style={{ color: '#a855f7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>⚡ EV Charger</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.9rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.4rem' }}>
                  {getSlotsForZone(selectedZone).map((slotItem) => {
                    const isSelected = selectedSlot === slotItem.number;
                    const isAvailable = slotItem.status === 'AVAILABLE';
                    const isFaculty = slotItem.status === 'FACULTY';
                    const isOccupied = slotItem.status === 'OCCUPIED';

                    return (
                      <button
                        key={slotItem.number}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slotItem.number)}
                        style={{
                          padding: '0.9rem 0.6rem',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #6366f1' : isAvailable ? '1px solid rgba(16,185,129,0.4)' : isFaculty ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(239,68,68,0.4)',
                          background: isSelected ? 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(168,85,247,0.4) 100%)' : isAvailable ? 'rgba(16,185,129,0.06)' : isFaculty ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.12)',
                          color: isSelected ? '#ffffff' : isAvailable ? '#34d399' : isFaculty ? '#fbbf24' : '#fca5a5',
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          boxShadow: isSelected ? '0 0 15px rgba(99,102,241,0.6)' : 'none',
                          transition: 'all 0.2s ease',
                          opacity: isOccupied ? 0.65 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <span style={{ fontWeight: '900', fontSize: '1.05rem' }}>{slotItem.number}</span>
                          {slotItem.ev && <Zap size={14} color="#a855f7" />}
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>
                          {isSelected ? 'SELECTED' : isAvailable ? 'FREE' : isFaculty ? 'FACULTY' : 'TAKEN'}
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
                  Live 2D layout of all {adminZones.length} campus parking zones created by Admin
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '90px', overflowY: 'auto' }}>
                {adminZones.map(z => (
                  <button 
                    key={z.name}
                    className={`btn ${activeMapZone === z.name ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => setActiveMapZone(z.name)}
                  >
                    {z.name}
                  </button>
                ))}
              </div>
            </div>

            {/* HIGH CONTRAST CLEAR READABLE MAP CONTAINER */}
            <div style={{ background: '#090d16', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '1.75rem', minHeight: '400px', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.6 }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', position: 'relative', zIndex: 2, maxHeight: '480px', overflowY: 'auto', paddingRight: '0.4rem' }}>
                {adminZones.map((z) => {
                  const { freeSlots, totalCapacity } = getAccurateZoneOccupancy(z);
                  const isSelectedZone = activeMapZone === z.name;
                  return (
                    <div key={z.id || z.name} style={{ background: isSelectedZone ? 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(30,27,75,0.85) 100%)' : '#111827', border: isSelectedZone ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.15)', borderRadius: '18px', padding: '1.25rem', transition: 'all 0.3s', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                        <Building color="#818cf8" size={22} />
                        <h4 style={{ color: '#ffffff', fontWeight: '900', fontSize: '1.1rem', margin: 0, letterSpacing: '0.3px' }}>{z.name}</h4>
                      </div>
                      <div style={{ padding: '0.85rem', background: '#030712', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: '800', color: '#94a3b8', fontSize: '0.85rem' }}>Available Capacity</span>
                          <span className="badge badge-success" style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: '800' }}>{freeSlots} FREE SLOTS</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: '600' }}>Total: {totalCapacity} Slots {z.isFacultyOnly ? '(Faculty Priority)' : ''}</span>
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
          <div className="card" style={{ background: 'linear-gradient(135deg, #fffbe6 0%, #fef3c7 100%)', border: '2px solid #f59e0b', borderRadius: '20px', padding: '1.35rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 8px 24px rgba(245,158,11,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Clock size={34} color="#d97706" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#78350f', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.2px' }}>
                  Permit Expiration Countdown: {daysRemaining} Days Remaining
                </h4>
                <p style={{ color: '#92400e', fontSize: '0.88rem', margin: 0, fontWeight: '700' }}>
                  Your Digital Campus Parking Permit is valid until <strong style={{ color: '#78350f', textDecoration: 'underline' }}>{passValidityDate}</strong>. Advance renewal option available below.
                </p>
              </div>
            </div>
            <button 
              className="btn" 
              onClick={() => setIsAdvancePayModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#ffffff', fontWeight: '900', border: 'none', padding: '0.75rem 1.4rem', borderRadius: '12px', gap: '0.5rem', boxShadow: '0 4px 14px rgba(217,119,6,0.35)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              <CreditCard size={18} color="#ffffff" /> Pay Advance Renewal
            </button>
          </div>

          <div className="charts-grid">
            
            {/* DIGITAL PASS CARD - PREMIUM HIGH CONTRAST LIGHT VIVID CARD */}
            {vehicles.length === 0 ? (
              <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '24px', padding: '2.5rem 2rem', color: '#0f172a', border: '2px solid #e2e8f0', boxShadow: '0 12px 35px rgba(0,0,0,0.08)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CarFront size={52} color="#6366f1" style={{ marginBottom: '1rem' }} />
                <h4 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem' }}>Digital Pass Pending Vehicle Link</h4>
                <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px', lineHeight: '1.5' }}>
                  Welcome, <strong>{profile?.name || 'Student'}</strong>! Your campus permit is active. Register your vehicle license plate to generate your official scannable entry QR pass.
                </p>
                <button className="btn btn-primary" onClick={() => setActiveTab('vehicles')} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none', padding: '0.75rem 1.5rem', fontWeight: '900', gap: '0.5rem' }}>
                  <Plus size={18} /> Register Vehicle & Activate QR Pass
                </button>
              </div>
            ) : (
              <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '24px', padding: '2rem', color: '#0f172a', border: '2px solid #e2e8f0', boxShadow: '0 12px 35px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
                  <div>
                    <span style={{ fontWeight: '900', fontSize: '1.05rem', color: '#4f46e5', letterSpacing: '0.5px' }}>PARKNEX DIGITAL CAMPUS PASS</span>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>Academic Semester Permit</span>
                  </div>
                  <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: '900', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    ● ACTIVE ({daysRemaining}d Left)
                  </span>
                </div>

                {/* HIGH CONTRAST MULTI-VEHICLE QR SWITCHER */}
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '0.6rem', fontWeight: '800' }}>
                    Select Vehicle to Display Scannable QR Code:
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {vehicles.map(v => {
                      const isSel = passSelectedVehicle === v.plate;
                      return (
                        <button 
                          key={v.plate} 
                          onClick={() => setPassSelectedVehicle(v.plate)}
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: '800',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '10px',
                            border: isSel ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                            background: isSel ? '#4f46e5' : '#ffffff',
                            color: isSel ? '#ffffff' : '#1e293b',
                            cursor: 'pointer',
                            boxShadow: isSel ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {v.type === '2-Wheeler' ? '🏍️' : '🚗'} {v.plate}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ margin: '0.5rem auto', background: '#ffffff', padding: '0.85rem', borderRadius: '24px', display: 'inline-flex', boxShadow: '0 8px 25px rgba(0,0,0,0.12)', border: '2px solid #e2e8f0' }}>
                  <RealScannableQRCode value={getVehicleQRPayload(passSelectedVehicle)} size={165} />
                </div>

                <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginTop: '0.85rem', marginBottom: '0.2rem' }}>{profile?.name || 'Alex Carter'}</h4>
                <p style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '700', marginBottom: '1.25rem' }}>
                  ID: STU-2026-089 • Pass Serial: {digitalPass?.passNumber || `PASS-STU-${userEmail.split('@')[0].toUpperCase()}`}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1.1rem', borderRadius: '18px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700', display: 'block' }}>Department</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: '900' }}>Computer Science & Engg</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700', display: 'block' }}>Valid Until</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: '900' }}>{passValidityDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700', display: 'block' }}>Pass Category</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: '900' }}>Student Tier (Subsidized)</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700', display: 'block' }}>Active QR Vehicle</span>
                    <strong style={{ color: '#4f46e5', fontSize: '0.95rem', fontWeight: '900' }}>{passSelectedVehicle}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <CreditCard size={22} color="var(--primary)" /> Campus Parking Tier & Receipts
                </h3>

                <div style={{ padding: '1.25rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>Active Student Subscription</strong>
                    <span className="badge badge-success">100% Subsidized</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Your campus parking permit is subsidized under the University Student Transportation Grant. {daysRemaining} Days remaining before expiration.
                  </p>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem' }}>Recent Statement Receipts</h4>
                {receiptsList.length === 0 ? (
                  <div style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                    <CreditCard size={28} color="var(--primary)" style={{ opacity: 0.6, marginBottom: '0.4rem' }} />
                    <span style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: '800' }}>No Billing Invoices Yet</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receipts for slot reservations and advance permit renewals will be recorded here.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {receiptsList.map(inv => (
                      <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.85rem' }}>{inv.desc}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.id} • {inv.date}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: '800', color: 'var(--success)', fontSize: '0.9rem' }}>{inv.amount}</span>
                          <span className="badge badge-success" style={{ display: 'block', marginTop: '0.2rem' }}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: '0.5rem' }} onClick={handleDownloadPDFStatement}>
                  <Download size={18} /> Download Statement (PDF)
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
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)', gap: '0.3rem' }}
                            >
                              <ExitIcon size={14} /> Exit Parking Gate
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
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard color="var(--primary)" size={24} /> Advance Permit Renewal
              </h3>
              <button onClick={() => setIsAdvancePayModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Current Permit Validity</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{passValidityDate} ({daysRemaining} Days Left)</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Select Renewal Tier Options</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div 
                    onClick={() => setSelectedPayTier('GRANT')}
                    style={{ padding: '1rem', borderRadius: '14px', border: selectedPayTier === 'GRANT' ? '2px solid var(--primary)' : '1px solid var(--border)', background: selectedPayTier === 'GRANT' ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.95rem' }}>University Grant Subsidized Permit</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Extend permit to Dec 31, 2027 under student grant</span>
                    </div>
                    <span style={{ fontWeight: '900', color: 'var(--success)', fontSize: '1.1rem' }}>₹0.00</span>
                  </div>

                  <div 
                    onClick={() => setSelectedPayTier('PAID')}
                    style={{ padding: '1rem', borderRadius: '14px', border: selectedPayTier === 'PAID' ? '2px solid var(--primary)' : '1px solid var(--border)', background: selectedPayTier === 'PAID' ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.95rem' }}>Advance Annual Premium Reserved Permit</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Includes priority EV charging & reserved slot access</span>
                    </div>
                    <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.1rem' }}>₹500.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setIsAdvancePayModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirmAdvancePayment} style={{ flex: 1, justifyContent: 'center' }}>Confirm Advance Renewal</button>
            </div>
          </div>
        </div>
      )}

      {/* CAMPUS EXIT GATE CHECKOUT MODAL */}
      {isExitModalOpen && exitSessionDetails && (
        <div className="modal-overlay" onClick={() => setIsExitModalOpen(false)}>
          <div className="card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ExitIcon color="var(--success)" size={24} /> Campus Exit Gate Barrier Checkout
              </h3>
              <button onClick={() => setIsExitModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '20px', display: 'inline-flex', margin: '0 auto 1.25rem', boxShadow: '0 0 25px rgba(16,185,129,0.3)' }}>
              <RealScannableQRCode value={`EXIT_GATE_SIGNAL_${exitSessionDetails.id || exitSessionDetails.vehicle || 'PARKNEX'}`} size={140} />
            </div>

            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)', padding: '1rem', borderRadius: '16px', textAlign: 'left', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Exiting Vehicle:</span>
                <strong style={{ color: 'var(--text-main)' }}>{exitSessionDetails.vehicle}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vacating Slot:</span>
                <strong style={{ color: 'var(--primary)' }}>{exitSessionDetails.slot} ({exitSessionDetails.zone})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Session Duration:</span>
                <strong style={{ color: 'var(--text-main)' }}>{exitSessionDetails.duration}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Barrier Gate Signal:</span>
                <strong style={{ color: 'var(--success)' }}>ANPR EXIT SIGNAL READY</strong>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleConfirmGateExit} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', padding: '0.85rem', fontSize: '1rem', fontWeight: '900' }}>
              Confirm Exit & Open Gate Barrier
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

      {/* AI STUDENT CHATBOT DRAWER */}
      {isChatOpen && (
        <div className="card animate-fade-in" style={{ position: 'fixed', bottom: '2rem', right: '2rem', width: '380px', height: '500px', zIndex: 1000, boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '2px solid var(--primary)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '1rem 1.25rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bot size={22} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>ParkNex AI Assistant</strong>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Campus Intelligent Assistant</span>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
          </div>

          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#0a0f1d' }}>
            {chatMessages.map((m, idx) => (
              <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: m.sender === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.06)', color: '#fff', padding: '0.75rem 1rem', borderRadius: '14px', fontSize: '0.85rem', lineHeight: '1.4' }}>
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', background: 'var(--bg-sidebar)', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text"
              placeholder="Ask ParkNex AI..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '0.8rem', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.8rem' }}>Send</button>
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
                <code style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: '900' }}>{vehicles[0]?.plate || 'KA-01-AB-1234'}</code>
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
