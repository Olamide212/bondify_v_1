import * as ExpoLocation from "expo-location";
import { MapPin, Navigation, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { colors } from "../../constant/colors";
import BaseModal from "../modals/BaseModal";

const DEFAULT_REGION = {
  latitude:      6.5244,   // Lagos fallback
  longitude:     3.3792,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const Location = ({ profile, onUpdateField }) => {
  const mapRef = useRef(null);

  const [isModalVisible, setIsModalVisible]     = useState(false);
  const [city, setCity]                         = useState("");
  const [stateValue, setStateValue]             = useState("");
  const [country, setCountry]                   = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSaving, setIsSaving]                 = useState(false);
  const [isGeocoding, setIsGeocoding]           = useState(false);

  const [markerCoords, setMarkerCoords] = useState(null);   // { latitude, longitude }
  const [region, setRegion]             = useState(DEFAULT_REGION);

  // ── Display text on the trigger card ────────────────────────────────────
  const locationText = useMemo(() => {
    if (typeof profile?.location === "string") return profile.location;
    return [profile?.location?.city, profile?.location?.state, profile?.location?.country]
      .filter(Boolean).join(", ");
  }, [profile?.location]);

  // ── Seed fields when profile changes ────────────────────────────────────
  useEffect(() => {
    if (typeof profile?.location === "object" && profile?.location) {
      setCity(profile.location.city || "");
      setStateValue(profile.location.state || "");
      setCountry(profile.location.country || "");

      // If coords stored on profile, pin the map there
      if (profile.location.latitude && profile.location.longitude) {
        const coords = {
          latitude:  profile.location.latitude,
          longitude: profile.location.longitude,
        };
        setMarkerCoords(coords);
        setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      }
      return;
    }
    if (typeof profile?.location === "string") {
      const [c = "", s = "", co = ""] = profile.location.split(",").map((v) => v.trim());
      setCity(c); setStateValue(s); setCountry(co);
    }
  }, [profile?.location]);

  // ── Reverse-geocode a tapped map coordinate ──────────────────────────────
  const reverseGeocode = async (latitude, longitude) => {
    try {
      setIsGeocoding(true);
      const [result] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      if (result) {
        setCity(result.city || result.district || result.subregion || "");
        setStateValue(result.region || "");
        setCountry(result.country || "");
      }
    } catch {
      // silently fail — user can still type manually
    } finally {
      setIsGeocoding(false);
    }
  };

  // ── User taps on map ──────────────────────────────────────────────────────
  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerCoords({ latitude, longitude });
    setRegion((r) => ({ ...r, latitude, longitude }));
    reverseGeocode(latitude, longitude);
  };

  // ── Detect device GPS ─────────────────────────────────────────────────────
  const handleUseCurrentLocation = async () => {
    try {
      setIsDetectingLocation(true);
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow location access to use your current location.");
        return;
      }
      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;

      setMarkerCoords({ latitude, longitude });
      const newRegion = { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 600);

      await reverseGeocode(latitude, longitude);
    } catch {
      Alert.alert("Location error", "Could not detect your location. Try again.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSaveLocation = async () => {
    if (!city && !stateValue && !country) {
      Alert.alert("Missing location", "Enter at least one location field or tap on the map.");
      return;
    }
    const base    = typeof profile?.location === "object" && profile?.location ? profile.location : {};
    const payload = {
      ...base,
      city,
      state:   stateValue,
      country,
      ...(markerCoords ?? {}),
    };
    try {
      setIsSaving(true);
      await onUpdateField?.("location", payload);
      setIsModalVisible(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* ── Trigger card ── */}
      <TouchableOpacity style={s.card} onPress={() => setIsModalVisible(true)} activeOpacity={0.8}>
        <View style={s.cardLeft}>
          <View style={s.pinCircle}>
            <MapPin size={18} color={colors.primary} strokeWidth={2} />
          </View>
          <View>
            <Text style={s.cardLocation} numberOfLines={1}>
              {locationText || "Location not set"}
            </Text>
            <Text style={s.cardCta}>Tap to change location</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Full-screen modal ── */}
      <BaseModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} fullScreen>
        <View style={s.modal}>

          {/* Header */}
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Set Location</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color="#111" />
            </TouchableOpacity>
          </View>

          {/* ── Map ── */}
          <View style={s.mapWrap}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              provider={PROVIDER_GOOGLE}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {markerCoords && (
                <Marker coordinate={markerCoords} pinColor={colors.primary} />
              )}
            </MapView>

            {/* GPS button over map */}
            <TouchableOpacity
              style={s.gpsBtn}
              onPress={handleUseCurrentLocation}
              disabled={isDetectingLocation}
              activeOpacity={0.85}
            >
              {isDetectingLocation
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Navigation size={20} color={colors.primary} strokeWidth={2} />
              }
            </TouchableOpacity>

            {/* Geocoding spinner overlay */}
            {isGeocoding && (
              <View style={s.geocodingBadge}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={s.geocodingText}>Finding address…</Text>
              </View>
            )}

            {/* Hint */}
            <View style={s.mapHint}>
              <Text style={s.mapHintText}>Tap anywhere on the map to pin your location</Text>
            </View>
          </View>

          {/* ── Fields ── */}
          <View style={s.fields}>
            <View style={s.fieldRow}>
              <View style={[s.fieldWrap, { flex: 1.2 }]}>
                <Text style={s.label}>City</Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  style={s.input}
                />
              </View>
              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={s.label}>State</Text>
                <TextInput
                  value={stateValue}
                  onChangeText={setStateValue}
                  placeholder="State"
                  placeholderTextColor="#9CA3AF"
                  style={s.input}
                />
              </View>
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>Country</Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="Country"
                placeholderTextColor="#9CA3AF"
                style={s.input}
              />
            </View>
          </View>

          {/* ── Save button ── */}
          <TouchableOpacity
            style={[s.saveBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSaveLocation}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnText}>Save Location</Text>
            }
          </TouchableOpacity>

        </View>
      </BaseModal>
    </>
  );
};

