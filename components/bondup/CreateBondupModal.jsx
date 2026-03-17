/**
 * CreateBondupModal.jsx
 *
 * Full-screen modal for creating a new Bondup.
 * Steps:
 *  1. Pick activity type
 *  2. Fill title, description, date/time, location, city
 *  3. Set visibility (public / circle) + optional max participants
 *  4. Post
 */

import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import BaseModal from '../modals/BaseModal';
import { colors } from '../../constant/colors';
import bondupService from '../../services/bondupService';

const BRAND = colors.primary;

const ACTIVITIES = [
  { key: 'coffee', emoji: '☕', label: 'Coffee' },
  { key: 'food',   emoji: '🍔', label: 'Food' },
  { key: 'drinks', emoji: '🍹', label: 'Drinks' },
  { key: 'gym',    emoji: '💪', label: 'Gym' },
  { key: 'walk',   emoji: '🚶', label: 'Walk' },
  { key: 'movie',  emoji: '🎬', label: 'Movie' },
  { key: 'other',  emoji: '✨', label: 'Other' },
];

// Build next 7 day quick-select options
const buildDayOptions = () => {
  const options = [];
  const today = new Date();
  for (let i = 0; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    let label;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    options.push({ label, date: d });
  }
  return options;
};

const TIME_OPTIONS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
];

const parseTimeOption = (timeStr, baseDate) => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let h = hours;
  if (period === 'PM' && hours !== 12) h += 12;
  if (period === 'AM' && hours === 12) h = 0;
  const d = new Date(baseDate);
  d.setHours(h, minutes, 0, 0);
  return d;
};

const STEPS = ['activity', 'details', 'settings'];

