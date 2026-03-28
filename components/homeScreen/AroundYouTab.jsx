/**
 * AroundYouTab.jsx
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Briefcase, Heart, Info, MapPin } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import AIService from '../../services/aiService';
import VerifiedIcon from '../ui/VerifiedIcon';

const FALLBACK_IMAGE = 'https://via.placeholder.com/800x1200?text=No+Photo';

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

const extractVoicePromptUri = (voicePrompt) => {
  if (!voicePrompt) return null;
  if (typeof voicePrompt === 'string' && voicePrompt.trim()) return voicePrompt.trim();
  if (typeof voicePrompt === 'object')
    return voicePrompt.url || voicePrompt.uri || voicePrompt.secure_url || null;
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

const AroundYouTab = ({ profile, onViewProfile, actionMessage }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [compatibilityScore, setCompatibilityScore] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const router   = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
     const verified  = profile?.verificationStatus === "approved";

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [profile?._id, profile?.id]);

  useEffect(() => {
    const fetchCompatibilityScore = async () => {
      if (!profile?._id && !profile?.id) return;
      
      setLoadingScore(true);
      try {
        const userId = profile._id || profile.id;
        const scoreData = await AIService.getCompatibilityScore(userId);
        setCompatibilityScore(scoreData.score);
      } catch (error) {
        console.error('Failed to fetch compatibility score:', error);
        setCompatibilityScore(null);
      } finally {
        setLoadingScore(false);
      }
    };

    fetchCompatibilityScore();
  }, [profile?._id, profile?.id]);

  if (!profile) return null;

  const rawImages      = Array.isArray(profile.images) ? profile.images : [];
  const imageUris      = rawImages.map(extractImageUri).filter(Boolean);
  const totalImages    = imageUris.length || 1;
  const safeIndex      = Math.min(currentImageIndex, totalImages - 1);
  const currentUri     = imageUris[safeIndex] || FALLBACK_IMAGE;
  const voicePromptUri = extractVoicePromptUri(profile.voicePrompt);
  const locationText   = formatLocation(profile.location);
  const nationalityText = profile.nationality ? String(profile.nationality).trim() : null;
  const occupationText = profile.occupation ? String(profile.occupation).trim() : null;
  const religionText = profile.religion ? String
  (profile.religion).trim() : null;

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
  const displayName    = (() => {
    const parts = String(profile.name || '').trim().split(/\s+/).filter(Boolean);
    return parts.length === 0 ? 'Unknown' : parts[0];
  })();

  const fadeTransition = (cb) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const handleTap = (event) => {
    if (totalImages <= 1) return;
    const isRight = event.nativeEvent.locationX > screenWidth / 2;
    fadeTransition(() =>
      setCurrentImageIndex((prev) =>
        isRight
          ? prev < totalImages - 1 ? prev + 1 : 0
          : prev > 0 ? prev - 1 : totalImages - 1
      )
    );
  };

  const handleNavigateToProfile = () => {
    const id = profile._id || profile.id;
    if (id) router.push(`/user-profile/${id}`);
  };

  return (
    <View style={[styles.tabContent, { height: screenHeight - 200 }]}>

      {actionMessage ? (
        <View style={styles.actionMessage}>
          <Text style={styles.actionText}>{actionMessage}</Text>
        </View>
      ) : null}

      {totalImages > 1 && (
        <View style={styles.dotsContainer}>
          {Array.from({ length: totalImages }).map((_, i) => (
            <View key={i} style={[styles.dot, i === safeIndex ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
      )}

      <TouchableWithoutFeedback onPress={handleTap}>
        <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
          <Image source={{ uri: currentUri }} style={styles.image} resizeMode="cover" />
          <View style={styles.overlay} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.bottomGradient} />

          <View style={styles.profileInfo}>
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
                <MapPin size={16} color={'#fff'} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {[distanceText, cityLabel || locationText].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
            ) : null}

            {/* Nationality
            {nationalityText ? (
              <View style={styles.nationalityRow}>
                <Text style={styles.nationalityText}>{nationalityText}</Text>
              </View>
            ) : null} */}

            <View className='flex-row items-center gap-2 mt-3'>
{/* Occupation */}
            {occupationText ? (
              <View className='px-6 py-2 flex-row items-center justify-center gap-1 bg-black/40 rounded-full'>
                    <Briefcase size={16} color='#fff' />
                <Text className='capitalize text-white font-PlusJakartaSansMedium'> {occupationText}</Text>
              </View>
            ) : null}

            {/* Religion */}
            {religionText ? (
              <View className='px-6 py-2 flex-row items-center justify-center gap-1 bg-black/40 rounded-full'>
              <MaterialCommunityIcons name="hands-pray" size={20} color="#fff" />
                <Text className='capitalize text-white font-PlusJakartaSansMedium'> {religionText}</Text>
              </View>
            ) : null}
            </View>
            

     
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: { flex: 1 },

  dotsContainer: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', gap: 4, zIndex: 20, justifyContent: 'center',
  },
  dot:         { width: 20, height: 3, borderRadius: 2 },
  dotActive:   { backgroundColor: '#fff' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.35)' },

  imageContainer: { flex: 1, position: 'relative', overflow: 'hidden' },
  image:          { width: '100%', height: '100%' },
  overlay:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.10)' },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 280 },

  actionMessage: {
    position: 'absolute', top: 100, alignSelf: 'center', zIndex: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  actionText: { color: '#333', fontSize: 16, fontWeight: '600' },

  profileInfo: { position: 'absolute', bottom: 120, left: 20, right: 20, zIndex: 10 },

  nameRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  nameLeft:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nameAgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameText:   { color: '#fff', fontSize: 36, fontFamily: 'PlusJakartaSansBold', textTransform: 'capitalize' },
  ageText:    { color: '#fff', fontSize: 30, fontFamily: 'PlusJakartaSansMedium' },

  activeStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: -2 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  activeStatusText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: 'PlusJakartaSansMedium' },

  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontFamily: 'PlusJakartaSansMedium', flex: 1 },

  nationalityRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  nationalityText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'PlusJakartaSansMedium' },

  profileButton: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
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

export default AroundYouTab;