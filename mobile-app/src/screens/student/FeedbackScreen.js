import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
  RefreshControl,
  StyleSheet
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config, { smartApiRequest } from '../../../config';
import { globalStyles as styles } from '../../theme/styles';
import { COLORS } from '../../theme/colors';

const CATEGORIES = [
  { id: 'PARKING_EXPERIENCE', label: 'Parking Experience', icon: 'car-outline', color: '#2563EB' },
  { id: 'AI_RECOMMENDATIONS', label: 'AI Slot Guidance', icon: 'bulb-outline', color: '#8B5CF6' },
  { id: 'GATE_BARRIER', label: 'Gate Barrier / ANPR', icon: 'barcode-outline', color: '#10B981' },
  { id: 'APP_USABILITY', label: 'App Usability', icon: 'phone-portrait-outline', color: '#EC4899' },
  { id: 'FACILITY_SECURITY', label: 'Facility Safety', icon: 'shield-checkmark-outline', color: '#F59E0B' },
  { id: 'OTHER', label: 'Other Suggestions', icon: 'chatbubbles-outline', color: '#06B6D4' }
];

const PREDEFINED_TAGS = [
  'Fast Gate',
  'Accurate AI',
  'Clean Parking Bays',
  'More EV Bays Needed',
  'Clear Signage',
  'Smooth Booking',
  'Helpful Staff',
  'Peak Hour Crowding'
];

const RATING_LABELS = {
  1: 'Poor — Needs urgent improvements',
  2: 'Below Average — Encountered issues',
  3: 'Satisfactory — Standard parking',
  4: 'Great — Very smooth & convenient',
  5: 'Exceptional — Flawless AI & clearance!'
};

