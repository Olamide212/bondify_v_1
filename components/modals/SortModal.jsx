/**
 * SortModal.jsx
 *
 * Modal for sorting profiles in the discovery feed.
 * Options:
 *   - Age: youngest to oldest
 *   - Age: oldest to youngest
 *   - I'm in all their filters
 *   - Distance: closest first
 *   - Available chat slot
 *   - Just joined
 *   - Recently active
 */

import { ArrowDownNarrowWide, ArrowUpNarrowWide, Calendar, Check, Clock, MapPin, MessageCircle, Target } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import BaseModal from "./BaseModal";

const SORT_OPTIONS = [
  {
    id: "age_youngest",
    label: "Age: youngest to oldest",
    icon: ArrowUpNarrowWide,
  },
  {
    id: "age_oldest",
    label: "Age: oldest to youngest",
    icon: ArrowDownNarrowWide,
  },
  {
    id: "in_their_filters",
    label: "I'm in all their filters",
    icon: Target,
  },
  {
    id: "distance_closest",
    label: "Distance: closest first",
    icon: MapPin,
  },
  {
    id: "available_chat_slot",
    label: "Available chat slot",
    icon: MessageCircle,
  },
  {
    id: "just_joined",
    label: "Just joined",
    icon: Calendar,
  },
  {
    id: "recently_active",
    label: "Recently active",
    icon: Clock,
  },
];

const SortModal = ({ visible, onClose, initialSort, onApply }) => {
  const [selectedSort, setSelectedSort] = useState(initialSort || null);

  // Sync state when modal opens or initialSort changes
  useEffect(() => {
    if (visible) {
      setSelectedSort(initialSort || null);
    }
  }, [visible, initialSort]);

  const handleConfirm = () => {
    onApply?.(selectedSort);
    onClose?.();
  };

  const handleReset = () => {
    setSelectedSort(null);
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sort Profiles</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Sort Options */}
        <View style={styles.optionsContainer}>
          {SORT_OPTIONS.map((option) => {
            const isSelected = selectedSort === option.id;
            const IconComponent = option.icon;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  isSelected && styles.optionItemSelected,
                ]}
                onPress={() => setSelectedSort(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      isSelected && styles.iconContainerSelected,
                    ]}
                  >
                    <IconComponent
                      size={18}
                      color={isSelected ? "#fff" : colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <Check size={18} color={colors.primary} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: "OutfitBold",
    color: "#fff",
  },
  resetText: {
    fontSize: 14,
    fontFamily: "OutfitMedium",
    color: colors.primary,
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  optionItemSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerSelected: {
    backgroundColor: colors.primary,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: "Outfit",
    color: "#fff",
  },
  optionLabelSelected: {
    color: colors.primary,
    fontFamily: "Outfit-SemiBold",
  },
  checkIcon: {
    marginRight: 4,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 24,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#fff",
  },
});

export default SortModal;
