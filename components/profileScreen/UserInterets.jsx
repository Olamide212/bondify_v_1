import { useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { Text, TouchableOpacity, View , StyleSheet } from "react-native";
import { colors } from "../../constant/colors";


/**
 * InterestsCard
 *
 * Props:
 *  - interests: string[]  — currently selected interests from profile
 *  - onRemove: (interest: string) => void  — called when user taps × on a chip
 *
 * "View All" navigates to InterestsScreen where full selection happens.
 */
const MAX_PREVIEW = 5;

const InterestsCard = ({ interests = [], onRemove }) => {
  const router   = useRouter();
  const preview  = interests.slice(0, MAX_PREVIEW);

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
        {preview.map((interest) => (
          <View key={interest} style={styles.chipSelected}>
            <Text style={styles.chipSelectedText}>{interest}</Text>
            <TouchableOpacity
              onPress={() => onRemove?.(interest)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Placeholder chips to fill up to MAX_PREVIEW slots */}
        {preview.length < MAX_PREVIEW &&
          PLACEHOLDER_INTERESTS.slice(0, MAX_PREVIEW - preview.length).map((label) => (
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

// Generic placeholder labels shown in empty slots
const PLACEHOLDER_INTERESTS = ['Art', 'Gaming', 'Cooking', 'Travel', 'Music'];

export default InterestsCard;
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
    alignItems:     'flex-start',
    marginBottom:   20,
  },
  title: {
    fontSize:   20,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
  },
  subtitle: {
    fontSize:   13,
    fontFamily: 'Outfit',
    color:      '#9CA3AF',
    marginTop:  2,
  },
  viewAll: {
    fontSize:   15,
    fontFamily: 'OutfitBold',
    color:      '#E8651A',
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
    backgroundColor:   '#E8651A',
    paddingHorizontal: 18,
    paddingVertical:   12,
    borderRadius:      99,
  },
  chipSelectedText: {
    fontSize:   15,
    fontFamily: 'OutfitSemiBold',
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
    fontFamily: 'OutfitMedium',
    color: '#D1D5DB',
  },
});