/**
 * BondupFilterModal.jsx
 *
 * Filter modal for the Bondup feed.
 * Sections:
 *   - Location (city text input)
 *   - Category (activity type multi-select chips)
 *   - Nearby (distance radius slider)
 *   - Sort by (recently added / soonest)
 */

import {
    Check,
    Clock,
    Grid3X3,
    MapPin,
    Navigation,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import BaseModal from "./BaseModal";

// ── Activity categories (matches Bondup model enum) ────────────────────────
const CATEGORIES = [
  { key: "coffee", label: "Coffee", emoji: "☕" },
  { key: "food", label: "Dining", emoji: "🍔" },
  { key: "drinks", label: "Drinks", emoji: "🍹" },
  { key: "brunch", label: "Brunch", emoji: "🥐" },
  { key: "dinner", label: "Dinner", emoji: "🍽️" },
  { key: "lunch", label: "Lunch", emoji: "🥗" },
  { key: "gym", label: "Gym", emoji: "💪" },
  { key: "yoga", label: "Yoga", emoji: "🧘" },
  { key: "running", label: "Running", emoji: "🏃" },
  { key: "hiking", label: "Hiking", emoji: "🥾" },
  { key: "cycling", label: "Cycling", emoji: "🚴" },
  { key: "swimming", label: "Swimming", emoji: "🏊" },
  { key: "walk", label: "Walking", emoji: "🚶" },
  { key: "park", label: "Park", emoji: "🌳" },
  { key: "beach", label: "Beach", emoji: "🏖️" },
  { key: "movie", label: "Cinema", emoji: "🎬" },
  { key: "concert", label: "Concert", emoji: "🎵" },
  { key: "museum", label: "Museum", emoji: "🏛️" },
  { key: "art", label: "Art", emoji: "🎨" },
  { key: "karaoke", label: "Karaoke", emoji: "🎤" },
  { key: "dancing", label: "Dancing", emoji: "💃" },
  { key: "party", label: "Party", emoji: "🎉" },
  { key: "networking", label: "Networking", emoji: "🤝" },
  { key: "photography", label: "Photography", emoji: "📷" },
  { key: "other", label: "Other", emoji: "✨" },
];

// ── Distance options ────────────────────────────────────────────────────────
const DISTANCE_OPTIONS = [
  { key: "5", label: "5 km" },
  { key: "10", label: "10 km" },
  { key: "25", label: "25 km" },
  { key: "50", label: "50 km" },
  { key: "100", label: "100 km" },
];

// ── Sort options ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { key: "newest", label: "Recently Added", icon: Clock },
  { key: "soonest", label: "Happening Soonest", icon: Navigation },
];

const BondupFilterModal = ({ visible, onClose, initialFilters, onApply }) => {
  const [city, setCity] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [distance, setDistance] = useState(null);
  const [sortBy, setSortBy] = useState("soonest");

  // Sync when modal opens
  useEffect(() => {
    if (visible && initialFilters) {
      setCity(initialFilters.city || "");
      setSelectedCategories(initialFilters.categories || []);
      setDistance(initialFilters.distance || null);
      setSortBy(initialFilters.sortBy || "soonest");
    }
  }, [visible]);

  const toggleCategory = (key) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleApply = () => {
    onApply?.({
      city: city.trim(),
      categories: selectedCategories,
      distance,
      sortBy,
    });
    onClose?.();
  };

  const handleReset = () => {
    setCity("");
    setSelectedCategories([]);
    setDistance(null);
    setSortBy("soonest");
  };

  const activeCount =
    (city.trim() ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0) +
    (distance ? 1 : 0) +
    (sortBy !== "soonest" ? 1 : 0);

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filter Bondups</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollBody}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {/* ── Location Section ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter city name..."
              placeholderTextColor="#aaa"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />
          </View>

          {/* ── Categories Section ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Grid3X3 size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Category</Text>
              {selectedCategories.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {selectedCategories.length}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.chipGrid}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategories.includes(cat.key);
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => toggleCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.chipLabel,
                        isActive && styles.chipLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                    {isActive && (
                      <Check size={14} color={colors.primary} strokeWidth={3} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Nearby (Distance) Section ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Navigation size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Nearby</Text>
            </View>
            <View style={styles.distanceRow}>
              {DISTANCE_OPTIONS.map((opt) => {
                const isActive = distance === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.distanceChip,
                      isActive && styles.distanceChipActive,
                    ]}
                    onPress={() =>
                      setDistance((prev) => (prev === opt.key ? null : opt.key))
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.distanceChipText,
                        isActive && styles.distanceChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Sort Section ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Sort By</Text>
            </View>
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortBy === opt.key;
              const IconComp = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.sortOption,
                    isActive && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy(opt.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sortOptionLeft}>
                    <View
                      style={[
                        styles.sortIconContainer,
                        isActive && styles.sortIconContainerActive,
                      ]}
                    >
                      <IconComp
                        size={16}
                        color={isActive ? "#fff" : colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.sortOptionLabel,
                        isActive && styles.sortOptionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  {isActive && (
                    <Check size={16} color={colors.primary} strokeWidth={3} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Apply Button */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
          activeOpacity={0.85}
        >
          <Text style={styles.applyButtonText}>
            Apply Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  resetText: {
    fontSize: 14,
    fontFamily: "OutfitMedium",
    color: colors.primary,
  },
  scrollBody: {
    maxHeight: 420,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "OutfitBold",
    color: '#D1D5DB',
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: "OutfitBold",
    color: "#fff",
  },

  // Text input
  textInput: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Outfit",
    color: '#E5E5E5',
    backgroundColor: '#1E1E1E',
  },

  // Category chips
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: colors.primaryLight || "#EEF2FF",
    borderColor: colors.primary,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: "OutfitMedium",
    color: '#9CA3AF',
  },
  chipLabelActive: {
    color: colors.primary,
    fontFamily: "OutfitBold",
  },

  // Distance
  distanceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  distanceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  distanceChipActive: {
    backgroundColor: colors.primaryLight || "#EEF2FF",
    borderColor: colors.primary,
  },
  distanceChipText: {
    fontSize: 13,
    fontFamily: "OutfitMedium",
    color: '#9CA3AF',
  },
  distanceChipTextActive: {
    color: colors.primary,
    fontFamily: "OutfitBold",
  },

  // Sort options
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    borderWidth: 1.5,
    borderColor: "transparent",
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: colors.primaryLight || "#EEF2FF",
    borderColor: colors.primary,
  },
  sortOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sortIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight || "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sortIconContainerActive: {
    backgroundColor: colors.primary,
  },
  sortOptionLabel: {
    fontSize: 14,
    fontFamily: "OutfitMedium",
    color: '#D1D5DB',
  },
  sortOptionLabelActive: {
    color: colors.primary,
    fontFamily: "OutfitBold",
  },

  // Apply button
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: "OutfitBold",
    color: "#fff",
  },
});

export default BondupFilterModal;
