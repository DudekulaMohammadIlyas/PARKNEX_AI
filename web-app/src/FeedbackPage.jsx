import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Filter, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  Shield, 
  Tag, 
  ChevronRight, 
  RefreshCw, 
  User, 
  Sparkles, 
  Trash2, 
  Check, 
  HelpCircle,
  Car,
  Cpu,
  DoorOpen,
  Smartphone,
  ShieldCheck,
  Lightbulb
} from 'lucide-react';
import axios from 'axios';

const CATEGORIES = [
  { id: 'PARKING_EXPERIENCE', label: 'Parking Experience', icon: Car, color: '#3B82F6' },
  { id: 'AI_RECOMMENDATIONS', label: 'AI Slot Guidance', icon: Cpu, color: '#8B5CF6' },
  { id: 'GATE_BARRIER', label: 'Gate Barrier & ANPR', icon: DoorOpen, color: '#10B981' },
  { id: 'APP_USABILITY', label: 'Portal Usability', icon: Smartphone, color: '#EC4899' },
  { id: 'FACILITY_SECURITY', label: 'Facility & Safety', icon: ShieldCheck, color: '#F59E0B' },
  { id: 'OTHER', label: 'Feature Request / Other', icon: Lightbulb, color: '#06B6D4' }
];

const PREDEFINED_TAGS = [
  'Fast Gate Clearance',
  'Accurate AI',
  'Clean Parking Bays',
  'More EV Bays Needed',
  'Clear Signage',
  'Lightning Fast Booking',
  'Helpful Security Staff',
  'App Bug Report',
  'Peak Hour Congestion'
];

const RATING_DESCRIPTIONS = {
  1: 'Poor — Needs urgent improvements',
  2: 'Below Average — Encountered difficulties',
  3: 'Satisfactory — Standard parking experience',
  4: 'Great — Very smooth and convenient',
  5: 'Exceptional — Flawless AI & gate clearance!'
};

