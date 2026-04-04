/**
 * EmptyDeckSlider.jsx
 *
 * Shown on the Home screen when the discovery deck runs out.
 * Lets the user expand their search radius (in km) and refresh.
 *
 * Props:
 *   onRefresh(newDistanceKm: number) — called when user taps "Find People"
 *   loading: boolean
 *   currentDistance?: number  — current filter distance in km (default 50)
 */

import Slider from "@react-native-community/slider";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import LogoLoader from "../ui/LogoLoader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BRAND = colors.primary || "#EE5F2B";

const PRESETS = [5,10, 25, 50, 100, 250, 500];

const formatKm = (km) => (km >= 500 ? "Anywhere" : `${km} km`);

// ─── Quick preset chip ────────────────────────────────────────────────────────
const PresetChip = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const EmptyDeckSlider = ({ onRefresh, loading, currentDistance = 50 }) => {
  const [distance, setDistance] = useState(Math.max(currentDistance, 10));

  useEffect(() => {
    setDistance(Math.max(currentDistance, 10));
  }, [currentDistance]);

  // ── Entrance animations ──────────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const cardAnim  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleRefresh = () => {
    if (!loading) onRefresh?.(distance);
  };


  



  return (
    <View style={styles.container}>
      {/* ── Loader overlay when searching ────────────────────────────── */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <LogoLoader color={BRAND} size={80} />
        </View>
      )}

      {/* ── Heading ─────────────────────────────────────────────────────── */}
      <Animated.View
        style={{
          opacity:   fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignItems: "center",
        }}
      >
        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.heading}>You&apos;re all caught up!</Text>
        <Text style={styles.subheading}>
          Expand your search radius to discover more people near you.
        </Text>
      </Animated.View>

      {/* ── Distance card ────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.card,
          { 
            opacity: loading ? 0.3 : cardAnim, 
            transform: [{ translateY: cardSlide }] 
          },
          loading && styles.cardDisabled,
        ]}
      >
        {/* Readout */}
        <View style={styles.readoutRow}>
          <Text style={styles.readoutLabel}>Search radius</Text>
          <View style={styles.readoutBadge}>
            <Text style={styles.readoutValue}>{formatKm(distance)}</Text>
          </View>
        </View>

        {/* Slider */}
        <Slider
          style={styles.slider}
          minimumValue={2}
          maximumValue={500}
          step={5}
          value={distance}
          onValueChange={setDistance}
          minimumTrackTintColor={BRAND}
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor={BRAND}
        />

        {/* Min / max labels */}
        <View style={styles.sliderEdges}>
          <Text style={styles.sliderEdgeText}>10 km</Text>
          <Text style={styles.sliderEdgeText}>Anywhere</Text>
        </View>

        {/* Quick preset chips */}
        <View style={styles.chipsRow}>
          {PRESETS.map((km) => (
            <PresetChip
              key={km}
              label={formatKm(km)}
              active={distance === km}
              onPress={() => setDistance(km)}
            />
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRefresh}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {loading ? "Looking…" : `Find people within ${formatKm(distance)}`}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_W = SCREEN_WIDTH - 48;

const styles = StyleSheet.create({
  container: {
    flex:              1,
    justifyContent:    "center",
    alignItems:        "center",
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    gap:               28,
  },

  // Heading
  emoji: {
    fontSize:     40,
    marginBottom: 8,
  },
  heading: {
    fontSize:     22,
    fontFamily:   "OutfitBold",
    color: '#E5E5E5',
    textAlign:    "center",
    marginBottom: 6,
  },
  subheading: {
    fontSize:   14,
    fontFamily: "Outfit",
    color:      "#888",
    textAlign:  "center",
    lineHeight: 20,
  },

  // Card
  card: {
    width:           CARD_W,
     backgroundColor: 'rgba(255,255,255,0.02)',
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
    // shadowColor:     "#000",
    // shadowOffset:    { width: 0, height: 2 },
    // shadowOpacity:   0.06,
    // shadowRadius:    10,
    // elevation:       3,
  },

  cardDisabled: {
    pointerEvents: "none",
  },

  // Readout row
  readoutRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    marginBottom:   8,
  },
  readoutLabel: {
    fontSize:   15,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  readoutBadge: {
    backgroundColor:  `${BRAND}18`,
    borderRadius:     99,
    paddingVertical:   4,
    paddingHorizontal: 12,
  },
  readoutValue: {
    fontSize:   15,
    fontFamily: "OutfitBold",
    color:      BRAND,
  },

  // Slider
  slider: {
    width:  "100%",
    height: 44,
  },
  sliderEdges: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginTop:      -4,
    marginBottom:   14,
    paddingHorizontal: 2,
  },
  sliderEdgeText: {
    fontSize:   11,
    fontFamily: "Outfit",
    color:      "#ccc",
  },

  // Preset chips
  chipsRow: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           8,
    marginBottom:  16,
  },
  chip: {
    paddingVertical:   5,
    paddingHorizontal: 12,
    borderRadius:      99,
    backgroundColor: '#1E1E1E',
    borderWidth:       1,
    borderColor: '#374151',
  },
  chipActive: {
    backgroundColor: `${BRAND}18`,
    borderColor:     BRAND,
  },
  chipText: {
    fontSize:   12,
    fontFamily: "OutfitMedium",
    color: '#9CA3AF',
  },
  chipTextActive: {
    color:      BRAND,
    fontFamily: "OutfitBold",
  },

  // CTA
  btn: {
    backgroundColor: colors.primary,
    borderRadius:    99,
    paddingVertical: 14,
    alignItems:      "center",
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnText: {
    fontSize:   15,
    fontFamily: "OutfitBold",
    color:      "#fff",
  },

  // Loader overlay
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems:     "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius:    20,
    zIndex:          999,
  },
});

export default EmptyDeckSlider;