/**
 * MapScreen.js
 *
 * Features:
 *  • react-native-maps MapView in 3-D perspective (camera pitch)
 *  • Nearby user markers with avatar bubbles
 *  • Profile detail bottom sheet on marker tap
 *  • Filter sheet (religion × lookingFor)
 *  • "My Status" floating card — create / view / delete status
 *  • UserStatusModal — text + image, AI suggestions, nudity guard
 *
 * Dependencies (add to package.json if missing):
 *   react-native-maps
 *   expo-location
 *   expo-image-picker
 *   react-native-bottom-sheet  (or use the built-in Animated approach below)
 */

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ChevronDown,
  Filter,
  Loader,
  MapPin,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../context/ThemeContext';
import mapService from '../../../../services/mapService';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const REACTION_EMOJIS = { heart: '❤️', fire: '🔥', laugh: '😂', wave: '👋' };

const RELIGION_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Christian', value: 'christian' },
  { label: 'Muslim', value: 'muslim' },
  { label: 'Jewish', value: 'jewish' },
  { label: 'Hindu', value: 'hindu' },
  { label: 'Buddhist', value: 'buddhist' },
  { label: 'Spiritual', value: 'spiritual' },
  { label: 'Atheist', value: 'atheist' },
  { label: 'Other', value: 'other' },
];

