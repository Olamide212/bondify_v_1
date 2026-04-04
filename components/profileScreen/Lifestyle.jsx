import { useRouter } from "expo-router";
import { Cigarette, Dumbbell, PawPrint, Wine } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";

/**
 * LifestyleCard
 *
 * Shows a compact 2-column grid of the four lifestyle fields:
 * exercise, drinking, smoking, pets — each with an icon + label chip.
 *
 * Props:
 *  - profile: object  — the user's profile data
 *  - onEdit: () => void  — called when "Edit" is tapped (can also navigate to MyInfo)
 */

// Maps a raw DB value → a short human-friendly display label
const SHORT_LABEL = {
  // exercise
  Never:     'Rarely active',
  Rarely:    'Rarely active',
  Sometimes: 'Active sometimes',
  Often:     'Gym goer',
  Daily:     'Daily trainer',
  // drinking
  "No, I don't drink": 'Non-drinker',
  Socially:            'Social drinker',
  Regularly:           'Regular drinker',
  // smoking
  "No, I don't smoke": 'Non-smoker',
  Occasionally:        'Occasional smoker',
  // pets
  'I have pets':       'Pet owner',
  'I want pets':       'Wants pets',
  "I don't want pets": 'No pets',
  'Allergic to pets':  'Pet allergy',
  'Prefer not to say': null, // hide if not set / prefer not to say
};

const shorten = (val) => {
  if (!val) return null;
  return SHORT_LABEL[val] ?? val;
};

const LIFESTYLE_ITEMS = [
  { field: 'exercise', icon: Dumbbell },
  { field: 'drinking', icon: Wine     },
  { field: 'smoking',  icon: Cigarette },
  { field: 'pets',     icon: PawPrint  },
];

const LifestyleCard = ({ profile = {}, onEdit }) => {
  const router = useRouter();

  const visibleItems = LIFESTYLE_ITEMS
    .map(({ field, icon }) => ({ label: shorten(profile[field]), icon }))
    .filter(({ label }) => label && label !== 'Prefer not to say');

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Lifestyle</Text>
        <TouchableOpacity onPress={onEdit ?? (() => {})}>
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* ── 2-column chip grid ── */}
      {visibleItems.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyState}
          onPress={onEdit ?? (() => {})}
        >
          <Text style={styles.emptyText}>Add your lifestyle details</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.grid}>
          {visibleItems.map(({ label, icon: Icon }, i) => (
            <View key={i} style={styles.chip}>
              <Icon size={16} color={colors.primary} strokeWidth={1.8} />
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default LifestyleCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121212',
    borderRadius:     16,
    marginHorizontal: 16,
    marginTop:        16,
    padding:          20,
    borderWidth:      1,
    borderColor:      '#F3F4F6',
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   16,
  },
  title: {
    fontSize:   20,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
  },
  editBtn: {
    fontSize:   15,
    fontFamily: 'OutfitBold',
    color:      '#E8651A',
  },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
  },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderRadius:      99,
    // each chip takes ~half the row
    minWidth:          '46%',
    flexShrink:        1,
  },
  chipText: {
    fontSize:   14,
    fontFamily: 'OutfitMedium',
    color: '#D1D5DB',
    flexShrink: 1,
  },
  emptyState: {
    paddingVertical: 16,
    alignItems:      'center',
  },
  emptyText: {
    fontSize:   14,
    fontFamily: 'Outfit',
    color:      '#9CA3AF',
  },
});