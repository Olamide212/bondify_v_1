/**
 * CreateBondupModal.jsx  —  UI redesign (all logic preserved)
 */

import * as Location from 'expo-location';
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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { colors } from '../../constant/colors';
import { useAlert } from '../../context/AlertContext';
import bondupService from '../../services/bondupService';
import BaseModal from '../modals/BaseModal';

const BRAND = colors.primary;

// Expanded activities list without emojis
const ACTIVITIES = [
  // Food & Drink
  { key: 'coffee', label: 'Coffee' },
  { key: 'food', label: 'Dining' },
  { key: 'drinks', label: 'Drinks' },
  { key: 'brunch', label: 'Brunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'dessert', label: 'Dessert' },
  
  // Sports & Fitness
  { key: 'gym', label: 'Gym' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'running', label: 'Running' },
  { key: 'hiking', label: 'Hiking' },
  { key: 'cycling', label: 'Cycling' },
  { key: 'swimming', label: 'Swimming' },
  { key: 'tennis', label: 'Tennis' },
  { key: 'basketball', label: 'Basketball' },
  { key: 'football', label: 'Football' },
  { key: 'volleyball', label: 'Volleyball' },
  
  // Outdoor Activities
  { key: 'walk', label: 'Walking' },
  { key: 'park', label: 'Park' },
  { key: 'beach', label: 'Beach' },
  { key: 'picnic', label: 'Picnic' },
  { key: 'camping', label: 'Camping' },
  { key: 'fishing', label: 'Fishing' },
  
  // Entertainment
  { key: 'movie', label: 'Cinema' },
  { key: 'theater', label: 'Theater' },
  { key: 'concert', label: 'Concert' },
  { key: 'museum', label: 'Museum' },
  { key: 'art', label: 'Art Gallery' },
  { key: 'comedy', label: 'Comedy Show' },
  
  // Social & Games
  { key: 'board_games', label: 'Board Games' },
  { key: 'video_games', label: 'Video Games' },
  { key: 'karaoke', label: 'Karaoke' },
  { key: 'dancing', label: 'Dancing' },
  { key: 'party', label: 'Party' },
  { key: 'networking', label: 'Networking' },
  
  // Learning & Creative
  { key: 'workshop', label: 'Workshop' },
  { key: 'class', label: 'Class' },
  { key: 'photography', label: 'Photography' },
  { key: 'painting', label: 'Painting' },
  { key: 'music', label: 'Music' },
  
  // Other
  { key: 'other', label: 'Other' },
];

// Group activities by category for the modal
const ACTIVITY_CATEGORIES = [
  {
    title: "🍽️ Food & Drink",
    items: ACTIVITIES.filter(a => ['coffee', 'food', 'drinks', 'brunch', 'dinner', 'lunch', 'snacks', 'dessert'].includes(a.key))
  },
  {
    title: "💪 Sports & Fitness", 
    items: ACTIVITIES.filter(a => ['gym', 'yoga', 'running', 'hiking', 'cycling', 'swimming', 'tennis', 'basketball', 'football', 'volleyball'].includes(a.key))
  },
  {
    title: "🏞️ Outdoor Activities",
    items: ACTIVITIES.filter(a => ['walk', 'park', 'beach', 'picnic', 'camping', 'fishing'].includes(a.key))
  },
  {
    title: "🎭 Entertainment",
    items: ACTIVITIES.filter(a => ['movie', 'theater', 'concert', 'museum', 'art', 'comedy'].includes(a.key))
  },
  {
    title: "🎲 Social & Games",
    items: ACTIVITIES.filter(a => ['board_games', 'video_games', 'karaoke', 'dancing', 'party', 'networking'].includes(a.key))
  },
  {
    title: "🎨 Learning & Creative",
    items: ACTIVITIES.filter(a => ['workshop', 'class', 'photography', 'painting', 'music'].includes(a.key))
  },
  {
    title: "✨ Other",
    items: ACTIVITIES.filter(a => ['other'].includes(a.key))
  }
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

// ─── Activity Selection Modal ──────────────────────────────────────────────
function ActivitySelectionModal({ visible, onClose, selectedActivity, onSelectActivity }) {
  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <View style={asm.container}>
        {/* Header */}
        <View style={asm.header}>
          <TouchableOpacity onPress={onClose} style={asm.cancelBtn} hitSlop={10}>
            <Text style={asm.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={asm.headerTitle}>Choose Activity</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={asm.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={asm.subtitle}>What would you like to do?</Text>

          {/* Activity Categories */}
          {ACTIVITY_CATEGORIES.map((category) => (
            <View key={category.title} style={asm.category}>
              <Text style={asm.categoryTitle}>{category.title}</Text>
              <View style={asm.activityGrid}>
                {category.items.map((activity) => {
                  const isSelected = selectedActivity === activity.key;
                  return (
                    <TouchableOpacity
                      key={activity.key}
                      style={[asm.activityButton, isSelected && asm.activityButtonSelected]}
                      onPress={() => {
                        onSelectActivity(activity.key);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[asm.activityLabel, isSelected && asm.activityLabelSelected]}>
                        {activity.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </BaseModal>
  );
}

// ─── Activity Selection Modal Styles ────────────────────────────────────────
const asm = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansMedium',
    color: BRAND,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 24,
    textAlign: 'center',
  },
  category: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
    marginBottom: 12,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D1D1',
    backgroundColor: '#fff',
    minWidth: 80,
    alignItems: 'center',
  },
  activityButtonSelected: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  activityLabel: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#111',
  },
  activityLabelSelected: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
  },
});

// ─── Main CreateBondupModal Component ───────────────────────────────────────
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
  const { showAlert } = useAlert();
  const dayOptions = buildDayOptions();

  // ── Form state (all original variables preserved) ────────────────────────
  const [postType, setPostType] = useState('join_me');
  const [activity, setActivity] = useState('');
  const [customActivity, setCustomActivity] = useState('');
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
  const [showMap, setShowMap] = useState(false);
  const [mapLocation, setMapLocation] = useState({ latitude: 37.7749, longitude: -122.4194 });
  const [addressSearchText, setAddressSearchText] = useState('');
  const [geocodingError, setGeocodingError] = useState('');
  const [showActivityModal, setShowActivityModal] = useState(false);

  const resetForm = () => {
    setPostType('join_me');
    setActivity('');
    setCustomActivity('');
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
    setShowMap(false);
    setAddressSearchText('');
    setGeocodingError('');
    setShowActivityModal(false);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // ── Geocoding: Convert address to coordinates ───────────────────────────
  const handleAddressSearch = async (text) => {
    setAddressSearchText(text);
    if (!text.trim()) {
      setGeocodingError('');
      return;
    }
    try {
      const results = await Location.geocodeAsync(text);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        setMapLocation({ latitude, longitude });
        setGeocodingError('');
      } else {
        setGeocodingError('Address not found');
      }
    } catch {
      setGeocodingError('Could not geocode address');
    }
  };

  // ── Reverse Geocoding: Convert coordinates to address ───────────────────
  const handleMapDrag = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMapLocation({ latitude, longitude });
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const { street, city: resultCity, region } = results[0];
        setAddressSearchText([street, resultCity, region].filter(Boolean).join(', '));
        if (resultCity) setCity(resultCity);
        setGeocodingError('');
      }
    } catch {
      // Silent fail on reverse geocode
    }
  };

  // ── Submit (original logic) ───────────────────────────────────────────────
  const handleSubmit = async () => {
    const finalActivity = activity === 'other' ? customActivity : activity;
    if (!title.trim() || !finalActivity || !city.trim()) {
      showAlert({
        icon: 'warning',
        title: 'Missing fields',
        message: 'Please fill in title, activity, and city.',
      });
      return;
    }
    const dateTime = parseTimeOption(selectedTime, dayOptions[selectedDayIndex].date);
    if (dateTime < new Date()) {
      showAlert({
        icon: 'warning',
        title: 'Invalid time',
        message: 'Please pick a future date and time.',
      });
      return;
    }
    setLoading(true);
    try {
      const res = await bondupService.createBondup({
        title: title.trim(),
        description: description.trim(),
        activityType: finalActivity,
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
      showAlert({
        icon: 'error',
        title: 'Error',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !!title.trim() && !!(activity === 'other' ? customActivity : activity) && !!city.trim();

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
          {/* ── POST TYPE ── */}
          <Text style={s.sectionLabel}>POST TYPE</Text>
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

          {/* ── WHAT'S THE PLAN? section ── */}
          <Text style={s.sectionLabel}>WHAT&apos;S THE PLAN?</Text>
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
              placeholder="Add a description..."
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
          
          {/* Activity Selection Button */}
          <TouchableOpacity
            style={[s.activitySelectButton, !activity && s.activitySelectButtonEmpty]}
            onPress={() => setShowActivityModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[s.activitySelectText, !activity && s.activitySelectTextEmpty]}>
              {activity ? ACTIVITIES.find(a => a.key === activity)?.label : 'Choose an activity'}
            </Text>
            <ChevronRight size={20} color={activity ? BRAND : '#BBB'} />
          </TouchableOpacity>

          {/* ── Custom Activity Input (when 'other' is selected) ── */}
          {activity === 'other' && (
            <View style={s.card}>
              <TextInput
                style={s.titleInput}
                placeholder="Describe your activity..."
                placeholderTextColor="#BBB"
                value={customActivity}
                onChangeText={setCustomActivity}
                maxLength={100}
              />
            </View>
          )}

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

          {/* ── Map Section ── */}
          <TouchableOpacity
            style={s.mapToggleBtn}
            onPress={() => setShowMap(!showMap)}
            activeOpacity={0.7}
          >
            <MapPin size={16} color={BRAND} />
            <Text style={s.mapToggleBtnText}>
              {showMap ? 'Hide Map' : 'Show Map & Search Address'}
            </Text>
          </TouchableOpacity>

          {showMap && (
            <View style={s.mapContainer}>
              <TextInput
                style={s.addressSearchInput}
                placeholder="Search address..."
                placeholderTextColor="#BBB"
                value={addressSearchText}
                onChangeText={handleAddressSearch}
                maxLength={150}
              />
              {geocodingError ? (
                <Text style={s.geocodingError}>{geocodingError}</Text>
              ) : null}
              <MapView
                style={s.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: mapLocation.latitude,
                  longitude: mapLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                region={{
                  latitude: mapLocation.latitude,
                  longitude: mapLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled
                zoomEnabled
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={mapLocation}
                  draggable
                  onDragEnd={handleMapDrag}
                  pinColor={BRAND}
                />
              </MapView>
              <Text style={s.mapHint}>Drag the marker to select location</Text>
            </View>
          )}

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
              {/* Max participants */}
              <Text style={s.advancedLabel}>MAX PARTICIPANTS</Text>
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

      {/* Activity Selection Modal */}
      <ActivitySelectionModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        selectedActivity={activity}
        onSelectActivity={setActivity}
      />
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
    backgroundColor: '#fff',
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
  activitySelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND,
    backgroundColor: '#fff',
    marginBottom: 18,
  },
  activitySelectButtonEmpty: {
    borderColor: '#E5E7EB',
  },
  activitySelectText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansMedium',
    color: BRAND,
  },
  activitySelectTextEmpty: {
    color: '#BBB',
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

  // Map section
  mapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  mapToggleBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },
  mapContainer: {
    marginBottom: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  addressSearchInput: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  geocodingError: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
  },
  map: {
    width: '100%',
    height: 250,
  },
  mapHint: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
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
    marginBottom: 18,
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
