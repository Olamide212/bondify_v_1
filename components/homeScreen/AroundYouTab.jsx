/**
 * AroundYouTab.jsx
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Briefcase, Eye, Globe, Heart, Info, MapPin, RotateCcw, Users } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  InteractionManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { colors } from '../../constant/colors';
import AIService from '../../services/aiService';
import LoadingImage from '../ui/LoadingImage';
import VerifiedIcon from '../ui/VerifiedIcon';

const FALLBACK_IMAGE = 'https://via.placeholder.com/800x1200?text=No+Photo';
const compatibilityScoreCache = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatLocation = (location) => {
  if (!location) return null;
  if (typeof location === 'string' && location.trim()) return location.trim();
  if (typeof location === 'object') {
    const parts = [location.city, location.state, location.country].filter(
      (v) => typeof v === 'string' && v.trim()
    );
    return parts.length > 0 ? parts.join(', ') : null;
  }
  return null;
};

const extractImageUri = (item) => {
  if (!item) return null;
  if (typeof item === 'string' && item.length > 0) return item;
  if (typeof item === 'object')
    return item.url || item.uri || item.secure_url || item.imageUrl || item.src || null;
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

const AroundYouTab = ({ profile, onViewProfile, actionMessage, onRewind, rewindAvailable }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [compatibilityScore, setCompatibilityScore] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Zoom state
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [lastScale, setLastScale] = useState(1);
  const [panEnabled, setPanEnabled] = useState(false);
  const panRef = useRef(null);
  const pinchRef = useRef(null);

  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const verified = profile?.verificationStatus === "approved";

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [profile?._id, profile?.id]);

  useEffect(() => {
    const fetchCompatibilityScore = async () => {
      if (!profile?._id && !profile?.id) {
        setCompatibilityScore(null);
        setLoadingScore(false);
        return;
      }

      const userId = profile._id || profile.id;

      if (compatibilityScoreCache.has(userId)) {
        setCompatibilityScore(compatibilityScoreCache.get(userId));
        setLoadingScore(false);
        return;
      }

      setLoadingScore(true);
      try {
        const scoreData = await AIService.getCompatibilityScore(userId);
        const score = scoreData?.score ?? null;
        compatibilityScoreCache.set(userId, score);
        setCompatibilityScore(score);
      } catch (error) {
        console.error('Failed to fetch compatibility score:', error);
        setCompatibilityScore(null);
      } finally {
        setLoadingScore(false);
      }
    };

    let isCancelled = false;

    const task = InteractionManager.runAfterInteractions(() => {
      if (isCancelled) return;
      fetchCompatibilityScore();
    });

    return () => {
      isCancelled = true;
      task?.cancel?.();
    };
  }, [profile?._id, profile?.id]);

  if (!profile) return null;

  const rawImages = Array.isArray(profile.images) ? profile.images : [];
  const imageUris = rawImages.map(extractImageUri).filter(Boolean);
  const totalImages = imageUris.length || 1;
  const safeIndex = Math.min(currentImageIndex, totalImages - 1);
  const currentUri = imageUris[safeIndex] || FALLBACK_IMAGE;
  const locationText = formatLocation(profile.location);
  const nationalityText = profile.nationality ? String(profile.nationality).trim() : null;
  const occupationText = profile.occupation ? String(profile.occupation).trim() : null;
  const religionText = profile.religion ? String
    (profile.religion).trim() : null;
    const ethnicityText = profile.ethnicity ? String(profile.ethnicity).trim() : null;

  // Format distance like "641km away"
  const distanceText = (() => {
    if (!profile.distance) return null;
    const d = profile.distance;
    if (typeof d === 'number') return `${Math.round(d)}km away`;
    if (typeof d === 'string') {
      // Already formatted (e.g. "641km away" or "641 km")
      if (/away/i.test(d)) return d;
      const num = parseFloat(d);
      if (!isNaN(num)) return `${Math.round(num)}km away`;
      // Unknown format — show as-is only if it looks like a distance
      if (/^\d/.test(d)) return `${d} away`;
    }
    return null;
  })();

  // City-only label from location
  const cityLabel = (() => {
    if (!profile.location) return null;
    if (typeof profile.location === 'object') {
      return profile.location.city || profile.location.state || null;
    }
    return null;
  })();
  const displayName = (() => {
    const parts = String(profile.name || '').trim().split(/\s+/).filter(Boolean);
    return parts.length === 0 ? 'Unknown' : parts[0];
  })();

  // Pinch gesture handler for zoom
  const onPinchGestureEvent = (event) => {
    const newScale = lastScale * event.nativeEvent.scale;
    // Limit zoom between 1x and 3x
    const clampedScale = Math.max(1, Math.min(3, newScale));
    scaleAnim.setValue(clampedScale);
    setPanEnabled(clampedScale > 1);
  };

  const onPinchHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      setLastScale(scaleAnim._value);
    }
  };

  // Pan gesture handler for moving zoomed image
  const onPanGestureEvent = (event) => {
    if (!panEnabled) return;
    // Pan logic can be added here if needed for moving the image
  };

  const handleNavigateToProfile = () => {
    const id = profile._id || profile.id;
    if (id) router.push(`/user-profile/${id}`);
  };

  return (
    <View style={[styles.tabContent, { height: screenHeight * 0.75 }]}>

      {actionMessage ? (
        <View style={styles.actionMessage}>
          <Text style={styles.actionText}>{actionMessage}</Text>
        </View>
      ) : null}

      <PinchGestureHandler
        ref={pinchRef}
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchHandlerStateChange}
        simultaneousHandlers={panRef}
      >
        <PanGestureHandler
          ref={panRef}
          onGestureEvent={onPanGestureEvent}
          simultaneousHandlers={pinchRef}
          enabled={panEnabled}
        >
          <Animated.View style={[styles.imageContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <LoadingImage
              key={`${profile._id || profile.id}-${currentUri}`}
              source={{ uri: currentUri }}
              style={styles.image}
              containerStyle={StyleSheet.absoluteFillObject}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              blurRadius={profile.blurPhotos ? 25 : 0}
              indicatorColor="#fff"
              indicatorSize="large"
              opaqueLoader={true}
            />
            <View style={styles.overlay} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.bottomGradient} />

            {/* Blur badge overlay */}
            {profile.blurPhotos && (
              <View style={styles.blurBadge}>
                <Eye size={16} color="#fff" />
                <Text style={styles.blurBadgeText}>Photos are blurred</Text>
              </View>
            )}

            {/* Rewind button - top right corner */}
            {rewindAvailable && onRewind && (
              <TouchableOpacity
                style={styles.rewindButton}
                onPress={onRewind}
                activeOpacity={0.8}
              >
                <BlurView intensity={30} tint="dark" style={styles.rewindBlur}>
                  <RotateCcw size={18} color="#FCD34D" strokeWidth={2.5} />
                </BlurView>
              </TouchableOpacity>
            )}

            <View style={[styles.profileInfo, { bottom: screenHeight < 760 ? 205 : 180 }]}>
            <View className="flex-row items-center gap-2 mb-3">
              {/* Compatibility Score */}
              {compatibilityScore !== null && !loadingScore && (
                <View className="flex-row items-center bg-pinkColor px-3 py-1 rounded-full">
                  <Heart size={14} color="#fff" fill="#fff" />
                  <Text className="text-white text-sm font-PlusJakartaSansBold ml-1">
                    {compatibilityScore}%
                  </Text>
                </View>
              )}
            </View>


            {/* Name + age + verified + compatibility score */}
            <View style={styles.nameRow}>
              <View style={styles.nameLeft}>
                <View style={styles.nameAgeRow}>
                  <Text style={styles.nameText} numberOfLines={1}>{displayName},</Text>
                  {profile.age ? <Text style={styles.ageText}>{profile.age}</Text> : null}
                </View>
                {verified &&
                  <View style={{ marginLeft: 6 }}><VerifiedIcon /></View>
                }
              </View>


              <TouchableOpacity style={styles.profileButton} onPress={handleNavigateToProfile}>
                <Info size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Active status indicator */}
            {profile.isActive ? (
              <View style={styles.activeStatusBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeStatusText}>Active today</Text>
              </View>
            ) : null}

            {/* Voice prompt */}
            {/* {voicePromptUri ? (
              <View style={{ marginBottom: 10, marginTop: 4 }}>
                <VoicePromptButton uri={voicePromptUri} />
              </View>
            ) : null} */}

            {/* Location — "641km away · Lagos" */}
            {(distanceText || cityLabel || locationText) ? (
              <View style={styles.locationRow} className=''>
                <MapPin size={16} color={colors.white}  />
                <Text style={styles.locationText} numberOfLines={1}>
                  {[distanceText, cityLabel || locationText].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
            ) : null}


            <View className='flex-row flex-wrap items-center gap-2 mt-3'>
             
              {occupationText ? (
                <View className='px-6 py-2 flex-row items-center justify-center gap-1 bg-black/40 rounded-lg' style={{  backgroundColor: 'rgba(255,255,255,0.20)'}}>
                  <Briefcase size={16} color={colors.white} />
                  <Text className='capitalize text-white font-PlusJakartaSansMedium'> {occupationText}</Text>
                </View>
              ) : null}

           
              {nationalityText ? (
                <View className='px-6 py-2 flex-row items-center justify-center gap-1 bg-black/40 rounded-lg' style={{  backgroundColor: 'rgba(255,255,255,0.20)'}}>
                  <Globe size={16} color={colors.white} />
                  <Text className='capitalize text-white font-PlusJakartaSansMedium'> {nationalityText}</Text>
                </View>
              ) : null}

          
              {ethnicityText ? (
                <View className='px-6 py-2 flex-row items-center justify-center gap-1 bg-black/40 rounded-lg' style={{  backgroundColor: 'rgba(255,255,255,0.20)'}}>
                  <Users size={16} color={colors.white} />
                  <Text className='capitalize text-white font-PlusJakartaSansMedium'> {ethnicityText}</Text>
                </View>
              ) : null}

         
              {religionText ? (
                <View className='px-6 py-2 flex-row items-center justify-center gap-1 bg-black/40 rounded-lg' style={{  backgroundColor: 'rgba(255,255,255,0.20)'}}>
                  <MaterialCommunityIcons name="hands-pray" size={20} color={colors.white} />
                  <Text className='capitalize text-white font-PlusJakartaSansMedium'> {religionText}</Text>
                </View>
              ) : null}
            </View>



          </View>
        </Animated.View>
        </PanGestureHandler>
      </PinchGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    marginTop: 115, // Add margin top to reduce visible height
    backgroundColor: colors.background, // Dark background

  },

  dotsContainer: {
    position: 'absolute', top: 20, right: 16,
    flexDirection: 'row', gap: 4, zIndex: 20, justifyContent: 'center',
  },
  dot: { width: 20, height: 3, borderRadius: 2 },
  dotActive: { backgroundColor: '#121212' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.35)' },

  imageContainer: {
    flex: 1, position: 'relative', overflow: 'hidden', borderTopLeftRadius: 20, // Added top border radius
    borderTopRightRadius: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20, // Added top border radius
    borderTopRightRadius: 20, // Added top border radius
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.10)' },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 280 },

  actionMessage: {
    position: 'absolute', top: 100, alignSelf: 'center', zIndex: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  actionText: { color: '#D1D5DB', fontSize: 16, fontWeight: '600' },

  profileInfo: { position: 'absolute', left: 20, right: 20, zIndex: 10 },

  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  nameLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nameAgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameText: { color: '#fff', fontSize: 36, fontFamily: 'PlusJakartaSansBold', textTransform: 'capitalize' },
  ageText: { color: '#fff', fontSize: 30, fontFamily: 'PlusJakartaSansMedium' },

  activeStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: -2 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  activeStatusText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: 'PlusJakartaSansMedium' },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontFamily: 'PlusJakartaSansMedium', flex: 1 },

  nationalityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  nationalityText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'PlusJakartaSansMedium' },

  profileButton: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
  },

  blurBadge: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 30,
  },
  blurBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSansSemiBold',
  },

  rewindButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(252, 211, 77, 0.4)',
  },
  rewindBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  compatibilityScore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 102, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 8,
  },
  compatibilityText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
    marginLeft: 4,
  },
});

export default React.memo(AroundYouTab, (prevProps, nextProps) => {
  const prevId = prevProps.profile?._id || prevProps.profile?.id;
  const nextId = nextProps.profile?._id || nextProps.profile?.id;

  return (
    prevId === nextId &&
    prevProps.profile?.blurPhotos === nextProps.profile?.blurPhotos &&
    prevProps.profile?.distance === nextProps.profile?.distance &&
    prevProps.rewindAvailable === nextProps.rewindAvailable
  );
});