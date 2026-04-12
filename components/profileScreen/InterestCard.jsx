import { useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";

const MAX_PREVIEW = 5;
const PLACEHOLDER_INTERESTS = ['Art', 'Gaming', 'Cooking', 'Travel', 'Music'];

/**
 * InterestsCard
 *
 * Drop-in compatible with ProfileDetails — accepts same props as other sections:
 *   profile        — full profile object (reads profile.interests internally)
 *   onUpdateField  — (field, value) => void, called with ('interests', newArray)
 */
const InterestsCard = ({ profile = {}, onUpdateField }) => {
  const router    = useRouter();
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const preview   = interests.slice(0, MAX_PREVIEW);

  const handleRemove = (interest) => {
    const updated = interests.filter((i) => i !== interest);
    onUpdateField?.('interests', updated);
  };

  // How many empty slots to show
  const emptyCount  = Math.max(0, MAX_PREVIEW - preview.length);
  // Only show placeholders that don't clash with already-selected interests
  const placeholders = PLACEHOLDER_INTERESTS
    .filter((p) => !interests.includes(p))
    .slice(0, emptyCount);

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Interests</Text>
          <Text style={styles.subtitle}>Pick up to 5</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/InterestsScreen')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* ── Chips ── */}
      <View style={styles.chipsRow}>
        {/* Selected interests */}
        {preview.map((interest) => (
          <View key={interest} style={styles.chipSelected}>
            <Text style={styles.chipSelectedText}>{interest}</Text>
            <TouchableOpacity
              onPress={() => handleRemove(interest)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Empty slot placeholders */}
        {placeholders.map((label) => (
          <TouchableOpacity
            key={label}
            style={styles.chipEmpty}
            onPress={() => router.push('/InterestsScreen')}
          >
            <Plus size={14} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.chipEmptyText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default InterestsCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius:     12,
    marginHorizontal: 16,
    padding:          20,
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   20,
  },
  title: {
    fontSize:   20,
    fontFamily: 'PlusJakartaSansBold',
    color: '#E5E5E5',
  },
  subtitle: {
    fontSize:   13,
    fontFamily: 'PlusJakartaSans',
    color:      '#9CA3AF',
    marginTop:  2,
  },
  viewAll: {
    fontSize:   15,
    fontFamily: 'PlusJakartaSansBold',
    color:      colors.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
  },
  chipSelected: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   colors.primary,
    paddingHorizontal: 18,
    paddingVertical:   12,
    borderRadius:      99,
  },
  chipSelectedText: {
    fontSize:   15,
    fontFamily: 'PlusJakartaSansSemiBold',
    color:      '#fff',
  },
  chipEmpty: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderRadius:      99,
    borderWidth:       1,
    borderColor: '#374151',
  },
  chipEmptyText: {
    fontSize:   15,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#D1D5DB',
  },
});