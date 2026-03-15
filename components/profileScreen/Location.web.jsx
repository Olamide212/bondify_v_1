import * as ExpoLocation from "expo-location";
import { MapPin, Navigation, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import BaseModal from "../modals/BaseModal";

const Location = ({ profile, onUpdateField }) => {
  const [isModalVisible, setIsModalVisible]     = useState(false);
  const [city, setCity]                         = useState("");
  const [stateValue, setStateValue]             = useState("");
  const [country, setCountry]                   = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSaving, setIsSaving]                 = useState(false);

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
      return;
    }
    if (typeof profile?.location === "string") {
      const [c = "", s = "", co = ""] = profile.location.split(",").map((v) => v.trim());
      setCity(c); setStateValue(s); setCountry(co);
    }
  }, [profile?.location]);

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

      const [result] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      if (result) {
        setCity(result.city || result.district || result.subregion || "");
        setStateValue(result.region || "");
        setCountry(result.country || "");
      }
    } catch {
      Alert.alert("Location error", "Could not detect your location. Try again.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSaveLocation = async () => {
    if (!city && !stateValue && !country) {
      Alert.alert("Missing location", "Enter at least one location field.");
      return;
    }
    const base    = typeof profile?.location === "object" && profile?.location ? profile.location : {};
    const payload = {
      ...base,
      city,
      state:   stateValue,
      country,
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

      {/* ── Modal ── */}
      <BaseModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} fullScreen>
        <View style={s.modal}>

          {/* Header */}
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Set Location</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color="#111" />
            </TouchableOpacity>
          </View>

          {/* GPS button */}
          <TouchableOpacity
            style={s.gpsRow}
            onPress={handleUseCurrentLocation}
            disabled={isDetectingLocation}
            activeOpacity={0.85}
          >
            {isDetectingLocation
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Navigation size={18} color={colors.primary} strokeWidth={2} />
            }
            <Text style={s.gpsText}>
              {isDetectingLocation ? "Detecting location…" : "Use my current location"}
            </Text>
          </TouchableOpacity>

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
    backgroundColor: '#FEF3EC',
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

  // ── GPS row ──
  gpsRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              10,
    marginHorizontal: 20,
    marginBottom:     16,
    paddingVertical:  12,
    paddingHorizontal: 16,
    backgroundColor:  '#FEF3EC',
    borderRadius:     12,
  },
  gpsText: {
    fontSize:   14,
    fontFamily: 'PlusJakartaSansMedium',
    color:      colors.primary,
  },

  // ── Fields ──
  fields: {
    paddingHorizontal: 20,
    paddingTop:        4,
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
