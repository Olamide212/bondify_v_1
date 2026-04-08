import { Plus, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
    ActivityIndicator, StyleSheet,
    Text, TouchableOpacity, View,
} from "react-native";
import { colors } from "../../constant/colors";
import { isProfileVideo } from "../../utils/profileMedia";
import ProfileMediaView from '../ui/ProfileMediaView';

/**
 * Grid layout (6 slots total):
 *
 *  ┌──────────────┬────────┐
 *  │              │   1    │
 *  │      0       ├────────┤
 *  │  (featured)  │   2    │
 *  ├───────┬──────┴──┬─────┤
 *  │   3   │    4    │  5  │
 *  └───────┴─────────┴─────┘
 *
 *  Slot 0   : tall featured (left, spans full height of top section)
 *  Slots 1-2: stacked vertically on the right of featured
 *  Slots 3-5: 3 equal cells in the bottom row
 */

const MAX_PHOTOS = 6;
const GAP        = 8;
const RADIUS     = 14;

// ─── Individual slot ──────────────────────────────────────────────────────────
const Slot = ({
  item, index, featured,
  isAdding, removingIndex,
  onAdd, onRemove,
}) => {
  if (!item) {
    return (
      <TouchableOpacity
        style={[s.slot, featured && s.slotFeatured, s.emptySlot]}
        onPress={onAdd}
        disabled={isAdding}
        activeOpacity={0.75}
      >
        {isAdding
          ? <ActivityIndicator size="small" color={colors.primary} />
          : <View style={s.plusCircle}>
              <Plus size={featured ? 24 : 20} color={colors.primary} strokeWidth={2.5} />
            </View>
        }
      </TouchableOpacity>
    );
  }

  const isVideo = isProfileVideo(item);
  return (
    <View style={[s.slot, featured && s.slotFeatured, s.filledSlot, featured && s.slotFeaturedFilled]}>
      <ProfileMediaView
        media={item}
        containerStyle={StyleSheet.absoluteFill}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        showVideoBadge={isVideo}
        shouldPlayVideo={false}
      />
      {featured && (
        <View style={s.mainBadge}>
          <Text style={s.mainBadgeText}>Main</Text>
        </View>
      )}
      <TouchableOpacity
        style={s.removeBtn}
        onPress={() => onRemove(item, index)}
        disabled={removingIndex === index}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        {removingIndex === index
          ? <ActivityIndicator size={12} color="#fff" />
          : <X size={13} color="#fff" strokeWidth={2.8} />
        }
      </TouchableOpacity>
    </View>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const ProfilePhotoGrid = ({ photos: initialPhotos = [], onAddPhoto, onRemovePhoto }) => {
  const [isAdding,      setIsAdding]      = useState(false);
  const [removingIndex, setRemovingIndex] = useState(null);

  const slots = useMemo(() => {
    const f = [...initialPhotos];
    while (f.length < MAX_PHOTOS) f.push(null);
    return f.slice(0, MAX_PHOTOS);
  }, [initialPhotos]);

  const handleAdd    = async () => { setIsAdding(true); try { await onAddPhoto?.(); } finally { setIsAdding(false); } };
  const handleRemove = async (item, i) => { setRemovingIndex(i); try { await onRemovePhoto?.(item); } finally { setRemovingIndex(null); } };

  const sp = (index, extra = {}) => ({
    item: slots[index], index, isAdding, removingIndex,
    onAdd: handleAdd, onRemove: handleRemove,
    ...extra,
  });

  return (
    <View style={s.card}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Media</Text>
        <Text style={s.countText}>{initialPhotos.length} of {MAX_PHOTOS}</Text>
      </View>

      {/* ── Top section: featured (left) + 2 stacked (right) ── */}
      <View style={s.topRow}>

        {/* Slot 0: featured tall */}
        <View style={s.featuredCol}>
          <Slot {...sp(0, { featured: true })} />
        </View>

        {/* Slots 1-2: stacked vertically */}
        <View style={s.stackedCol}>
          <View style={s.stackedCell}>
            <Slot {...sp(1)} />
          </View>
          <View style={s.stackedCell}>
            <Slot {...sp(2)} />
          </View>
        </View>

      </View>

      {/* ── Bottom row: slots 3, 4, 5 (always 3 equal) ── */}
      <View style={s.bottomRow}>
        {[3, 4, 5].map((idx) => (
          <View key={idx} style={s.bottomCell}>
            <Slot {...sp(idx)} />
          </View>
        ))}
      </View>

    </View>
  );
};

export default ProfilePhotoGrid;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius:     12,
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    padding:          16,
  },

  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   14,
  },
  title: {
    fontSize:   18,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
  },
  countText: {
    fontSize:   13,
    fontFamily: 'OutfitMedium',
    color:      '#9CA3AF',
  },

  // ── Top section ──
  topRow: {
    flexDirection: 'row',
    gap:           GAP,
    marginBottom:  GAP,
  },
  featuredCol: {
    flex: 1.4,                 // featured takes more width
  },
  stackedCol: {
    flex:          1,
    flexDirection: 'column',
    gap:           GAP,
  },
  stackedCell: {
    flex:        1,
    aspectRatio: 1,
  },

  // ── Bottom row ──
  bottomRow: {
    flexDirection: 'row',
    gap:           GAP,
  },
  bottomCell: {
    flex:        1,
    aspectRatio: 1,
  },

  // ── Base slot ──
  slot: {
    borderRadius:    RADIUS,
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
    aspectRatio:     1,
    flex:            1,
  },
  slotFeatured: {
    aspectRatio: 0.68,  // taller than square — matches screenshot
  },
  emptySlot: {
    borderWidth:     1.5,
    borderColor: '#333333',
    borderStyle:     'dashed',
    backgroundColor: '#1E1E1E',
  },
  filledSlot: {
    borderWidth: 0,
  },
  slotFeaturedFilled: {
    borderWidth: 2.5,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },

  // ── Slot internals ──
  plusCircle: {
    width:           42,
    height:          42,
    borderRadius:    99,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
  },
  imgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  mainBadge: {
    position:          'absolute',
    bottom:            8,
    left:              8,
    backgroundColor:   'rgba(0,0,0,0.42)',
    borderRadius:      99,
    paddingHorizontal: 9,
    paddingVertical:   3,
  },
  mainBadgeText: {
    fontSize:   11,
    fontFamily: 'OutfitSemiBold',
    color:      '#fff',
  },
  removeBtn: {
    position:        'absolute',
    bottom:          8,
    right:           8,
    backgroundColor: 'rgba(0,0,0,0.46)',
    borderRadius:    99,
    padding:         5,
  },
});