export default function CreateBondupModal({ visible, onClose, onCreated }) {
  const { user: currentUser } = useSelector((s) => s.auth);
  const dayOptions = buildDayOptions();

  // ── Form state ───────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [activity, setActivity] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState(
    currentUser?.socialProfile?.city || currentUser?.location?.city || ''
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState('6:00 PM');
  const [visibility, setVisibility] = useState('public');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setStep(0);
    setActivity('');
    setTitle('');
    setDescription('');
    setLocation('');
    setCity(currentUser?.socialProfile?.city || currentUser?.location?.city || '');
    setSelectedDayIndex(0);
    setSelectedTime('6:00 PM');
    setVisibility('public');
    setMaxParticipants('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const canGoNext = () => {
    if (step === 0) return !!activity;
    if (step === 1) return !!title.trim() && !!city.trim();
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim() || !activity || !city.trim()) {
      Alert.alert('Missing fields', 'Please fill in title, activity, and city.');
      return;
    }

    const dateTime = parseTimeOption(selectedTime, dayOptions[selectedDayIndex].date);
    if (dateTime < new Date()) {
      Alert.alert('Invalid time', 'Please pick a future date and time.');
      return;
    }

    setLoading(true);
    try {
      const res = await bondupService.createBondup({
        title: title.trim(),
        description: description.trim(),
        activityType: activity,
        location: location.trim(),
        city: city.trim(),
        dateTime: dateTime.toISOString(),
        visibility,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      });

      if (res.success) {
        onCreated?.(res.data);
        handleClose();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not create Bondup. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render steps ──────────────────────────────────────────────────────────
  const renderActivityStep = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>What's the vibe? 🎉</Text>
      <Text style={s.stepSubtitle}>Pick an activity type for your Bondup</Text>
      <View style={s.activityGrid}>
        {ACTIVITIES.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={[s.activityItem, activity === a.key && s.activityItemActive]}
            onPress={() => setActivity(a.key)}
            activeOpacity={0.7}
          >
            <Text style={s.activityEmoji}>{a.emoji}</Text>
            <Text style={[s.activityLabel, activity === a.key && s.activityLabelActive]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Tell us more 📝</Text>
      <Text style={s.stepSubtitle}>Give your Bondup a title and time</Text>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Title *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Coffee in Lekki this evening"
          placeholderTextColor="#bbb"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Text style={s.charCount}>{title.length}/100</Text>
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Description</Text>
        <TextInput
          style={[s.input, s.textarea]}
          placeholder="Any details? (optional)"
          placeholderTextColor="#bbb"
          value={description}
          onChangeText={setDescription}
          maxLength={500}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Day selector */}
      <View style={s.field}>
        <Text style={s.fieldLabel}>Day *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {dayOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[s.dayOption, selectedDayIndex === i && s.dayOptionActive]}
                onPress={() => setSelectedDayIndex(i)}
                activeOpacity={0.7}
              >
                <Text style={[s.dayOptionText, selectedDayIndex === i && s.dayOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Time selector */}
      <View style={s.field}>
        <Text style={s.fieldLabel}>Time *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {TIME_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.timeOption, selectedTime === t && s.timeOptionActive]}
                onPress={() => setSelectedTime(t)}
                activeOpacity={0.7}
              >
                <Text style={[s.timeOptionText, selectedTime === t && s.timeOptionTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Location</Text>
        <TextInput
          style={s.input}
          placeholder="Venue or area (optional)"
          placeholderTextColor="#bbb"
          value={location}
          onChangeText={setLocation}
          maxLength={100}
        />
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>City *</Text>
        <TextInput
          style={s.input}
          placeholder="Your city"
          placeholderTextColor="#bbb"
          value={city}
          onChangeText={setCity}
          maxLength={60}
        />
      </View>
    </View>
  );

  const renderSettingsStep = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Who can see this? 🔍</Text>
      <Text style={s.stepSubtitle}>Choose your Bondup visibility</Text>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Visibility</Text>
        <View style={s.visibilityRow}>
          <TouchableOpacity
            style={[s.visibilityBtn, visibility === 'public' && s.visibilityBtnActive]}
            onPress={() => setVisibility('public')}
            activeOpacity={0.7}
          >
            <Text style={s.visibilityEmoji}>🌍</Text>
            <Text style={[s.visibilityBtnText, visibility === 'public' && s.visibilityBtnTextActive]}>
              Public
            </Text>
            <Text style={s.visibilityDesc}>Visible to your city</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.visibilityBtn, visibility === 'circle' && s.visibilityBtnActive]}
            onPress={() => setVisibility('circle')}
            activeOpacity={0.7}
          >
            <Text style={s.visibilityEmoji}>🔒</Text>
            <Text style={[s.visibilityBtnText, visibility === 'circle' && s.visibilityBtnTextActive]}>
              Circle
            </Text>
            <Text style={s.visibilityDesc}>Friends & followers only</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Max Participants (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="Leave empty for unlimited"
          placeholderTextColor="#bbb"
          value={maxParticipants}
          onChangeText={(t) => setMaxParticipants(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      {/* Summary */}
      <View style={s.summary}>
        <Text style={s.summaryTitle}>Summary</Text>
        <Text style={s.summaryLine}>
          {ACTIVITIES.find((a) => a.key === activity)?.emoji}{' '}
          {ACTIVITIES.find((a) => a.key === activity)?.label}
        </Text>
        <Text style={s.summaryLine}>📌 {title || '(no title)'}</Text>
        <Text style={s.summaryLine}>
          📅 {dayOptions[selectedDayIndex]?.label} at {selectedTime}
        </Text>
        {!!city && (
          <Text style={s.summaryLine}>
            📍 {[location, city].filter(Boolean).join(', ')}
          </Text>
        )}
        <Text style={s.summaryLine}>
          {visibility === 'public' ? '🌍 Public' : '🔒 Circle only'}
        </Text>
      </View>
    </View>
  );

  const stepContent = [renderActivityStep, renderDetailsStep, renderSettingsStep];

  return (
    <BaseModal visible={visible} onClose={handleClose} fullScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Toolbar */}
        <View style={s.toolbar}>
          <TouchableOpacity onPress={handleClose} style={s.closeBtn} hitSlop={10}>
            <X size={22} color="#333" />
          </TouchableOpacity>
          <View style={s.progressDots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[s.dot, i === step && s.dotActive, i < step && s.dotDone]}
              />
            ))}
          </View>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {stepContent[step]?.()}
        </ScrollView>

        {/* Footer buttons */}
        <View style={s.footer}>
          {step > 0 && (
            <TouchableOpacity style={s.backBtn} onPress={handleBack}>
              <Text style={s.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < STEPS.length - 1 ? (
            <TouchableOpacity
              style={[s.nextBtn, !canGoNext() && s.nextBtnDisabled, step === 0 && { flex: 1 }]}
              onPress={handleNext}
              disabled={!canGoNext()}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.postBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.postBtnText}>Post Bondup 🎉</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </BaseModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: BRAND,
    width: 24,
  },
  dotDone: {
    backgroundColor: '#86EFAC',
  },

  stepContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    marginBottom: 24,
  },

  // Activity grid
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#F9F9F9',
    borderWidth: 2,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  activityItemActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  activityEmoji: {
    fontSize: 30,
  },
  activityLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#555',
  },
  activityLabelActive: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansBold',
  },

  // Fields
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansBold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans',
    color: '#111',
    backgroundColor: '#FAFAFA',
  },
  textarea: {
    minHeight: 80,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'PlusJakartaSans',
  },

  // Day/time selectors
  dayOption: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayOptionActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  dayOptionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#555',
  },
  dayOptionTextActive: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansBold',
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  timeOptionActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  timeOptionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#555',
  },
  timeOptionTextActive: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansBold',
  },

  // Visibility
  visibilityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  visibilityBtnActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  visibilityEmoji: {
    fontSize: 24,
  },
  visibilityBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#555',
  },
  visibilityBtnTextActive: {
    color: BRAND,
  },
  visibilityDesc: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans',
    color: '#999',
    textAlign: 'center',
  },

  // Summary
  summary: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#333',
    marginBottom: 4,
  },
  summaryLine: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    color: '#555',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#555',
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: BRAND,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  postBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: BRAND,
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  postBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
});
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import BaseModal from '../modals/BaseModal';
import { colors } from '../../constant/colors';
import bondupService from '../../services/bondupService';