export default Location;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Trigger card ──
  card: {
    backgroundColor:  '#fff',
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      '#F3F4F6',
    marginHorizontal: 16,
    padding:          16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  pinCircle: {
    width:           40,
    height:          40,
    borderRadius:    99,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cardLocation: {
    fontSize:   16,
    fontFamily: 'PlusJakartaSansSemiBold',
    color:      '#111',
    marginBottom: 2,
  },
  cardCta: {
    fontSize:   13,
    fontFamily: 'PlusJakartaSansMedium',
    color:      colors.primary,
  },

  // ── Modal ──
  modal: {
    flex:             1,
    backgroundColor:  '#fff',
  },
  modalHeader: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingHorizontal: 20,
    paddingTop:       16,
    paddingBottom:    12,
  },
  modalTitle: {
    fontSize:   18,
    fontFamily: 'PlusJakartaSansBold',
    color:      '#111',
  },

  // ── Map ──
  mapWrap: {
    height:   280,
    position: 'relative',
  },
  gpsBtn: {
    position:        'absolute',
    top:             12,
    right:           12,
    width:           44,
    height:          44,
    borderRadius:    99,
    backgroundColor: '#fff',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOpacity:   0.12,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       4,
  },
  geocodingBadge: {
    position:          'absolute',
    top:               12,
    left:              12,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(0,0,0,0.55)',
    borderRadius:      99,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  geocodingText: {
    fontSize:   12,
    fontFamily: 'PlusJakartaSansMedium',
    color:      '#fff',
  },
  mapHint: {
    position:          'absolute',
    bottom:            12,
    alignSelf:         'center',
    backgroundColor:   'rgba(0,0,0,0.48)',
    borderRadius:      99,
    paddingHorizontal: 14,
    paddingVertical:   6,
  },
  mapHintText: {
    fontSize:   12,
    fontFamily: 'PlusJakartaSansMedium',
    color:      '#fff',
  },

  // ── Fields ──
  fields: {
    paddingHorizontal: 20,
    paddingTop:        18,
    gap:               12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap:           12,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontSize:   13,
    fontFamily: 'PlusJakartaSansSemiBold',
    color:      '#374151',
  },
  input: {
    borderWidth:   1,
    borderColor:   '#E5E7EB',
    borderRadius:  12,
    paddingHorizontal: 14,
    paddingVertical:   12,
    fontSize:      15,
    fontFamily:    'PlusJakartaSansMedium',
    color:         '#111',
    backgroundColor: '#FAFAFA',
  },

  // ── Save button ──
  saveBtn: {
    marginHorizontal: 20,
    marginTop:        'auto',
    marginBottom:     24,
    backgroundColor:  '#111',
    borderRadius:     99,
    paddingVertical:  16,
    alignItems:       'center',
  },
  saveBtnText: {
    fontSize:   16,
    fontFamily: 'PlusJakartaSansBold',
    color:      '#fff',
  },
});