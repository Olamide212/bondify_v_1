/**
 * MapScreen.js
 *
 * Layout:
 *  • MAP fills entire screen (3D pitch, showsBuildings)
 *  • Floating top bar: search bar + 3D/Filter/Refresh buttons
 *  • Horizontal quick-filter chips below top bar
 *  • Filter modal (bottom sheet) — religion × lookingFor
 *  • Right-edge FABs: zoom +/−, locate me
 *  • Profile preview card slides up from bottom on marker tap
 */

import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Crosshair, Filter, MapPin, Minus, Plus, RefreshCw, Search, SlidersHorizontal, X,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
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

// ─── Filter options ───────────────────────────────────────────────────────────

const RELIGION_OPTIONS = [
  { label: 'Any',       value: '' },
  { label: 'Christian', value: 'christian' },
  { label: 'Muslim',    value: 'muslim' },
  { label: 'Jewish',    value: 'jewish' },
  { label: 'Hindu',     value: 'hindu' },
  { label: 'Buddhist',  value: 'buddhist' },
  { label: 'Spiritual', value: 'spiritual' },
  { label: 'Atheist',   value: 'atheist' },
  { label: 'Other',     value: 'other' },
];

const LOOKING_FOR_OPTIONS = [
  { label: 'Any',                   value: '' },
  { label: 'Long term',             value: 'long term' },
  { label: 'Something casual',      value: 'casual' },
  { label: 'Short term',            value: 'short term' },
  { label: 'Committed relationship', value: 'committed' },
  { label: 'Not sure yet',          value: 'not sure' },
];

