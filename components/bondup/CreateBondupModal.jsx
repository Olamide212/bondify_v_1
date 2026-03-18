/**
 * CreateBondupModal.jsx  —  UI redesign (all logic preserved)
 */

import {
  Calendar,
  ChevronRight,
  Clock,
  Globe,
  Lock,
  MapPin,
  X,
} from 'lucide-react-native';
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
  { key: 'food',   emoji: '🍽️', label: 'Dining' },
  { key: 'drinks', emoji: '🍸', label: 'Drinks' },
  { key: 'movie',  emoji: '🎬', label: 'Cinema' },
  { key: 'walk',   emoji: '🏃', label: 'Outdoor' },
  { key: 'gym',    emoji: '💪', label: 'Gym' },
  { key: 'coffee', emoji: '☕', label: 'Coffee' },
  { key: 'other',  emoji: '✨', label: 'Other' },
];

const POST_TYPES = {
  join_me:        { emoji: '🎉', label: 'Join Me',       desc: "I'm planning something" },
  i_am_available: { emoji: '🙋', label: "I'm Available", desc: 'Invite me somewhere' },
};

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

// ─── "Change Time" sheet state ────────────────────────────────────────────────
function TimePickerSheet({ dayOptions, selectedDayIndex, selectedTime, onDaySelect, onTimeSelect, onClose }) {
  return (
    <View style={tp.sheet}>
      <View style={tp.sheetHeader}>
        <Text style={tp.sheetTitle}>Pick Date & Time</Text>
        <TouchableOpacity onPress={onClose} style={tp.sheetClose}>
          <X size={20} color="#555" />
        </TouchableOpacity>
      </View>
      <Text style={tp.sheetLabel}>Day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {dayOptions.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[tp.dayChip, selectedDayIndex === i && tp.dayChipActive]}
              onPress={() => onDaySelect(i)}
            >
              <Text style={[tp.dayChipText, selectedDayIndex === i && tp.dayChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Text style={tp.sheetLabel}>Time</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TIME_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[tp.timeChip, selectedTime === t && tp.timeChipActive]}
              onPress={() => onTimeSelect(t)}
            >
              <Text style={[tp.timeChipText, selectedTime === t && tp.timeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity style={tp.doneBtn} onPress={onClose}>
        <Text style={tp.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CreateBondupModal({ visible, onClose, onCreated }) {
  const { user: currentUser } = useSelector((s) => s.auth);
  const dayOptions = buildDayOptions();

  // ── Form state (all original variables preserved) ────────────────────────
  const [postType, setPostType] = useState('join_me');
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const resetForm = () => {
    setPostType('join_me');
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
    setShowTimePicker(false);
    setShowAdvanced(false);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // ── Submit (original logic) ───────────────────────────────────────────────
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
        postType,
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

  const canSubmit = !!title.trim() && !!activity && !!city.trim();

  return (
    <BaseModal visible={visible} onClose={handleClose} fullScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleClose} style={s.cancelBtn} hitSlop={10}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Create Bondup</Text>
          <TouchableOpacity
            style={[s.postBtn, (!canSubmit || loading) && s.postBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.postBtnText}>Post Bondup</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── WHAT'S THE PLAN? section ── */}
          <Text style={s.sectionLabel}>WHAT'S THE PLAN?</Text>
          <View style={s.card}>
            <TextInput
              style={s.titleInput}
              placeholder="Give your Bondup a name..."
              placeholderTextColor="#BBB"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <View style={s.inputDivider} />
            <TextInput
              style={s.descInput}
              placeholder="Add a description (optional)..."
              placeholderTextColor="#BBB"
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* ── ACTIVITY TYPE section ── */}
          <View style={s.activityHeader}>
            <Text style={s.sectionLabel}>ACTIVITY TYPE</Text>
            <View style={s.requiredBadge}>
              <Text style={s.requiredText}>REQUIRED</Text>
            </View>
          </View>
          <View style={s.activityGrid}>
            {ACTIVITIES.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={[s.activityChip, activity === a.key && s.activityChipActive]}
                onPress={() => setActivity(a.key)}
                activeOpacity={0.7}
              >
                <Text style={s.activityChipEmoji}>{a.emoji}</Text>
                <Text style={[s.activityChipLabel, activity === a.key && s.activityChipLabelActive]}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── WHEN section ── */}
          <Text style={s.sectionLabel}>WHEN</Text>
          <View style={s.card}>
            <View style={s.whenRow}>
              <View style={s.whenIconCircle}>
                <Calendar size={16} color={BRAND} />
              </View>
              <View style={s.whenTextCol}>
                <Text style={s.whenDayText}>{dayOptions[selectedDayIndex]?.label}</Text>
                <Text style={s.whenTimeText}>Starting at {selectedTime}</Text>
              </View>
              <TouchableOpacity
                style={s.changeTimeBtn}
                onPress={() => setShowTimePicker(!showTimePicker)}
              >
                <Clock size={14} color={BRAND} />
                <Text style={s.changeTimeBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
            {showTimePicker && (
              <TimePickerSheet
                dayOptions={dayOptions}
                selectedDayIndex={selectedDayIndex}
                selectedTime={selectedTime}
                onDaySelect={(i) => setSelectedDayIndex(i)}
                onTimeSelect={(t) => setSelectedTime(t)}
                onClose={() => setShowTimePicker(false)}
              />
            )}
          </View>

          {/* ── WHERE section ── */}
          <Text style={s.sectionLabel}>WHERE</Text>
          <View style={s.card}>
            <View style={s.whereRow}>
              <MapPin size={18} color="#BBB" />
              <TextInput
                style={s.whereInput}
                placeholder="City *"
                placeholderTextColor="#BBB"
                value={city}
                onChangeText={setCity}
                maxLength={60}
              />
            </View>
            <View style={s.inputDivider} />
            <View style={s.whereRow}>
              <MapPin size={18} color="#DDD" />
              <TextInput
                style={s.whereInput}
                placeholder="Venue or area (optional)"
                placeholderTextColor="#BBB"
                value={location}
                onChangeText={setLocation}
                maxLength={100}
              />
            </View>
          </View>

          {/* ── VISIBILITY section ── */}
          <Text style={s.sectionLabel}>VISIBILITY</Text>
          <View style={s.visibilityRow}>
            <TouchableOpacity
              style={[s.visibilityCard, visibility === 'public' && s.visibilityCardActive]}
              onPress={() => setVisibility('public')}
              activeOpacity={0.8}
            >
              <Globe size={22} color={visibility === 'public' ? BRAND : '#999'} />
              <Text style={[s.visibilityCardTitle, visibility === 'public' && s.visibilityCardTitleActive]}>
                Public 🌍
              </Text>
              <Text style={s.visibilityCardDesc}>Visible to your city</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.visibilityCard, visibility === 'circle' && s.visibilityCardActive]}
              onPress={() => setVisibility('circle')}
              activeOpacity={0.8}
            >
              <Lock size={22} color={visibility === 'circle' ? BRAND : '#999'} />
              <Text style={[s.visibilityCardTitle, visibility === 'circle' && s.visibilityCardTitleActive]}>
                Circle 👥
              </Text>
              <Text style={s.visibilityCardDesc}>Friends only</Text>
            </TouchableOpacity>
          </View>

          {/* ── Advanced Settings ── */}
          <TouchableOpacity
            style={s.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
            activeOpacity={0.7}
          >
            <Text style={s.advancedToggleText}>Advanced Settings</Text>
            <ChevronRight
              size={16}
              color={BRAND}
              style={showAdvanced && { transform: [{ rotate: '90deg' }] }}
            />
          </TouchableOpacity>

          {showAdvanced && (
            <View style={s.advancedSection}>
              {/* Post type */}
              <Text style={s.advancedLabel}>POST TYPE</Text>
              <View style={s.postTypeRow}>
                {Object.entries(POST_TYPES).map(([key, { emoji, label, desc }]) => (
                  <TouchableOpacity
                    key={key}
                    style={[s.postTypeCard, postType === key && s.postTypeCardActive]}
                    onPress={() => setPostType(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.postTypeEmoji}>{emoji}</Text>
                    <Text style={[s.postTypeLabel, postType === key && s.postTypeLabelActive]}>
                      {label}
                    </Text>
                    <Text style={s.postTypeDesc}>{desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Max participants */}
              <Text style={[s.advancedLabel, { marginTop: 16 }]}>MAX PARTICIPANTS</Text>
              <View style={s.card}>
                <TextInput
                  style={s.titleInput}
                  placeholder="Leave empty for unlimited"
                  placeholderTextColor="#BBB"
                  value={maxParticipants}
                  onChangeText={(t) => setMaxParticipants(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </BaseModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  cancelBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#555',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  postBtn: {
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnDisabled: {
    opacity: 0.45,
  },
  postBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: '#F5F5F7',
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSansBold',
    color: '#888',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  titleInput: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans',
    color: '#111',
    paddingVertical: 14,
  },
  descInput: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#111',
    paddingVertical: 12,
    minHeight: 72,
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // Activity grid
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  requiredBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${BRAND}30`,
  },
  requiredText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
    letterSpacing: 0.5,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  activityChip: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityChipActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  activityChipEmoji: {
    fontSize: 24,
  },
  activityChipLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#555',
  },
  activityChipLabelActive: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansBold',
  },

  // When section
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  whenIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whenTextCol: {
    flex: 1,
  },
  whenDayText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  whenTimeText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    marginTop: 2,
  },
  changeTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BRAND,
  },
  changeTimeBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },

  // Where section
  whereRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  whereInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans',
    color: '#111',
    paddingVertical: 4,
  },

  // Visibility
  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  visibilityCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  visibilityCardActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  visibilityCardTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#555',
  },
  visibilityCardTitleActive: {
    color: BRAND,
  },
  visibilityCardDesc: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans',
    color: '#999',
    textAlign: 'center',
  },

  // Advanced
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  advancedToggleText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },
  advancedSection: {
    marginBottom: 10,
  },
  advancedLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSansBold',
    color: '#888',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  postTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  postTypeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  postTypeCardActive: {
    borderColor: BRAND,
    backgroundColor: colors.primaryLight,
  },
  postTypeEmoji: { fontSize: 24 },
  postTypeLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansBold',
    color: '#555',
  },
  postTypeLabelActive: { color: BRAND },
  postTypeDesc: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans',
    color: '#999',
    textAlign: 'center',
  },
});

// ─── Time picker sub-styles ────────────────────────────────────────────────────
const tp = StyleSheet.create({
  sheet: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 14,
    paddingBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
    color: '#888',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayChipActive: { borderColor: BRAND, backgroundColor: colors.primaryLight },
  dayChipText: { fontSize: 12, fontFamily: 'PlusJakartaSansMedium', color: '#555' },
  dayChipTextActive: { color: BRAND, fontFamily: 'PlusJakartaSansBold' },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  timeChipActive: { borderColor: BRAND, backgroundColor: colors.primaryLight },
  timeChipText: { fontSize: 12, fontFamily: 'PlusJakartaSansMedium', color: '#555' },
  timeChipTextActive: { color: BRAND, fontFamily: 'PlusJakartaSansBold' },
  doneBtn: {
    marginTop: 14,
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
});