const BRAND = colors.primary;

const ACTIVITIES = [
  { key: 'coffee', emoji: '☕', label: 'Coffee' },
  { key: 'food',   emoji: '🍔', label: 'Food' },
  { key: 'drinks', emoji: '🍹', label: 'Drinks' },
  { key: 'gym',    emoji: '💪', label: 'Gym' },
  { key: 'walk',   emoji: '🚶', label: 'Walk' },
  { key: 'movie',  emoji: '🎬', label: 'Movie' },
  { key: 'other',  emoji: '✨', label: 'Other' },
];

const STEPS = ['activity', 'details', 'settings'];

export default function CreateBondupModal({ visible, onClose, onCreated }) {
  const { user: currentUser } = useSelector((s) => s.auth);

  // ── Form state ───────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [activity, setActivity] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState(
    currentUser?.socialProfile?.city || currentUser?.location?.city || ''
  );
  const [dateTime, setDateTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setStep(0);
    setActivity('');
    setTitle('');
    setDescription('');
    setLocation('');
    setCity(currentUser?.socialProfile?.city || currentUser?.location?.city || '');
    const d = new Date(); d.setHours(d.getHours() + 2, 0, 0, 0);
    setDateTime(d);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setVisibility('public');
    setMaxParticipants('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const canGoNext = () => {
    if (step === 0) return !!activity;
    if (step === 1) return !!title.trim() && !!city.trim();
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim() || !activity || !city.trim()) {
      Alert.alert('Missing fields', 'Please fill in title, activity, and city.');
      return;
    }

    setLoading(true);
    try {
      const res = await bondupService.createBondup({
        title: title.trim(),
        description: description.trim(),
        activityType: activity,
        location: location.trim(),
        city: city.trim(),
        dateTime: dateTime.toISOString(),
        visibility,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      });

      if (res.success) {
        onCreated?.(res.data);
        handleClose();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not create Bondup. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Date/time helpers ─────────────────────────────────────────────────────
  const formatDate = (d) => {
    const opts = { weekday: 'short', month: 'short', day: 'numeric' };
    return d.toLocaleDateString(undefined, opts);
  };
  const formatTime = (d) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const onDateChange = (_, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      const updated = new Date(dateTime);
      updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setDateTime(updated);
    }
  };
  const onTimeChange = (_, selected) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) {
      const updated = new Date(dateTime);
      updated.setHours(selected.getHours(), selected.getMinutes());
      setDateTime(updated);
    }
  };

  // ── Render steps ──────────────────────────────────────────────────────────
  const renderActivityStep = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>What's the vibe? 🎉</Text>
      <Text style={s.stepSubtitle}>Pick an activity type for your Bondup</Text>
      <View style={s.activityGrid}>
        {ACTIVITIES.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={[s.activityItem, activity === a.key && s.activityItemActive]}
            onPress={() => setActivity(a.key)}
            activeOpacity={0.7}
          >
            <Text style={s.activityEmoji}>{a.emoji}</Text>
            <Text style={[s.activityLabel, activity === a.key && s.activityLabelActive]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Tell us more 📝</Text>
      <Text style={s.stepSubtitle}>Give your Bondup a title and time</Text>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Title *</Text>
        <TextInput
          style={s.input}
          placeholder="e.g. Coffee in Lekki this evening"
          placeholderTextColor="#bbb"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Text style={s.charCount}>{title.length}/100</Text>
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Description</Text>
        <TextInput
          style={[s.input, s.textarea]}
          placeholder="Any details? (optional)"
          placeholderTextColor="#bbb"
          value={description}
          onChangeText={setDescription}
          maxLength={500}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Date + Time pickers */}
      <View style={s.field}>
        <Text style={s.fieldLabel}>Date & Time *</Text>
        <View style={s.dateTimeRow}>
          <TouchableOpacity
            style={[s.pickerBtn, { flex: 1 }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={s.pickerBtnText}>📅 {formatDate(dateTime)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.pickerBtn, { marginLeft: 8 }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={s.pickerBtnText}>🕐 {formatTime(dateTime)}</Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={dateTime}
            mode="date"
            minimumDate={new Date()}
            maximumDate={(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d; })()}
            onChange={onDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={dateTime}
            mode="time"
            onChange={onTimeChange}
          />
        )}
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Location</Text>
        <TextInput
          style={s.input}
          placeholder="Venue or area (optional)"
          placeholderTextColor="#bbb"
          value={location}
          onChangeText={setLocation}
          maxLength={100}
        />
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>City *</Text>
        <TextInput
          style={s.input}
          placeholder="Your city"
          placeholderTextColor="#bbb"
          value={city}
          onChangeText={setCity}
          maxLength={60}
        />
      </View>
    </View>
  );

  const renderSettingsStep = () => (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Who can see this? 🔍</Text>
      <Text style={s.stepSubtitle}>Choose your Bondup visibility</Text>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Visibility</Text>
        <View style={s.visibilityRow}>
          <TouchableOpacity
            style={[s.visibilityBtn, visibility === 'public' && s.visibilityBtnActive]}
            onPress={() => setVisibility('public')}
            activeOpacity={0.7}
          >
            <Text style={s.visibilityEmoji}>🌍</Text>
            <Text style={[s.visibilityBtnText, visibility === 'public' && s.visibilityBtnTextActive]}>
              Public
            </Text>
            <Text style={s.visibilityDesc}>Visible to your city</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.visibilityBtn, visibility === 'circle' && s.visibilityBtnActive]}
            onPress={() => setVisibility('circle')}
            activeOpacity={0.7}
          >
            <Text style={s.visibilityEmoji}>🔒</Text>
            <Text style={[s.visibilityBtnText, visibility === 'circle' && s.visibilityBtnTextActive]}>
              Circle
            </Text>
            <Text style={s.visibilityDesc}>Friends & followers only</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>Max Participants (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="Leave empty for unlimited"
          placeholderTextColor="#bbb"
          value={maxParticipants}
          onChangeText={(t) => setMaxParticipants(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      {/* Summary */}
      <View style={s.summary}>
        <Text style={s.summaryTitle}>Summary</Text>
        <Text style={s.summaryLine}>🎯 {ACTIVITIES.find((a) => a.key === activity)?.emoji} {ACTIVITIES.find((a) => a.key === activity)?.label}</Text>
        <Text style={s.summaryLine}>📌 {title || '(no title)'}</Text>
        <Text style={s.summaryLine}>📅 {formatDate(dateTime)} at {formatTime(dateTime)}</Text>
        {!!city && <Text style={s.summaryLine}>📍 {[location, city].filter(Boolean).join(', ')}</Text>}
        <Text style={s.summaryLine}>{visibility === 'public' ? '🌍' : '🔒'} {visibility === 'public' ? 'Public' : 'Circle only'}</Text>
      </View>
    </View>
  );

  const stepContent = [renderActivityStep, renderDetailsStep, renderSettingsStep];

  return (
    <BaseModal visible={visible} onClose={handleClose} fullScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Toolbar */}
        <View style={s.toolbar}>
          <TouchableOpacity onPress={handleClose} style={s.closeBtn} hitSlop={10}>
            <X size={22} color="#333" />
          </TouchableOpacity>
          <View style={s.progressDots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[s.dot, i === step && s.dotActive, i < step && s.dotDone]}
              />
            ))}
          </View>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {stepContent[step]?.()}
        </ScrollView>

        {/* Footer buttons */}
        <View style={s.footer}>
          {step > 0 && (
            <TouchableOpacity style={s.backBtn} onPress={handleBack}>
              <Text style={s.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < STEPS.length - 1 ? (
            <TouchableOpacity
              style={[s.nextBtn, !canGoNext() && s.nextBtnDisabled, step === 0 && { flex: 1 }]}
              onPress={handleNext}
              disabled={!canGoNext()}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.postBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.postBtnText}>Post Bondup 🎉</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </BaseModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: BRAND,
    width: 24,
  },
  dotDone: {
    backgroundColor: '#86EFAC',
  },

  stepContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    marginBottom: 24,
  },

  // Activity grid
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#F9F9F9',
    borderWidth: 2,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  activityItemActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  activityEmoji: {
    fontSize: 30,
  },
  activityLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#555',
  },
  activityLabelActive: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansBold',
  },

  // Fields
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansBold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans',
    color: '#111',
    backgroundColor: '#FAFAFA',
  },
  textarea: {
    minHeight: 80,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'PlusJakartaSans',
  },

  // Date/time
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerBtn: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  pickerBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#333',
  },

  // Visibility
  visibilityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  visibilityBtnActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  visibilityEmoji: {
    fontSize: 24,
  },
  visibilityBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#555',
  },
  visibilityBtnTextActive: {
    color: BRAND,
  },
  visibilityDesc: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans',
    color: '#999',
    textAlign: 'center',
  },

  // Summary
  summary: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#333',
    marginBottom: 4,
  },
  summaryLine: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    color: '#555',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#555',
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: BRAND,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  postBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: BRAND,
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  postBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
});