export default function FeedbackPage({ userRole = 'STUDENT', profile = {}, BACKEND_URL = 'http://localhost:5000/api' }) {
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const effectiveEmail = profile?.email || (isAdmin ? 'admin@college.edu' : 'student@college.edu');
  const effectiveName = profile?.name || effectiveEmail.split('@')[0];

  // Tab State
  const [activeTab, setActiveTab] = useState(isAdmin ? 'inbox' : 'submit');

  // Submit Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('PARKING_EXPERIENCE');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Fast Gate Clearance', 'Accurate AI']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Data State
  const [feedbacks, setFeedbacks] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    averageRating: 5.0,
    satisfactionRate: 100,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    categoryCounts: {},
    statusCounts: { NEW: 0, UNDER_REVIEW: 0, RESOLVED: 0, DISMISSED: 0 }
  });
  const [loading, setLoading] = useState(false);

  // Filters State (for Admin Inbox)
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSentiment, setFilterSentiment] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Reply Modal State
  const [selectedFbForReply, setSelectedFbForReply] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('RESOLVED');
  const [isSavingReply, setIsSavingReply] = useState(false);

  // Load Feedbacks
  const fetchAllFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory !== 'ALL') params.append('category', filterCategory);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterSentiment !== 'ALL') params.append('sentiment', filterSentiment);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await axios.get(`${BACKEND_URL}/feedback?${params.toString()}`);
      if (res.data?.success) {
        setFeedbacks(res.data.feedbacks || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyFeedback = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/feedback/my-feedback?email=${encodeURIComponent(effectiveEmail)}`);
      if (res.data?.success) {
        setMyFeedbacks(res.data.feedbacks || []);
      }
    } catch (err) {
      console.error('Failed to load my feedback:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllFeedback();
    } else {
      fetchMyFeedback();
    }
  }, [isAdmin, filterCategory, filterStatus, filterSentiment, effectiveEmail]);

  // Handle Search Debounce
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setTimeout(() => {
      fetchAllFeedback();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Tag Toggle Handler
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Submit Feedback Handler
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setSubmitError('Please provide your feedback comments.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        rating,
        category,
        subject: subject.trim() || `${category.replace(/_/g, ' ')} Feedback`,
        comment: comment.trim(),
        tags: selectedTags,
        isAnonymous,
        userEmail: effectiveEmail,
        userName: effectiveName,
        userRole: userRole || 'STUDENT'
      };

      const res = await axios.post(`${BACKEND_URL}/feedback`, payload);
      if (res.data?.success) {
        setSubmitSuccess(true);
        // Refresh my feedback list
        fetchMyFeedback();
        // Reset form
        setRating(5);
        setSubject('');
        setComment('');
        setSelectedTags(['Fast Gate Clearance', 'Accurate AI']);
        setIsAnonymous(false);
      } else {
        setSubmitError(res.data?.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error || err.message || 'Error submitting feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Reply Handler
  const handleSendReply = async () => {
    if (!selectedFbForReply) return;
    setIsSavingReply(true);

    try {
      const res = await axios.put(`${BACKEND_URL}/feedback/${selectedFbForReply.id}/reply`, {
        status: replyStatus,
        adminReply: replyText.trim()
      });

      if (res.data?.success) {
        setSelectedFbForReply(null);
        setReplyText('');
        fetchAllFeedback();
      }
    } catch (err) {
      alert('Error updating feedback reply: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSavingReply(false);
    }
  };

  // Delete Feedback Handler
  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback entry?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/feedback/${id}`);
      fetchAllFeedback();
      fetchMyFeedback();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <span style={{ padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>● RESOLVED</span>;
      case 'UNDER_REVIEW':
        return <span style={{ padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.25)' }}>● UNDER REVIEW</span>;
      case 'DISMISSED':
        return <span style={{ padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800', background: 'rgba(100, 116, 139, 0.12)', color: '#64748B', border: '1px solid rgba(100, 116, 139, 0.25)' }}>● CLOSED</span>;
      default:
        return <span style={{ padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '800', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.25)' }}>● NEW</span>;
    }
  };

  const getSentimentBadge = (sentiment) => {
    if (sentiment === 'POSITIVE') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: '700', color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}><ThumbsUp size={11} /> Positive</span>;
    }
    if (sentiment === 'NEGATIVE') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: '700', color: '#EF4444', background: 'rgba(239, 68, 68, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}><ThumbsDown size={11} /> Critical</span>;
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: '700', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>Neutral</span>;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid rgba(37, 99, 235, 0.2)',
        borderRadius: '24px',
        padding: '2rem 2.5rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563EB, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
              <MessageSquare size={22} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
              {isAdmin ? 'Campus Feedback & Experience Command' : 'Feedback & Ratings Hub'}
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
            {isAdmin 
              ? 'Real-time student & staff ratings, AI satisfaction telemetry, and operational response desk.'
              : 'Help us enhance the ParkNex smart campus ecosystem. Rate your parking, AI guidance, and barrier clearance.'}
          </p>
        </div>

        {/* SATISFACTION SUMMARY PILL */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          background: 'var(--card-bg, #ffffff)',
          padding: '0.85rem 1.4rem',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Rating</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)' }}>{metrics.averageRating || '4.6'}</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    size={16} 
                    fill={star <= Math.round(metrics.averageRating || 5) ? '#F59E0B' : 'transparent'} 
                    color={star <= Math.round(metrics.averageRating || 5) ? '#F59E0B' : '#CBD5E1'} 
                  />
                ))}
              </div>
            </div>
          </div>
          <div style={{ width: '1px', height: '36px', background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Satisfaction</div>
            <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#10B981', marginTop: '0.2rem' }}>
              {metrics.satisfactionRate || 92}%
            </div>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        {isAdmin ? (
          <>
            <button
              onClick={() => setActiveTab('inbox')}
              style={{
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: activeTab === 'inbox' ? '#2563EB' : 'transparent',
                color: activeTab === 'inbox' ? '#FFFFFF' : 'var(--text-muted)',
                boxShadow: activeTab === 'inbox' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <MessageSquare size={16} /> User Feedback Inbox ({feedbacks.length})
            </button>
            <button
              onClick={() => setActiveTab('submit')}
              style={{
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: activeTab === 'submit' ? '#2563EB' : 'transparent',
                color: activeTab === 'submit' ? '#FFFFFF' : 'var(--text-muted)',
                boxShadow: activeTab === 'submit' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={16} /> Submit Internal Review
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { setActiveTab('submit'); setSubmitSuccess(false); }}
              style={{
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: activeTab === 'submit' ? '#2563EB' : 'transparent',
                color: activeTab === 'submit' ? '#FFFFFF' : 'var(--text-muted)',
                boxShadow: activeTab === 'submit' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={16} /> Share Your Feedback
            </button>
            <button
              onClick={() => { setActiveTab('history'); fetchMyFeedback(); }}
              style={{
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: activeTab === 'history' ? '#2563EB' : 'transparent',
                color: activeTab === 'history' ? '#FFFFFF' : 'var(--text-muted)',
                boxShadow: activeTab === 'history' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Clock size={16} /> My Submissions ({myFeedbacks.length})
            </button>
          </>
        )}
      </div>

      {/* ================= ADMIN INBOX VIEW ================= */}
      {isAdmin && activeTab === 'inbox' && (
        <div>
          {/* ANALYTICS KPI GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--card-bg, #ffffff)', padding: '1.4rem', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Submissions</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '0.4rem' }}>{metrics.total}</div>
              <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: '700', marginTop: '0.2rem' }}>Active campus records</div>
            </div>

            <div style={{ background: 'var(--card-bg, #ffffff)', padding: '1.4rem', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Campus Rating</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#F59E0B', marginTop: '0.4rem' }}>{metrics.averageRating} ★</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.2rem' }}>Out of 5.0 Stars</div>
            </div>

            <div style={{ background: 'var(--card-bg, #ffffff)', padding: '1.4rem', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Satisfaction Rate</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#10B981', marginTop: '0.4rem' }}>{metrics.satisfactionRate}%</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.2rem' }}>4 & 5-Star Reviews</div>
            </div>

            <div style={{ background: 'var(--card-bg, #ffffff)', padding: '1.4rem', borderRadius: '18px', border: '1px solid var(--border)', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Review</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#3B82F6', marginTop: '0.4rem' }}>{metrics.statusCounts?.NEW || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.2rem' }}>Awaiting operations reply</div>
            </div>
          </div>

          {/* FILTERS & SEARCH BAR */}
          <div style={{ background: 'var(--card-bg, #ffffff)', padding: '1.25rem 1.5rem', borderRadius: '18px', border: '1px solid var(--border)', marginBottom: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: '260px' }}>
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search feedback by keyword, user, or tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '600' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                style={{ padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', fontSize: '0.82rem', outline: 'none' }}
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', fontSize: '0.82rem', outline: 'none' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Closed</option>
              </select>

              {/* Sentiment Filter */}
              <select
                value={filterSentiment}
                onChange={e => setFilterSentiment(e.target.value)}
                style={{ padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', fontSize: '0.82rem', outline: 'none' }}
              >
                <option value="ALL">All Sentiments</option>
                <option value="POSITIVE">Positive (4-5★)</option>
                <option value="NEUTRAL">Neutral (3★)</option>
                <option value="NEGATIVE">Critical (1-2★)</option>
              </select>

              <button
                onClick={fetchAllFeedback}
                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '0.5rem 0.85rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}
                title="Refresh list"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {/* FEEDBACK CARDS LIST */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontWeight: '700' }}>Fetching feedback submissions...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--card-bg, #ffffff)', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <CheckCircle size={44} color="#10B981" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.5rem' }}>No feedback entries match your filter</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>All feedback tickets are addressed or match criteria returned zero records.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {feedbacks.map(fb => {
                const catObj = CATEGORIES.find(c => c.id === fb.category) || CATEGORIES[0];
                const CatIcon = catObj.icon;
                return (
                  <div
                    key={fb.id}
                    style={{
                      background: 'var(--card-bg, #ffffff)',
                      borderRadius: '20px',
                      padding: '1.5rem 1.75rem',
                      border: '1px solid var(--border)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                      borderLeft: `5px solid ${fb.rating >= 4 ? '#10B981' : fb.rating === 3 ? '#F59E0B' : '#EF4444'}`
                    }}
                  >
                    {/* TOP META ROW */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${catObj.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: catObj.color }}>
                          <CatIcon size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>{fb.userName}</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', background: 'var(--bg-main)', padding: '0.15rem 0.5rem', borderRadius: '6px', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              {fb.userRole || 'STUDENT'}
                            </span>
                            {fb.isAnonymous && (
                              <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(100, 116, 139, 0.1)', color: '#64748B', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                                Anonymous
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {fb.userEmail} • {new Date(fb.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={16}
                              fill={star <= fb.rating ? '#F59E0B' : 'transparent'}
                              color={star <= fb.rating ? '#F59E0B' : '#CBD5E1'}
                            />
                          ))}
                        </div>
                        {getSentimentBadge(fb.sentiment)}
                        {getStatusBadge(fb.status)}
                      </div>
                    </div>

                    {/* SUBJECT & COMMENT */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
                      {fb.subject}
                    </h3>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 1rem', whiteSpace: 'pre-line' }}>
                      {fb.comment}
                    </p>

                    {/* TAGS */}
                    {Array.isArray(fb.tags) && fb.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        {fb.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              color: '#475569',
                              background: 'var(--bg-main)',
                              padding: '0.2rem 0.65rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Tag size={10} color="#2563EB" /> {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* ADMIN REPLY BOX (IF PRESENT) */}
                    {fb.adminReply && (
                      <div style={{ background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.2)', borderRadius: '14px', padding: '1rem 1.25rem', marginTop: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <Shield size={16} color="#2563EB" />
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1D4ED8' }}>Official Operations Response:</span>
                          {fb.adminRepliedAt && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              ({new Date(fb.adminRepliedAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.5' }}>
                          "{fb.adminReply}"
                        </p>
                      </div>
                    )}

                    {/* ACTIONS ROW */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                      <button
                        onClick={() => {
                          setSelectedFbForReply(fb);
                          setReplyText(fb.adminReply || '');
                          setReplyStatus(fb.status || 'RESOLVED');
                        }}
                        style={{
                          background: '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.5rem 1.1rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
                        }}
                      >
                        <MessageSquare size={14} /> {fb.adminReply ? 'Edit Response' : 'Reply & Resolve'}
                      </button>

                      <button
                        onClick={() => handleDeleteFeedback(fb.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '0.5rem 0.9rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                        title="Delete feedback entry"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= SUBMIT FEEDBACK FORM VIEW ================= */}
      {activeTab === 'submit' && (
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          {submitSuccess ? (
            <div style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '24px', padding: '3rem 2rem', textAlign: 'center', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#10B981', border: '2px solid rgba(16, 185, 129, 0.3)' }}>
                <CheckCircle size={36} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                Thank You for Your Feedback!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
                Your review has been submitted to campus parking operations. If you provided your account details, you will be notified in your drawer when an admin replies.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  Submit Another Review
                </button>
                <button
                  onClick={() => setActiveTab(isAdmin ? 'inbox' : 'history')}
                  style={{ background: '#2563EB', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', color: '#FFFFFF', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
                >
                  View {isAdmin ? 'All Submissions' : 'My Past Reviews'} →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
              
              {/* STAR RATING PICKER */}
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Overall Campus Parking Experience
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        transition: 'transform 0.15s ease',
                        transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)'
                      }}
                      title={`${star} Star`}
                    >
                      <Star
                        size={38}
                        fill={(hoverRating || rating) >= star ? '#F59E0B' : 'transparent'}
                        color={(hoverRating || rating) >= star ? '#F59E0B' : '#CBD5E1'}
                        style={{ filter: (hoverRating || rating) >= star ? 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.4))' : 'none' }}
                      />
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: (hoverRating || rating) >= 4 ? '#10B981' : (hoverRating || rating) === 3 ? '#F59E0B' : '#EF4444' }}>
                  {RATING_DESCRIPTIONS[hoverRating || rating]}
                </div>
              </div>

              {/* CATEGORY SELECTOR */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Select Topic / Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  {CATEGORIES.map(cat => {
                    const CatIcon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        style={{
                          padding: '1rem',
                          borderRadius: '16px',
                          border: isSelected ? `2px solid ${cat.color}` : '1px solid var(--border)',
                          background: isSelected ? `${cat.color}10` : 'var(--bg-main)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? `0 4px 14px ${cat.color}25` : 'none'
                        }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color }}>
                          <CatIcon size={18} />
                        </div>
                        <span style={{ fontWeight: isSelected ? '800' : '600', fontSize: '0.88rem', color: isSelected ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {cat.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* QUICK TAGS */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.65rem' }}>
                  Experience Highlights (Tap to Tag)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {PREDEFINED_TAGS.map((tag, idx) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid #2563EB' : '1px solid var(--border)',
                          background: isSelected ? '#2563EB' : 'var(--bg-main)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected && <Check size={12} />} {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SUBJECT INPUT */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Headline / Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Instant gate opening at North Barrier / Love the AI slot suggestions"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* COMMENTS TEXTAREA */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Detailed Review & Suggestions <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your parking experience, any specific zone, ease of ANPR barrier entry, or suggestions for improving campus mobility..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* ANONYMOUS TOGGLE */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderRadius: '14px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border)',
                marginBottom: '2rem'
              }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>Submit Anonymously</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Hide your name and student email from operations display
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563EB' }}
                />
              </div>

              {/* ERROR MESSAGE */}
              {submitError && (
                <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#EF4444', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} /> {submitError}
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="spin" /> Submitting Review...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Submit Campus Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ================= STUDENT HISTORY VIEW ================= */}
      {!isAdmin && activeTab === 'history' && (
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          {myFeedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--card-bg, #ffffff)', borderRadius: '24px', border: '1px solid var(--border)' }}>
              <MessageSquare size={44} color="var(--primary, #2563EB)" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
                You haven't submitted any feedback yet
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                Share your campus parking experience, rate AI recommendations, or suggest improvements to help us optimize slot vacancy.
              </p>
              <button
                onClick={() => setActiveTab('submit')}
                style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
              >
                Submit Your First Review →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {myFeedbacks.map(fb => {
                const catObj = CATEGORIES.find(c => c.id === fb.category) || CATEGORIES[0];
                const CatIcon = catObj.icon;
                return (
                  <div
                    key={fb.id}
                    style={{
                      background: 'var(--card-bg, #ffffff)',
                      borderRadius: '20px',
                      padding: '1.5rem 1.75rem',
                      border: '1px solid var(--border)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                      borderLeft: `5px solid ${fb.rating >= 4 ? '#10B981' : fb.rating === 3 ? '#F59E0B' : '#EF4444'}`
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${catObj.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: catObj.color }}>
                          <CatIcon size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>{catObj.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={15}
                              fill={star <= fb.rating ? '#F59E0B' : 'transparent'}
                              color={star <= fb.rating ? '#F59E0B' : '#CBD5E1'}
                            />
                          ))}
                        </div>
                        {getStatusBadge(fb.status)}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.4rem' }}>
                      {fb.subject}
                    </h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 0.85rem' }}>
                      {fb.comment}
                    </p>

                    {/* ADMIN RESPONSE BANNER */}
                    {fb.adminReply && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', padding: '1rem 1.25rem', marginTop: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                          <ShieldCheck size={16} color="#10B981" />
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#047857' }}>Campus Operations Response:</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.5' }}>
                          "{fb.adminReply}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= ADMIN REPLY MODAL ================= */}
      {selectedFbForReply && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={() => setSelectedFbForReply(null)}>
          <div style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '24px', padding: '2rem', maxWidth: '580px', width: '100%', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="#2563EB" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                  Respond to User Feedback
                </h3>
              </div>
              <button onClick={() => setSelectedFbForReply(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '14px', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                {selectedFbForReply.userName} ({selectedFbForReply.rating}★ - {selectedFbForReply.category})
              </div>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {selectedFbForReply.subject}
              </div>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                "{selectedFbForReply.comment}"
              </p>
            </div>

            {/* STATUS CHANGER */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Update Ticket Status
              </label>
              <select
                value={replyStatus}
                onChange={e => setReplyStatus(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: '700', outline: 'none' }}
              >
                <option value="NEW">New (Unresolved)</option>
                <option value="UNDER_REVIEW">Under Review / Investigating</option>
                <option value="RESOLVED">Resolved / Addressed</option>
                <option value="DISMISSED">Dismissed / Closed</option>
              </select>
            </div>

            {/* REPLY MESSAGE */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Official Reply Message (Sent to User)
              </label>
              <textarea
                rows={4}
                placeholder="Write an operational reply. The student will receive a real-time notification on their device..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.88rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedFbForReply(null)}
                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '0.7rem 1.25rem', borderRadius: '12px', fontWeight: '700', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReply}
                disabled={isSavingReply}
                style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
              >
                {isSavingReply ? 'Saving...' : 'Send Reply & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