// Quick-access preset chips (subset of full filter)
const QUICK_CHIPS = [
  { label: 'Christian searching for love', religion: 'christian', lookingFor: 'long term' },
  { label: 'Muslim searching for love',    religion: 'muslim',    lookingFor: 'long term' },
  { label: 'Something casual',            religion: '',          lookingFor: 'casual' },
  { label: 'Committed relationship',       religion: '',          lookingFor: 'committed' },
  { label: 'Jewish searching for love',    religion: 'jewish',    lookingFor: 'long term' },
  { label: 'Spiritual connections',        religion: 'spiritual', lookingFor: '' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  MAP MARKER
// ─────────────────────────────────────────────────────────────────────────────

const UserMarker = ({ user, onPress }) => {
  const photo = user.profilePhoto ?? user.images?.[0]?.url ?? user.images?.[0] ?? null;

  return (
    <Marker
      coordinate={{ latitude: user.coordinates[1], longitude: user.coordinates[0] }}
      onPress={() => onPress({ ...user, _resolvedPhoto: photo })}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={mk.wrap}>
        <View style={mk.ring}>
          {photo ? (
            <Image source={{ uri: photo }} style={mk.avatar} />
          ) : (
            <View style={mk.fallback}>
              <Text style={mk.initial}>{user.firstName?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
        </View>
        <View style={mk.label}>
          <Text style={mk.labelText} numberOfLines={1}>
            {user.firstName}{user.age ? `, ${user.age}` : ''}
          </Text>
        </View>
      </View>
    </Marker>
  );
};

const mk = StyleSheet.create({
  wrap:    { alignItems: 'center' },
  ring:    {
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 3, borderColor: '#fff',
    overflow: 'hidden', backgroundColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28, shadowRadius: 5, elevation: 7,
  },
  avatar:   { width: 48, height: 48, borderRadius: 24 },
  fallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  initial:  { fontSize: 18, fontFamily: 'PlusJakartaSansBold', color: '#6366F1' },
  label:    {
    marginTop: 5, backgroundColor: '#fff',
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14, shadowRadius: 3, elevation: 3,
  },
  labelText: { fontSize: 11, fontFamily: 'PlusJakartaSansBold', color: '#111' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  PROFILE PREVIEW CARD
// ─────────────────────────────────────────────────────────────────────────────

const ProfileCard = ({ user, onClose }) => {
  const router  = useRouter();
  const slideY  = useRef(new Animated.Value(220)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      Animated.parallel([
        Animated.spring(slideY,  { toValue: 0,   useNativeDriver: true, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1,   duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY,  { toValue: 220, duration: 260, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [user]);

  const photo = user?._resolvedPhoto ?? null;

  return (
    <Animated.View
      pointerEvents={user ? 'auto' : 'none'}
      style={[pc.card, { opacity, transform: [{ translateY: slideY }] }]}
    >
      <View style={pc.avatarWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={pc.avatar} resizeMode="cover" />
        ) : (
          <View style={[pc.avatar, pc.avatarFallback]}>
            <Text style={pc.avatarInitial}>{user?.firstName?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={pc.onlineDot} />
      </View>

      <View style={pc.info}>
        <Text style={pc.name} numberOfLines={1}>
          {user?.firstName}{user?.age ? `, ${user.age}` : ''}
        </Text>
        <Text style={pc.sub} numberOfLines={1}>
          {[user?.city && `📍 ${user.city}`, user?.religion && `🙏 ${user.religion}`]
            .filter(Boolean).join('   ')}
        </Text>
      </View>

      <TouchableOpacity
        style={pc.btn}
        activeOpacity={0.88}
        onPress={() => {
          onClose();
          router.push({ pathname: '/user-profile', params: { userId: user?._id } });
        }}
      >
        <Text style={pc.btnText}>View Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={pc.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <X size={15} color="#9CA3AF" strokeWidth={2.5} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const pc = StyleSheet.create({
  card: {
    position: 'absolute', bottom: 28, left: 16, right: 16,
    borderRadius: 24, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 14,
  },
  avatarWrap:     { position: 'relative' },
  avatar:         { width: 66, height: 66, borderRadius: 18 },
  avatarFallback: { backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontSize: 26, fontFamily: 'PlusJakartaSansBold', color: '#6366F1' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#fff',
  },
  info:    { flex: 1 },
  name:    { fontSize: 17, fontFamily: 'PlusJakartaSansBold', color: '#111827', marginBottom: 4 },
  sub:     { fontSize: 12, fontFamily: 'PlusJakartaSans', color: '#6B7280' },
  btn:     { backgroundColor: '#E8651A', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 50 },
  btnText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 13 },
  closeBtn: { position: 'absolute', top: 10, right: 12, padding: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
//  FILTER MODAL  — full bottom sheet
// ─────────────────────────────────────────────────────────────────────────────

const FilterModal = ({ visible, filters, onChange, onApply, onReset, onClose, colors }) => {
  const slideY = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : SH,
      useNativeDriver: true,
      bounciness: visible ? 3 : 0,
      speed: visible ? 14 : 20,
    }).start();
  }, [visible]);

  const Chip = ({ label, active, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        fm.chip,
        active
          ? { backgroundColor: '#E8651A', borderColor: '#E8651A' }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[fm.chipText, { color: active ? '#fff' : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const activeCount = [filters.religion, filters.lookingFor].filter(Boolean).length;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Dimmed backdrop */}
      <Pressable style={fm.backdrop} onPress={onClose} />

      <Animated.View
        style={[fm.sheet, { backgroundColor: colors.surface, transform: [{ translateY: slideY }] }]}
      >
        {/* Drag handle */}
        <View style={[fm.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={[fm.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[fm.title, { color: colors.textPrimary }]}>Filter people</Text>
            {activeCount > 0 && (
              <Text style={[fm.subtitle, { color: colors.textSecondary }]}>
                {activeCount} filter{activeCount > 1 ? 's' : ''} active
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[fm.closeCircle, { backgroundColor: colors.background }]}
            onPress={onClose}
          >
            <X size={16} color={colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 6 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Religion */}
          <Text style={[fm.sectionLabel, { color: colors.textSecondary }]}>🙏  Religion</Text>
          <View style={fm.chips}>
            {RELIGION_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={filters.religion === o.value}
                onPress={() => onChange('religion', o.value)}
              />
            ))}
          </View>

          <View style={[fm.divider, { backgroundColor: colors.border }]} />

          {/* Looking for */}
          <Text style={[fm.sectionLabel, { color: colors.textSecondary }]}>💛  Looking for</Text>
          <View style={fm.chips}>
            {LOOKING_FOR_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                active={filters.lookingFor === o.value}
                onPress={() => onChange('lookingFor', o.value)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[fm.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[fm.resetBtn, { borderColor: colors.border }]}
            onPress={onReset}
          >
            <Text style={[fm.resetText, { color: colors.textSecondary }]}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={fm.applyBtn}
            onPress={onApply}
          >
            <Text style={fm.applyText}>Show results</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const fm = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.42)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    maxHeight: SH * 0.78,
    overflow: 'hidden',
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title:    { fontSize: 19, fontFamily: 'PlusJakartaSansBold' },
  subtitle: { fontSize: 12, fontFamily: 'PlusJakartaSans', marginTop: 2 },
  closeCircle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12, fontFamily: 'PlusJakartaSansBold',
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginBottom: 10, marginTop: 4,
  },
  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: 'PlusJakartaSansMedium' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resetBtn: {
    flex: 1, borderRadius: 50, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1,
  },
  resetText:  { fontSize: 15, fontFamily: 'PlusJakartaSansMedium' },
  applyBtn:   {
    flex: 2, borderRadius: 50, paddingVertical: 14,
    alignItems: 'center', backgroundColor: '#E8651A',
  },
  applyText:  { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSansBold' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const MapScreen = () => {
  const { colors, isDark } = useTheme();
  const mapRef = useRef(null);

  const [location, setLocation]         = useState(null);
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [is3D, setIs3D]                 = useState(true);
  const [activeChip, setActiveChip]     = useState(null);
  const [showFilter, setShowFilter]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filters, setFilters]           = useState({ religion: '', lookingFor: '' });
  // Draft filters inside the modal — only committed on "Show results"
  const [draftFilters, setDraftFilters] = useState({ religion: '', lookingFor: '' });

  // ── Location init ───────────────────────────────────────────

  const initLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', 'Enable location access so others can find you on the map.');
        setLoading(false); return;
      }
      const pos    = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setLocation(coords);
      mapService.updateLocation(coords).catch(() => {});
      mapRef.current?.animateCamera({ center: coords, pitch: 55, heading: 0, zoom: 15 }, { duration: 900 });
      fetchNearby(coords, { religion: '', lookingFor: '' });
    } catch (err) {
      console.error('Location error:', err);
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { initLocation(); }, [initLocation]));

  // ── Data ────────────────────────────────────────────────────

  const fetchNearby = async (coords = location, activeFilters = filters) => {
    if (!coords) return;
    setLoading(true);
    try {
      const res = await mapService.getNearbyUsers({
        latitude: coords.latitude, longitude: coords.longitude, radiusKm: 30,
        religion:   activeFilters.religion   || undefined,
        lookingFor: activeFilters.lookingFor || undefined,
      });
      setUsers(res.data ?? []);
    } catch (err) { console.error('Fetch nearby error:', err); }
    finally { setLoading(false); }
  };

  // ── Search filter (client-side on already-fetched users) ────

  const filteredUsers = searchQuery.trim()
    ? users.filter((u) =>
        u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.city?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  // ── 3D toggle ───────────────────────────────────────────────

  const toggle3D = () => {
    const next = !is3D;
    setIs3D(next);
    if (location) {
      mapRef.current?.animateCamera(
        { center: location, pitch: next ? 55 : 0, heading: 0, zoom: 15 },
        { duration: 600 }
      );
    }
  };

  // ── Quick chip ──────────────────────────────────────────────

  const handleChipPress = (index) => {
    const isDeselect = activeChip === index;
    setActiveChip(isDeselect ? null : index);
    const next = isDeselect
      ? { religion: '', lookingFor: '' }
      : { religion: QUICK_CHIPS[index].religion, lookingFor: QUICK_CHIPS[index].lookingFor };
    setFilters(next);
    setDraftFilters(next);
    fetchNearby(location, next);
  };

  // ── Filter modal ────────────────────────────────────────────

  const openFilter = () => {
    setDraftFilters({ ...filters }); // seed draft with current committed filters
    setShowFilter(true);
  };

  const handleDraftChange = (key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setActiveChip(null); // chips reset when full filter applied
    setShowFilter(false);
    fetchNearby(location, draftFilters);
  };

  const resetFilters = () => {
    const cleared = { religion: '', lookingFor: '' };
    setDraftFilters(cleared);
    setFilters(cleared);
    setActiveChip(null);
    fetchNearby(location, cleared);
    setShowFilter(false);
  };

  // ── FABs ────────────────────────────────────────────────────

  const zoomIn  = () => mapRef.current?.getCamera().then((c) =>
    mapRef.current.animateCamera({ ...c, zoom: (c.zoom ?? 14) + 1 }, { duration: 280 })
  );
  const zoomOut = () => mapRef.current?.getCamera().then((c) =>
    mapRef.current.animateCamera({ ...c, zoom: (c.zoom ?? 14) - 1 }, { duration: 280 })
  );
  const locateMe = () => {
    if (location) mapRef.current?.animateCamera(
      { center: location, pitch: is3D ? 55 : 0, zoom: 15 }, { duration: 600 }
    );
  };

  const activeFilterCount = [filters.religion, filters.lookingFor].filter(Boolean).length;

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
          initialCamera={{ center: location, pitch: 55, heading: 0, zoom: 15 }}
          showsUserLocation
          showsCompass={false}
          showsBuildings
          showsTraffic={false}
          customMapStyle={isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
          rotateEnabled
          pitchEnabled
        >
          {filteredUsers.map((u) => (
            <UserMarker key={u._id} user={u} onPress={setSelectedUser} />
          ))}
        </MapView>
      ) : (
        <View style={[s.mapLoading, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color="#E8651A" />
          <Text style={[s.mapLoadingText, { color: colors.textSecondary }]}>Getting your location…</Text>
        </View>
      )}

      {/* ── FLOATING TOP CONTROLS ── */}
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={s.topSafe}>

        {/* Row 1 — search bar + icon buttons */}
        <View style={s.topRow}>
          {/* Search bar */}
          <View style={[s.searchBar, { backgroundColor: colors.surface }]}>
            <Search size={15} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={[s.searchInput, { color: colors.textPrimary }]}
              placeholder="Search Bondies nearby..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <X size={13} color="#9CA3AF" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {/* Icon row */}
          <View style={s.iconRow}>
            {/* 3D / 2D */}
            <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.surface }]} onPress={toggle3D}>
              <Text style={[s.iconBtnLabel, { color: is3D ? '#E8651A' : colors.textSecondary }]}>
                {is3D ? '3D' : '2D'}
              </Text>
            </TouchableOpacity>

            {/* Filter */}
            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: colors.surface }]}
              onPress={openFilter}
            >
              <SlidersHorizontal size={17} color={activeFilterCount ? '#E8651A' : colors.textSecondary} strokeWidth={2} />
              {activeFilterCount > 0 && (
                <View style={[s.badge, { backgroundColor: '#E8651A' }]}>
                  <Text style={s.badgeText}>{activeFilterCount}</Text>
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
                ? <ActivityIndicator size="small" color="#E8651A" />
                : <RefreshCw size={17} color={colors.textSecondary} strokeWidth={2} />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2 — Nearby count pill + quick-filter chips */}
        <View style={s.row2}>
          {/* Nearby count */}
          <View style={[s.nearbyPill, { backgroundColor: colors.surface }]}>
            <MapPin size={13} color="#E8651A" strokeWidth={2.5} />
            <Text style={[s.nearbyText, { color: colors.textPrimary }]}>
              {filteredUsers.length} nearby
            </Text>
          </View>

          {/* Quick chips */}
          <FlatList
            data={QUICK_CHIPS}
            keyExtractor={(_, i) => String(i)}
            horizontal
            showsHorizontalScrollIndicator={false}
            pointerEvents="auto"
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 8, paddingRight: 16, paddingLeft: 8 }}
            renderItem={({ item, index }) => {
              const active = activeChip === index;
              return (
                <TouchableOpacity
                  style={[s.chip, active ? s.chipActive : [s.chipInactive, { backgroundColor: colors.surface }]]}
                  onPress={() => handleChipPress(index)}
                  activeOpacity={0.82}
                >
                  <Text style={[s.chipText, { color: active ? '#fff' : colors.textPrimary }]}>
                    {item.label}
                  </Text>
                  {active && <Text style={{ color: '#fff', fontSize: 10, marginLeft: 3 }}>✕</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </SafeAreaView>

      {/* ── Right FABs ── */}
      <View style={s.fabs} pointerEvents="box-none">
        <TouchableOpacity style={[s.fab, { backgroundColor: colors.surface }]} onPress={zoomIn}>
          <MapPin size={0} />{/* placeholder to keep spacing */}
          <Plus size={19} color="#374151" strokeWidth={2.5} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.fab, { backgroundColor: colors.surface }]} onPress={zoomOut}>
          <Minus size={19} color="#374151" strokeWidth={2.5} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.fab, { backgroundColor: '#FFF7ED' }]} onPress={locateMe}>
          <Crosshair size={19} color="#E8651A" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ── Profile card ── */}
      <ProfileCard user={selectedUser} onClose={() => setSelectedUser(null)} />

      {/* ── Filter modal ── */}
      <FilterModal
        visible={showFilter}
        filters={draftFilters}
        onChange={handleDraftChange}
        onApply={applyFilters}
        onReset={resetFilters}
        onClose={() => setShowFilter(false)}
        colors={colors}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  mapLoading:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mapLoadingText: { fontFamily: 'PlusJakartaSans', fontSize: 14 },

  topSafe: { position: 'absolute', top: 0, left: 0, right: 0 },

  // Row 1
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8, gap: 10,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  searchInput: {
    flex: 1, fontSize: 13, fontFamily: 'PlusJakartaSans', padding: 0,
  },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 5,
  },
  iconBtnLabel: { fontFamily: 'PlusJakartaSansBold', fontSize: 13 },
  badge: {
    position: 'absolute', top: 5, right: 5,
    width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'PlusJakartaSansBold' },

  // Row 2
  row2: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 16, paddingBottom: 8,
  },
  nearbyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  nearbyText:  { fontFamily: 'PlusJakartaSansBold', fontSize: 12 },

  // Chips
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, flexDirection: 'row', alignItems: 'center' },
  chipActive:   { backgroundColor: '#E8651A' },
  chipInactive: { borderWidth: 0 },
  chipText:     { fontFamily: 'PlusJakartaSansMedium', fontSize: 12 },

  // FABs
  fabs: { position: 'absolute', right: 16, bottom: 130, gap: 10 },
  fab:  {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14, shadowRadius: 6, elevation: 6,
  },
});

// ─── Map styles ───────────────────────────────────────────────────────────────

const LIGHT_MAP_STYLE = [
  { featureType: 'poi',            stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',        stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road',           elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial',  elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road.highway',   elementType: 'geometry', stylers: [{ color: '#e8e8e8' }] },
  { featureType: 'water',          elementType: 'geometry', stylers: [{ color: '#c9d8f0' }] },
  { featureType: 'landscape',      elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
];

const DARK_MAP_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road',        elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'water',        elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi',          stylers: [{ visibility: 'off' }] },
];

export default MapScreen;