export default function FeedbackScreen({ navigation, route, user }) {
  const routeUser = route?.params?.user || user;
  const userRole = (route?.params?.userRole || routeUser?.role || 'STUDENT').toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const userEmail = routeUser?.email || (isAdmin ? 'admin@college.edu' : 'student@college.edu');
  const userName = routeUser?.name || userEmail.split('@')[0];

  // Active Tab
  const [activeTab, setActiveTab] = useState(isAdmin ? 'inbox' : 'submit');

  // Submission Form State
  const [rating, setRating] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('PARKING_EXPERIENCE');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Fast Gate', 'Accurate AI']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessModal, setSubmitSuccessModal] = useState(false);

  // Data State
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [adminFeedbacks, setAdminFeedbacks] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    averageRating: 5.0,
    satisfactionRate: 100,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Admin Reply State
  const [selectedFbForReply, setSelectedFbForReply] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('RESOLVED');
  const [isSavingReply, setIsSavingReply] = useState(false);

  // Fetch Feedback Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAdmin) {
        const res = await smartApiRequest('get', '/feedback');
        if (res.data?.success) {
          setAdminFeedbacks(res.data.feedbacks || []);
          if (res.data.metrics) setMetrics(res.data.metrics);
        }
      } else {
        const res = await smartApiRequest('get', `/feedback/my-feedback?email=${encodeURIComponent(userEmail)}`);
        if (res.data?.success) {
          setMyFeedbacks(res.data.feedbacks || []);
        }
      }
    } catch (err) {
      console.warn('Error fetching feedback:', err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, userEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Submit Feedback Handler
  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Required Field', 'Please enter your feedback comments before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rating,
        category: selectedCategory,
        subject: subject.trim() || `${selectedCategory.replace(/_/g, ' ')} Feedback`,
        comment: comment.trim(),
        tags: selectedTags,
        isAnonymous,
        userEmail,
        userName,
        userRole
      };

      const res = await smartApiRequest('post', '/feedback', payload);
      if (res.data?.success) {
        setSubmitSuccessModal(true);
        // Reset form
        setRating(5);
        setSubject('');
        setComment('');
        setSelectedTags(['Fast Gate', 'Accurate AI']);
        setIsAnonymous(false);
        loadData();
      } else {
        Alert.alert('Submission Error', res.data?.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      Alert.alert('Network Error', err.response?.data?.error || 'Could not connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Reply Handler
  const handleSaveReply = async () => {
    if (!selectedFbForReply) return;
    setIsSavingReply(true);

    try {
      const res = await smartApiRequest('put', `/feedback/${selectedFbForReply.id}/reply`, {
        status: replyStatus,
        adminReply: replyText.trim()
      });

      if (res.data?.success) {
        setSelectedFbForReply(null);
        setReplyText('');
        loadData();
        Alert.alert('Reply Sent', 'Your operational response has been posted and notified to the student.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not save reply.');
    } finally {
      setIsSavingReply(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <View style={[localStyles.badge, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
            <Text style={{ color: '#15803D', fontSize: 10, fontWeight: '900' }}>● RESOLVED</Text>
          </View>
        );
      case 'UNDER_REVIEW':
        return (
          <View style={[localStyles.badge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Text style={{ color: '#B45309', fontSize: 10, fontWeight: '900' }}>● UNDER REVIEW</Text>
          </View>
        );
      case 'DISMISSED':
        return (
          <View style={[localStyles.badge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
            <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '900' }}>● CLOSED</Text>
          </View>
        );
      default:
        return (
          <View style={[localStyles.badge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Text style={{ color: '#1D4ED8', fontSize: 10, fontWeight: '900' }}>● NEW</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      
      {/* HEADER BAR */}
      <View style={localStyles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={localStyles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={localStyles.headerTitle}>
            {isAdmin ? 'Feedback Desk' : 'Feedback & Ratings'}
          </Text>
          <Text style={localStyles.headerSubtitle}>
            {isAdmin ? 'Student Telemetry & Responses' : 'Campus Parking Experience'}
          </Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={localStyles.iconBtn} activeOpacity={0.7}>
          <Feather name="refresh-cw" size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* TOP TAB SWITCHER */}
      <View style={localStyles.tabSwitcherContainer}>
        {isAdmin ? (
          <>
            <TouchableOpacity
              style={[localStyles.tabBtn, activeTab === 'inbox' && localStyles.tabBtnActive]}
              onPress={() => setActiveTab('inbox')}
              activeOpacity={0.8}
            >
              <Ionicons name="mail-unread-outline" size={16} color={activeTab === 'inbox' ? '#fff' : '#64748B'} />
              <Text style={[localStyles.tabBtnText, activeTab === 'inbox' && localStyles.tabBtnTextActive]}>
                Inbox ({adminFeedbacks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.tabBtn, activeTab === 'submit' && localStyles.tabBtnActive]}
              onPress={() => setActiveTab('submit')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color={activeTab === 'submit' ? '#fff' : '#64748B'} />
              <Text style={[localStyles.tabBtnText, activeTab === 'submit' && localStyles.tabBtnTextActive]}>
                Submit Review
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[localStyles.tabBtn, activeTab === 'submit' && localStyles.tabBtnActive]}
              onPress={() => setActiveTab('submit')}
              activeOpacity={0.8}
            >
              <Ionicons name="star-outline" size={16} color={activeTab === 'submit' ? '#fff' : '#64748B'} />
              <Text style={[localStyles.tabBtnText, activeTab === 'submit' && localStyles.tabBtnTextActive]}>
                Rate Experience
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[localStyles.tabBtn, activeTab === 'history' && localStyles.tabBtnActive]}
              onPress={() => { setActiveTab('history'); loadData(); }}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={16} color={activeTab === 'history' ? '#fff' : '#64748B'} />
              <Text style={[localStyles.tabBtnText, activeTab === 'history' && localStyles.tabBtnTextActive]}>
                My Submissions ({myFeedbacks.length})
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >

        {/* ================= 1. SUBMIT FEEDBACK TAB ================= */}
        {activeTab === 'submit' && (
          <View>
            
            {/* HERO CARD: STAR RATING */}
            <View style={localStyles.card}>
              <Text style={localStyles.sectionTitle}>How was your parking session?</Text>
              <Text style={localStyles.sectionSubtitle}>
                Rate your overall campus entry, slot navigation, and barrier speed.
              </Text>

              {/* STAR ICONS */}
              <View style={localStyles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                    style={{ padding: 6 }}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={localStyles.ratingDescriptionPill}>
                <Text style={[localStyles.ratingDescriptionText, { color: rating >= 4 ? '#059669' : rating === 3 ? '#D97706' : '#DC2626' }]}>
                  {RATING_LABELS[rating]}
                </Text>
              </View>
            </View>

            {/* CATEGORY SELECTOR */}
            <View style={[localStyles.card, { marginTop: 14 }]}>
              <Text style={localStyles.fieldLabel}>Select Topic / Category</Text>
              <View style={localStyles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        localStyles.categoryCard,
                        isSelected && { borderColor: cat.color, backgroundColor: `${cat.color}12` }
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={20}
                        color={isSelected ? cat.color : '#64748B'}
                      />
                      <Text
                        style={[
                          localStyles.categoryText,
                          isSelected && { color: cat.color, fontWeight: '900' }
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* TAGS SELECTOR */}
            <View style={[localStyles.card, { marginTop: 14 }]}>
              <Text style={localStyles.fieldLabel}>Highlights (Tap to Select)</Text>
              <View style={localStyles.tagsContainer}>
                {PREDEFINED_TAGS.map((tag, idx) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        localStyles.tagChip,
                        isSelected && localStyles.tagChipActive
                      ]}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark' : 'add'}
                        size={12}
                        color={isSelected ? '#fff' : '#64748B'}
                      />
                      <Text style={[localStyles.tagChipText, isSelected && localStyles.tagChipTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SUBJECT & COMMENT FORM */}
            <View style={[localStyles.card, { marginTop: 14 }]}>
              <Text style={localStyles.fieldLabel}>Headline / Summary</Text>
              <TextInput
                style={localStyles.input}
                placeholder="e.g. Smooth entry at Krishna Hostel Gate"
                placeholderTextColor="#94A3B8"
                value={subject}
                onChangeText={setSubject}
              />

              <Text style={[localStyles.fieldLabel, { marginTop: 12 }]}>
                Detailed Comments & Review <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={[localStyles.input, { height: 110, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Describe your parking experience, any bottleneck at the gate, or ideas for improving campus mobility..."
                placeholderTextColor="#94A3B8"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
              />

              {/* ANONYMOUS TOGGLE */}
              <View style={localStyles.switchRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                    Submit Anonymously
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Hide your name & student email from operations display
                  </Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                  thumbColor={isAnonymous ? '#2563EB' : '#CBD5E1'}
                />
              </View>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={[localStyles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={localStyles.submitBtnText}>Submit Campus Feedback</Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        )}

        {/* ================= 2. MY SUBMISSIONS / HISTORY TAB ================= */}
        {activeTab === 'history' && !isAdmin && (
          <View>
            {isLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '700' }}>Loading past submissions...</Text>
              </View>
            ) : myFeedbacks.length === 0 ? (
              <View style={localStyles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={54} color="#CBD5E1" />
                <Text style={localStyles.emptyTitle}>No Feedback Submitted Yet</Text>
                <Text style={localStyles.emptySubtitle}>
                  Rate your recent parking sessions or suggest improvements to help us optimize slot vacancy.
                </Text>
                <TouchableOpacity
                  style={localStyles.emptyBtn}
                  onPress={() => setActiveTab('submit')}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>Leave First Review →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myFeedbacks.map((fb) => (
                <View key={fb.id} style={localStyles.feedbackCard}>
                  {/* CARD HEADER */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>
                        {fb.category?.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ flexDirection: 'row' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= fb.rating ? 'star' : 'star-outline'}
                            size={14}
                            color={s <= fb.rating ? '#F59E0B' : '#CBD5E1'}
                          />
                        ))}
                      </View>
                      {renderStatusBadge(fb.status)}
                    </View>
                  </View>

                  <Text style={{ fontSize: 15, fontWeight: '900', color: '#0F172A', marginBottom: 4 }}>
                    {fb.subject}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18, marginBottom: 8 }}>
                    {fb.comment}
                  </Text>

                  {/* TAGS */}
                  {Array.isArray(fb.tags) && fb.tags.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {fb.tags.map((t, i) => (
                        <View key={i} style={localStyles.tagMini}>
                          <Text style={{ fontSize: 10, color: '#475569', fontWeight: '700' }}>#{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* ADMIN REPLY BANNER */}
                  {fb.adminReply && (
                    <View style={localStyles.adminReplyBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <Ionicons name="shield-checkmark" size={14} color="#059669" />
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#059669' }}>
                          Campus Operations Response:
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#0F172A', fontStyle: 'italic', lineHeight: 17 }}>
                        "{fb.adminReply}"
                      </Text>
                    </View>
                  )}

                  <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 8, fontWeight: '600' }}>
                    Submitted {new Date(fb.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= 3. ADMIN INBOX TAB ================= */}
        {activeTab === 'inbox' && isAdmin && (
          <View>
            {/* KPI STATS ROW */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <View style={[localStyles.kpiCard, { borderLeftColor: '#F59E0B' }]}>
                <Text style={localStyles.kpiLabel}>Avg Rating</Text>
                <Text style={[localStyles.kpiValue, { color: '#D97706' }]}>{metrics.averageRating} ★</Text>
              </View>

              <View style={[localStyles.kpiCard, { borderLeftColor: '#10B981' }]}>
                <Text style={localStyles.kpiLabel}>Satisfaction</Text>
                <Text style={[localStyles.kpiValue, { color: '#059669' }]}>{metrics.satisfactionRate}%</Text>
              </View>

              <View style={[localStyles.kpiCard, { borderLeftColor: '#2563EB' }]}>
                <Text style={localStyles.kpiLabel}>Total</Text>
                <Text style={[localStyles.kpiValue, { color: '#1D4ED8' }]}>{adminFeedbacks.length}</Text>
              </View>
            </View>

            {adminFeedbacks.length === 0 ? (
              <View style={localStyles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={54} color="#10B981" />
                <Text style={localStyles.emptyTitle}>All Feedback Processed</Text>
                <Text style={localStyles.emptySubtitle}>No pending tickets require campus administrator review.</Text>
              </View>
            ) : (
              adminFeedbacks.map((fb) => (
                <View key={fb.id} style={localStyles.feedbackCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: '#0F172A' }}>{fb.userName}</Text>
                      <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: '#64748B' }}>{fb.userRole || 'STUDENT'}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ flexDirection: 'row' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= fb.rating ? 'star' : 'star-outline'}
                            size={13}
                            color={s <= fb.rating ? '#F59E0B' : '#CBD5E1'}
                          />
                        ))}
                      </View>
                      {renderStatusBadge(fb.status)}
                    </View>
                  </View>

                  <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>
                    {fb.userEmail} • {new Date(fb.createdAt).toLocaleDateString()}
                  </Text>

                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                    {fb.subject}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#334155', lineHeight: 18, marginBottom: 8 }}>
                    {fb.comment}
                  </Text>

                  {/* REPLY BOX IF EXISTS */}
                  {fb.adminReply && (
                    <View style={[localStyles.adminReplyBox, { marginBottom: 10 }]}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669' }}>Replied:</Text>
                      <Text style={{ fontSize: 12, color: '#0F172A', fontStyle: 'italic', marginTop: 2 }}>"{fb.adminReply}"</Text>
                    </View>
                  )}

                  {/* ACTION BUTTON */}
                  <TouchableOpacity
                    style={localStyles.replyActionBtn}
                    onPress={() => {
                      setSelectedFbForReply(fb);
                      setReplyText(fb.adminReply || '');
                      setReplyStatus(fb.status || 'RESOLVED');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbox-ellipses-outline" size={15} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>
                      {fb.adminReply ? 'Edit Response' : 'Reply & Resolve'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* SUCCESS MODAL */}
      <Modal visible={submitSuccessModal} transparent animationType="fade">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.successModalCard}>
            <View style={localStyles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text style={localStyles.modalTitle}>Feedback Submitted!</Text>
            <Text style={localStyles.modalText}>
              Thank you for sharing your experience. Campus operations has received your feedback.
            </Text>
            <TouchableOpacity
              style={localStyles.modalCloseBtn}
              onPress={() => {
                setSubmitSuccessModal(false);
                setActiveTab(isAdmin ? 'inbox' : 'history');
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>
                View My Submissions →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADMIN REPLY MODAL */}
      {selectedFbForReply && (
        <Modal visible={true} transparent animationType="slide">
          <View style={localStyles.modalOverlay}>
            <View style={localStyles.replyModalCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                  Respond to Student Feedback
                </Text>
                <TouchableOpacity onPress={() => setSelectedFbForReply(null)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 10, marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E293B' }}>
                  {selectedFbForReply.userName} ({selectedFbForReply.rating}★)
                </Text>
                <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  "{selectedFbForReply.comment}"
                </Text>
              </View>

              <Text style={localStyles.fieldLabel}>Ticket Status</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {['UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      localStyles.statusSelectChip,
                      replyStatus === st && { backgroundColor: '#2563EB', borderColor: '#2563EB' }
                    ]}
                    onPress={() => setReplyStatus(st)}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: replyStatus === st ? '#fff' : '#64748B' }}>
                      {st.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={localStyles.fieldLabel}>Official Reply Message</Text>
              <TextInput
                style={[localStyles.input, { height: 90, textAlignVertical: 'top', paddingTop: 8, marginBottom: 16 }]}
                placeholder="Type response for student notification..."
                placeholderTextColor="#94A3B8"
                value={replyText}
                onChangeText={setReplyText}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                  onPress={() => setSelectedFbForReply(null)}
                >
                  <Text style={{ color: '#475569', fontWeight: '800' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                  onPress={handleSaveReply}
                  disabled={isSavingReply}
                >
                  <Text style={{ color: '#fff', fontWeight: '900' }}>
                    {isSavingReply ? 'Sending...' : 'Send Reply'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A'
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1
  },
  tabSwitcherContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 3
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B'
  },
  tabBtnTextActive: {
    color: '#FFFFFF'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center'
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 14
  },
  ratingDescriptionPill: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  ratingDescriptionText: {
    fontSize: 12,
    fontWeight: '800'
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  categoryCard: {
    width: '48%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    flexShrink: 1
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  tagChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB'
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  tagChipTextActive: {
    color: '#FFFFFF'
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600'
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900'
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  tagMini: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  adminReplyBox: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    padding: 8,
    borderRadius: 8,
    marginTop: 6
  },
  replyActionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase'
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 16
  },
  emptyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6
  },
  modalText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20
  },
  modalCloseBtn: {
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center'
  },
  replyModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380
  },
  statusSelectChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center'
  }
});