const LOOKING_FOR_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Long term', value: 'long term' },
  { label: 'Something casual', value: 'casual' },
  { label: 'Short term', value: 'short term' },
  { label: 'A committed relationship', value: 'committed' },
  { label: 'Not sure yet', value: 'not sure' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Circular avatar marker shown on the map */
const UserMarker = ({ user, onPress, colors }) => {
  const hasStatus = !!user.status;
  return (
    <Marker
      coordinate={{
        latitude:  user.coordinates[1],
        longitude: user.coordinates[0],
      }}
      onPress={() => onPress(user)}
      tracksViewChanges={false}
    >
      <View style={mk.markerContainer}>
        {/* Status pulse ring */}
        {hasStatus && <View style={[mk.pulse, { borderColor: '#E8651A' }]} />}

        <View style={[mk.avatarRing, { borderColor: hasStatus ? '#E8651A' : colors.primary }]}>
          {user.profilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={mk.avatar} />
          ) : (
            <View style={[mk.avatarFallback, { backgroundColor: colors.primaryLight ?? '#EEF2FF' }]}>
              <Text style={[mk.avatarInitial, { color: colors.primary }]}>
                {user.firstName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
        </View>

        {/* Status text bubble */}
        {hasStatus && user.status?.text && (
          <View style={mk.statusBubble}>
            <Text style={mk.statusBubbleText} numberOfLines={1}>
              {user.status.text}
            </Text>
          </View>
        )}

        {/* Marker tail */}
        <View style={[mk.tail, { borderTopColor: hasStatus ? '#E8651A' : colors.primary }]} />
      </View>
    </Marker>
  );
};

const mk = StyleSheet.create({
  markerContainer: { alignItems: 'center' },
  pulse: {
    position: 'absolute', top: -4, left: -4,
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 2, opacity: 0.4,
  },
  avatarRing: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 2.5, overflow: 'hidden',
    backgroundColor: '#fff',
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontFamily: 'PlusJakartaSansBold' },
  statusBubble: {
    marginTop: 4, backgroundColor: '#E8651A',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, maxWidth: 120,
  },
  statusBubbleText: {
    color: '#fff', fontSize: 10,
    fontFamily: 'PlusJakartaSans',
  },
  tail: {
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
//  PROFILE DETAIL SHEET
// ─────────────────────────────────────────────────────────────────────────────

const ProfileSheet = ({ user, onClose, colors }) => {
  const router = useRouter();
  const slideY = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (user) {
      Animated.spring(slideY, {
        toValue: 0, useNativeDriver: true, bounciness: 4,
      }).start();
    }
  }, [user]);

  const dismiss = () => {
    Animated.timing(slideY, {
      toValue: SH, duration: 280, useNativeDriver: true,
    }).start(onClose);
  };

  if (!user) return null;

  const pill = (label) => (
    <View key={label} style={[ps.pill, { backgroundColor: colors.primaryLight ?? '#EEF2FF', borderColor: colors.primaryBorder ?? '#C7D2FE' }]}>
      <Text style={[ps.pillText, { color: colors.primary }]}>{label}</Text>
    </View>
  );

  return (
    <Modal transparent animationType="none" visible={!!user} onRequestClose={dismiss}>
      <Pressable style={ps.backdrop} onPress={dismiss} />
      <Animated.View
        style={[ps.sheet, { backgroundColor: colors.surface, transform: [{ translateY: slideY }] }]}
      >
        {/* Handle */}
        <View style={[ps.handle, { backgroundColor: colors.border }]} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Cover photo */}
          <View style={ps.coverWrapper}>
            {user.profilePhoto ? (
              <Image source={{ uri: user.profilePhoto }} style={ps.cover} resizeMode="cover" />
            ) : (
              <View style={[ps.cover, { backgroundColor: colors.primaryLight }]} />
            )}
            <View style={ps.coverGradient} />
            <TouchableOpacity style={ps.closeBtn} onPress={dismiss}>
              <X size={18} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
            {/* Name + age */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={[ps.name, { color: colors.textPrimary }]}>
                {user.firstName}{user.age ? `, ${user.age}` : ''}
              </Text>
              {user.verified && (
                <View style={ps.verifiedBadge}>
                  <Text style={{ fontSize: 10, color: '#fff' }}>✓</Text>
                </View>
              )}
            </View>

            {/* Location */}
            {user.city && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                <MapPin size={13} color={colors.textTertiary} />
                <Text style={[ps.sub, { color: colors.textSecondary }]}>{user.city}</Text>
              </View>
            )}

            {/* Pills */}
            <View style={ps.pills}>
              {user.religion && pill(`🙏 ${user.religion}`)}
              {user.lookingFor && pill(`💛 ${user.lookingFor}`)}
              {user.gender && pill(user.gender)}
            </View>

            {/* Active status */}
            {user.status?.text && (
              <View style={[ps.statusCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                <Text style={ps.statusCardText}>&quot;{user.status.text}&quot;</Text>
              </View>
            )}
            {user.status?.imageUrl && (
              <Image
                source={{ uri: user.status.imageUrl }}
                style={ps.statusImage}
                resizeMode="cover"
              />
            )}
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={[ps.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[ps.msgBtn, { backgroundColor: colors.primary }]}
            onPress={() => { dismiss(); /* router.push(`/chat/${user._id}`) */ }}
          >
            <Text style={ps.msgBtnText}>Say Hello 👋</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const ps = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SH * 0.82, overflow: 'hidden',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  coverWrapper: { width: '100%', height: 220, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  coverGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    background: 'transparent',
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: 8,
  },
  name: { fontSize: 24, fontFamily: 'PlusJakartaSansBold' },
  sub: { fontSize: 13, fontFamily: 'PlusJakartaSans' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 99, borderWidth: 1,
  },
  pillText: { fontSize: 12, fontFamily: 'PlusJakartaSansMedium' },
  verifiedBadge: {
    backgroundColor: '#3B82F6', width: 20, height: 20,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  statusCard: {
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12,
  },
  statusCardText: {
    fontSize: 14, fontFamily: 'PlusJakartaSans',
    color: '#92400E', fontStyle: 'italic',
  },
  statusImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12 },
  footer: {
    padding: 16, borderTopWidth: StyleSheet.hairlineWidth,
  },
  msgBtn: {
    borderRadius: 50, paddingVertical: 15, alignItems: 'center',
  },
  msgBtnText: { color: '#fff', fontSize: 16, fontFamily: 'PlusJakartaSansBold' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  FILTER SHEET
// ─────────────────────────────────────────────────────────────────────────────

const FilterSheet = ({ visible, filters, onChange, onApply, onClose, colors }) => {
  const slideY = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : SH, useNativeDriver: true, bounciness: 3,
    }).start();
  }, [visible]);

  const Chip = ({ label, active, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        fs.chip,
        active
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[fs.chipText, { color: active ? '#fff' : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Pressable style={ps.backdrop} onPress={onClose} />
      <Animated.View
        style={[fs.sheet, { backgroundColor: colors.surface, transform: [{ translateY: slideY }] }]}
      >
        <View style={[fs.header, { borderBottomColor: colors.border }]}>
          <Text style={[fs.title, { color: colors.textPrimary }]}>Filter people</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <Text style={[fs.sectionTitle, { color: colors.textSecondary }]}>Religion</Text>
          <View style={fs.chips}>
            {RELIGION_OPTIONS.map((o) => (
              <Chip
                key={o.value} label={o.label}
                active={filters.religion === o.value}
                onPress={() => onChange('religion', o.value)}
              />
            ))}
          </View>

          <Text style={[fs.sectionTitle, { color: colors.textSecondary, marginTop: 8 }]}>Looking for</Text>
          <View style={fs.chips}>
            {LOOKING_FOR_OPTIONS.map((o) => (
              <Chip
                key={o.value} label={o.label}
                active={filters.lookingFor === o.value}
                onPress={() => onChange('lookingFor', o.value)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={[fs.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[fs.resetBtn, { borderColor: colors.border }]}
            onPress={() => { onChange('religion', ''); onChange('lookingFor', ''); }}
          >
            <Text style={[fs.resetText, { color: colors.textSecondary }]}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[fs.applyBtn, { backgroundColor: colors.primary }]}
            onPress={onApply}
          >
            <Text style={fs.applyText}>Show results</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const fs = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SH * 0.75,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontFamily: 'PlusJakartaSansBold' },
  sectionTitle: { fontSize: 12, fontFamily: 'PlusJakartaSansBold', letterSpacing: 0.8, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: 'PlusJakartaSansMedium' },
  footer: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resetBtn: {
    flex: 1, borderRadius: 50, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1,
  },
  resetText: { fontSize: 15, fontFamily: 'PlusJakartaSansMedium' },
  applyBtn: { flex: 2, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  applyText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSansBold' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  STATUS MODAL
// ─────────────────────────────────────────────────────────────────────────────

const StatusModal = ({ visible, myStatus, location, onClose, onSaved, colors }) => {
  const [text, setText]                 = useState('');
  const [imageUri, setImageUri]         = useState(null);
  const [suggestions, setSuggestions]   = useState([]);
  const [loadingAI, setLoadingAI]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [tab, setTab]                   = useState('write'); // 'write' | 'view'

  useEffect(() => {
    if (visible && myStatus) {
      setText(myStatus.text || '');
      setTab('view');
    } else if (visible) {
      setText('');
      setImageUri(null);
      setTab('write');
    }
  }, [visible, myStatus]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const fetchSuggestions = async () => {
    setLoadingAI(true);
    try {
      const items = await mapService.getAISuggestions({ mood: text || undefined });
      setSuggestions(items);
    } catch {
      Alert.alert('Could not load suggestions', 'Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !imageUri) {
      Alert.alert('Empty status', 'Add some text or a photo before posting.');
      return;
    }
    if (!location) {
      Alert.alert('Location needed', 'Enable location to post a status.');
      return;
    }
    setSaving(true);
    try {
      await mapService.createStatus({
        text:      text.trim() || undefined,
        imageUrl:  imageUri || undefined,
        latitude:  location.latitude,
        longitude: location.longitude,
      });
      onSaved();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Something went wrong.';
      Alert.alert('Could not post', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Remove status', 'Delete your current status?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await mapService.deleteStatus();
          onSaved();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.surface }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[sm.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <X size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[sm.title, { color: colors.textPrimary }]}>My Status</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={saving}
            style={[sm.postBtn, { backgroundColor: colors.primary }]}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={sm.postBtnText}>Post</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tabs */}
          {myStatus && (
            <View style={[sm.tabs, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {['write', 'view'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[sm.tab, tab === t && { backgroundColor: colors.surface }]}
                  onPress={() => setTab(t)}
                >
                  <Text style={[sm.tabText, { color: tab === t ? colors.primary : colors.textSecondary }]}>
                    {t === 'write' ? '✏️  Update' : '👁  Current'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {tab === 'view' && myStatus ? (
            /* ── View current status ── */
            <View style={{ marginTop: 8 }}>
              {myStatus.imageUrl && (
                <Image source={{ uri: myStatus.imageUrl }} style={sm.currentImage} resizeMode="cover" />
              )}
              {myStatus.text && (
                <View style={[sm.currentTextCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                  <Text style={sm.currentText}>&quot;{myStatus.text}&quot;</Text>
                </View>
              )}
              <TouchableOpacity style={sm.deleteBtn} onPress={handleDelete}>
                <Text style={sm.deleteBtnText}>🗑  Remove status</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Write / update status ── */
            <>
              {/* Text area */}
              <View style={[sm.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <TextInput
                  value={text}
                  onChangeText={(v) => setText(v.slice(0, 280))}
                  placeholder="What's on your mind? 💭"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  style={[sm.input, { color: colors.textPrimary }]}
                />
                <Text style={[sm.charCount, { color: text.length > 250 ? '#EF4444' : colors.textTertiary }]}>
                  {text.length}/280
                </Text>
              </View>

              {/* Image preview */}
              {imageUri && (
                <View style={{ marginTop: 12 }}>
                  <Image source={{ uri: imageUri }} style={sm.imagePreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={sm.removeImage}
                    onPress={() => setImageUri(null)}
                  >
                    <X size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Action row */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={[sm.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={pickImage}
                >
                  <Text style={[sm.actionBtnText, { color: colors.textPrimary }]}>📷  Add photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[sm.actionBtn, { borderColor: '#E8651A', backgroundColor: '#FFF7ED' }]}
                  onPress={fetchSuggestions}
                  disabled={loadingAI}
                >
                  {loadingAI
                    ? <ActivityIndicator size="small" color="#E8651A" />
                    : <Text style={[sm.actionBtnText, { color: '#E8651A' }]}>✨  AI ideas</Text>
                  }
                </TouchableOpacity>
              </View>

              {/* AI suggestions */}
              {suggestions.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[sm.suggestTitle, { color: colors.textSecondary }]}>
                    Tap a suggestion to use it
                  </Text>
                  {suggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[sm.suggestion, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => { setText(s); setSuggestions([]); }}
                    >
                      <Sparkles size={14} color="#E8651A" strokeWidth={1.8} />
                      <Text style={[sm.suggestionText, { color: colors.textPrimary }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Nudity notice */}
              <View style={[sm.notice, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Text style={sm.noticeText}>
                  🚫 Nudity and explicit content are strictly prohibited. Images are automatically reviewed.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const sm = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontFamily: 'PlusJakartaSansBold' },
  postBtn: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  postBtnText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 14 },
  tabs: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    padding: 3, marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 13, fontFamily: 'PlusJakartaSansMedium' },
  textArea: {
    borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 110,
  },
  input: { fontSize: 16, fontFamily: 'PlusJakartaSans', lineHeight: 24 },
  charCount: { fontSize: 11, fontFamily: 'PlusJakartaSans', textAlign: 'right', marginTop: 6 },
  imagePreview: { width: '100%', height: 180, borderRadius: 14 },
  removeImage: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 14, padding: 5,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSansMedium' },
  suggestTitle: { fontSize: 12, fontFamily: 'PlusJakartaSansBold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  suggestion: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  suggestionText: { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans', lineHeight: 20 },
  notice: { borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 16 },
  noticeText: { fontSize: 12, fontFamily: 'PlusJakartaSans', color: '#B91C1C', lineHeight: 18 },
  currentImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 12 },
  currentTextCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  currentText: { fontSize: 17, fontFamily: 'PlusJakartaSans', color: '#92400E', fontStyle: 'italic', lineHeight: 26 },
  deleteBtn: { alignItems: 'center', paddingVertical: 14 },
  deleteBtnText: { fontSize: 15, fontFamily: 'PlusJakartaSansMedium', color: '#EF4444' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const MapScreen = () => {
  const { colors, isDark } = useTheme();
  const mapRef = useRef(null);

  const [location, setLocation]       = useState(null);
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilter, setShowFilter]   = useState(false);
  const [showStatus, setShowStatus]   = useState(false);
  const [myStatus, setMyStatus]       = useState(null);
  const [is3D, setIs3D]               = useState(true);
  const [filters, setFilters]         = useState({ religion: '', lookingFor: '' });

  // ── Location permission + initial load ─────────────────────

  const initLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location required',
          'Enable location access so others can find you on the map.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = {
        latitude:  pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setLocation(coords);

      // Push to server
      mapService.updateLocation(coords).catch(() => {});

      // Animate map to current position
      mapRef.current?.animateCamera({
        center:  coords,
        pitch:   is3D ? 55 : 0,
        heading: 0,
        zoom:    15,
      }, { duration: 1000 });

      fetchNearby(coords);
      fetchMyStatus();
    } catch (err) {
      console.error('Location error:', err);
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { initLocation(); }, [initLocation]));

  // ── Data fetching ───────────────────────────────────────────

  const fetchNearby = async (coords = location, activeFilters = filters) => {
    if (!coords) return;
    setLoading(true);
    try {
      const res = await mapService.getNearbyUsers({
        latitude:   coords.latitude,
        longitude:  coords.longitude,
        radiusKm:   30,
        religion:   activeFilters.religion  || undefined,
        lookingFor: activeFilters.lookingFor || undefined,
      });
      setUsers(res.data ?? []);
    } catch (err) {
      console.error('Fetch nearby error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStatus = async () => {
    try {
      const s = await mapService.getMyStatus();
      setMyStatus(s);
    } catch {}
  };

  // ── 3D toggle ───────────────────────────────────────────────

  const toggle3D = () => {
    const next = !is3D;
    setIs3D(next);
    if (location) {
      mapRef.current?.animateCamera({
        center:  location,
        pitch:   next ? 55 : 0,
        heading: 0,
        zoom:    15,
      }, { duration: 600 });
    }
  };

  // ── Filter change ───────────────────────────────────────────

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setShowFilter(false);
    fetchNearby(location, filters);
  };

  // ── Active filter count badge ───────────────────────────────

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ─────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* ── MAP ── */}
      {location ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialCamera={{
            center:  location,
            pitch:   is3D ? 55 : 0,
            heading: 0,
            zoom:    15,
          }}
          showsUserLocation
          showsCompass={false}
          showsBuildings
          showsTraffic={false}
          customMapStyle={isDark ? DARK_MAP_STYLE : []}
          rotateEnabled
          pitchEnabled
        >
          {users.map((u) => (
            <UserMarker
              key={u._id}
              user={u}
              onPress={setSelectedUser}
              colors={colors}
            />
          ))}
        </MapView>
      ) : (
        <View style={[s.mapPlaceholder, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.mapPlaceholderText, { color: colors.textSecondary }]}>
            Getting your location…
          </Text>
        </View>
      )}

      {/* ── TOP CONTROLS ── */}
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={s.topBar}>
        {/* Title */}
        <View style={[s.titleCard, { backgroundColor: colors.surface }]}>
          <MapPin size={16} color={colors.primary} strokeWidth={2.5} />
          <Text style={[s.titleText, { color: colors.textPrimary }]}>Nearby</Text>
          {users.length > 0 && (
            <View style={[s.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={s.countText}>{users.length}</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* 3D toggle */}
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: colors.surface }]}
            onPress={toggle3D}
          >
            <Text style={[s.iconBtnLabel, { color: is3D ? colors.primary : colors.textSecondary }]}>
              {is3D ? '3D' : '2D'}
            </Text>
          </TouchableOpacity>

          {/* Filter */}
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: colors.surface }]}
            onPress={() => setShowFilter(true)}
          >
            <Filter size={18} color={activeFilterCount ? colors.primary : colors.textSecondary} strokeWidth={2} />
            {activeFilterCount > 0 && (
              <View style={[s.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Refresh */}
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: colors.surface }]}
            onPress={() => fetchNearby()}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <RefreshCw size={18} color={colors.textSecondary} strokeWidth={2} />
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── MY STATUS FLOATING CARD ── */}
      <View pointerEvents="box-none" style={s.statusCardWrapper}>
        <TouchableOpacity
          style={[s.statusCard, {
            backgroundColor: colors.surface,
            borderColor: myStatus ? '#E8651A' : colors.border,
          }]}
          onPress={() => setShowStatus(true)}
          activeOpacity={0.88}
        >
          <View style={s.statusCardLeft}>
            <View style={[s.statusDot, { backgroundColor: myStatus ? '#E8651A' : colors.border }]} />
            <Text style={[s.statusCardText, { color: myStatus ? colors.textPrimary : colors.textTertiary }]} numberOfLines={1}>
              {myStatus?.text ?? 'Share your status…'}
            </Text>
          </View>
          <Zap size={16} color={myStatus ? '#E8651A' : colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* ── PROFILE DETAIL SHEET ── */}
      <ProfileSheet
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        colors={colors}
      />

      {/* ── FILTER SHEET ── */}
      <FilterSheet
        visible={showFilter}
        filters={filters}
        onChange={handleFilterChange}
        onApply={applyFilters}
        onClose={() => setShowFilter(false)}
        colors={colors}
      />

      {/* ── STATUS MODAL ── */}
      <StatusModal
        visible={showStatus}
        myStatus={myStatus}
        location={location}
        onClose={() => setShowStatus(false)}
        onSaved={() => { fetchMyStatus(); fetchNearby(); }}
        colors={colors}
      />
    </View>
  );
};

// ─── Screen styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  mapPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  mapPlaceholderText: { fontFamily: 'PlusJakartaSans', fontSize: 14 },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  titleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6,
  },
  titleText: { fontFamily: 'PlusJakartaSansBold', fontSize: 15 },
  countBadge: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  countText: { color: '#fff', fontSize: 11, fontFamily: 'PlusJakartaSansBold' },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6,
  },
  iconBtnLabel: { fontFamily: 'PlusJakartaSansBold', fontSize: 13 },
  filterBadge: {
    position: 'absolute', top: 5, right: 5,
    width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'PlusJakartaSansBold' },

  // Status card
  statusCardWrapper: {
    position: 'absolute', bottom: 30, left: 16, right: 16,
  },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 18, borderWidth: 1.5,
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  statusCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusCardText: { fontFamily: 'PlusJakartaSans', fontSize: 14, flex: 1 },
});

// ─── Google Maps dark style ───────────────────────────────────────────────────

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'poi', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3C7680' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
  { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#023968' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'transit', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
  { featureType: 'transit.line', elementType: 'geometry.fill', stylers: [{ color: '#283d6a' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#3a4762' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

export default MapScreen;