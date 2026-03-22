/**
 * BondupDetailModal.jsx  —  Artistic redesign
 */

import * as ExpoLocation from 'expo-location';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bookmark,
  Clock,
  MessageCircle,
  Navigation,
  Share2,
  Trash2,
  Users
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '../../constant/colors';
import BaseModal from '../modals/BaseModal';

const BRAND = colors.primary;

const ACTIVITY_EMOJI = {
  coffee: '☕',
  food:   '🍔',
  drinks: '🍹',
  gym:    '💪',
  walk:   '🚶',
  movie:  '🎬',
  other:  '✨',
};

const ACTIVITY_LABEL = {
  coffee: 'Coffee',
  food:   'Dining',
  drinks: 'Drinks',
  gym:    'Gym',
  walk:   'Outdoor',
  movie:  'Cinema',
  other:  'Other',
};

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const d = new Date(dateTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (dDay.getTime() === today.getTime()) return `Today at ${timeStr}`;
  if (dDay.getTime() === tomorrow.getTime()) return `Tomorrow at ${timeStr}`;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' }) + ` at ${timeStr}`;
};

const isLiveNow = (dateTime) => {
  if (!dateTime) return false;
  return Math.abs(new Date(dateTime) - new Date()) <= 2 * 60 * 60 * 1000;
};

const getFullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

// ─── Location Card with real map ─────────────────────────────────────────────
function LocationCard({ bondup }) {
  const [coords, setCoords] = useState(null);
  const [geocoding, setGeocoding] = useState(true);

  const locationText = [bondup.location, bondup.city].filter(Boolean).join(', ');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const results = await ExpoLocation.geocodeAsync(locationText);
        if (!cancelled && results?.length > 0) {
          setCoords({ latitude: results[0].latitude, longitude: results[0].longitude });
        }
      } catch {
        // geocoding failed — show fallback
      } finally {
        if (!cancelled) setGeocoding(false);
      }
    })();
    return () => { cancelled = true; };
  }, [locationText]);

  const openInMaps = () => {
    if (!coords) return;
    const label = encodeURIComponent(locationText);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${coords.latitude},${coords.longitude}`,
      android: `geo:${coords.latitude},${coords.longitude}?q=${coords.latitude},${coords.longitude}(${label})`,
    });
    Linking.openURL(url);
  };

  return (
    <View style={s.locationCard}>
      <View style={s.locationCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.locationLabel}>LOCATION</Text>
          <Text style={s.locationValue}>{locationText}</Text>
        </View>
        <TouchableOpacity
          style={[s.navIconBtn, !coords && { opacity: 0.4 }]}
          onPress={openInMaps}
          disabled={!coords}
        >
          <Navigation size={18} color={BRAND} />
        </TouchableOpacity>
      </View>

      {geocoding ? (
        <View style={s.mapPlaceholder}>
          <ActivityIndicator size="small" color={BRAND} />
          <Text style={s.mapPlaceholderText}>Loading map…</Text>
        </View>
      ) : coords ? (
        <View style={s.mapContainer}>
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              ...coords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            onPress={openInMaps}
          >
            <Marker coordinate={coords} pinColor={BRAND} />
          </MapView>
        </View>
      ) : (
        <TouchableOpacity style={s.mapPlaceholder} onPress={openInMaps} activeOpacity={0.7}>
          <Text style={s.mapEmoji}>🗺️</Text>
          <Text style={s.mapPlaceholderText}>{locationText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function BondupDetailModal({
  visible,
  bondup,
  currentUserId,
  onClose,
  onJoin,
  onLeave,
  onDelete,
  onStartChat,
  joinLoading,
}) {
  const router = useRouter();
  if (!bondup) return null;

  const creator = bondup.createdBy;
  const creatorAv = avatarUrl(creator);
  const creatorId = creator?._id || creator;
  const participantCount = bondup.participants?.length ?? 0;
  const isFull = bondup.maxParticipants != null && participantCount >= bondup.maxParticipants;
  const isOwner = bondup.isOwner || String(creatorId) === String(currentUserId);
  const hasJoined = bondup.hasJoined;
  const canChat = isOwner || hasJoined;
  const activityEmoji = ACTIVITY_EMOJI[bondup.activityType] || '✨';
  const activityLabel = ACTIVITY_LABEL[bondup.activityType] || bondup.activityType;
  const live = isLiveNow(bondup.dateTime);
  const isTrending = live || participantCount >= 3;

  const spotsText = bondup.maxParticipants
    ? `${participantCount}/${bondup.maxParticipants}`
    : `${participantCount}`;

  // Show up to 6 participant avatars
  const shownAvatars = (bondup.participants || []).slice(0, 6);
  const extraCount = Math.max(0, participantCount - 6);

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={onClose} style={s.iconBtn} hitSlop={10}>
          <ArrowLeft size={22} color="#333" />
        </TouchableOpacity>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.iconBtn}
            hitSlop={10}
            onPress={async () => {
              try {
                const title = bondup?.title || 'Check out this Bondup!';
                const creator = bondup?.creator?.firstName || 'Someone';
                const activity = bondup?.activityType ? ` — ${bondup.activityType}` : '';
                const location = bondup?.location ? ` at ${bondup.location}` : '';
                await Share.share({
                  message: `${creator} posted a Bondup: "${title}"${activity}${location}. Join them on Bondies!`,
                });
              } catch {
                // user cancelled or share failed
              }
            }}
          >
            <Share2 size={20} color="#555" />
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => {
                Alert.alert('Remove Bondup', 'Remove this Bondup?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => { onClose?.(); onDelete?.(bondup._id); } },
                ]);
              }}
              hitSlop={10}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
          {/* {!isOwner && (
            <TouchableOpacity style={s.iconBtn} hitSlop={10}>
              <MoreVertical size={20} color="#555" />
            </TouchableOpacity>
          )} */}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Trending badge ── */}
        {isTrending && (
          <View style={s.trendingBadge}>
            <Text style={s.trendingText}>🔥 TRENDING NOW</Text>
          </View>
        )}

        {/* ── Title + description ── */}
        <View style={s.titleSection}>
          <Text style={s.title}>{bondup.title}</Text>
          {!!bondup.description && (
            <Text style={s.description}>{bondup.description}</Text>
          )}
        </View>

        {/* ── Hosted by card ── */}
        <View style={s.hostedCard}>
          <TouchableOpacity
            style={s.hostedAvatarBtn}
            onPress={() => creatorId && router.push(`/social-profile/${creatorId}`)}
            activeOpacity={0.8}
          >
            {creatorAv ? (
              <Image source={{ uri: creatorAv }} style={s.hostedAvatar} />
            ) : (
              <View style={[s.hostedAvatar, s.hostedAvatarFallback]}>
                <Text style={s.hostedAvatarInitial}>
                  {(creator?.firstName || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={s.hostedInfo}>
            <Text style={s.hostedLabel}>HOSTED BY</Text>
            <Text style={s.hostedName}>{getFullName(creator)}</Text>
            <Text style={s.hostedSubtitle}>
              {creator?.socialProfile?.bio || 'Bondup Creator'}
            </Text>
          </View>
          {!isOwner && (
            <TouchableOpacity
              style={s.messageIconBtn}
              onPress={() => canChat && onStartChat?.(bondup)}
              activeOpacity={0.8}
            >
              <MessageCircle size={20} color={BRAND} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── WHEN + TYPE side by side ── */}
        <View style={s.metaPairRow}>
          <View style={s.metaPairCard}>
            <View style={s.metaPairIconCircle}>
              <Clock size={16} color={BRAND} />
            </View>
            <Text style={s.metaPairLabel}>WHEN</Text>
            <Text style={s.metaPairValue}>{formatDateTime(bondup.dateTime)}</Text>
          </View>
          <View style={[s.metaPairCard, s.metaPairCardRight]}>
            <View style={s.metaPairIconCircleLight}>
              <Text style={s.metaPairEmoji}>{activityEmoji}</Text>
            </View>
            <Text style={s.metaPairLabel}>TYPE</Text>
            <Text style={s.metaPairValue}>{activityLabel}</Text>
          </View>
        </View>

        {/* ── Location card ── */}
        {(!!bondup.location || !!bondup.city) && (
          <LocationCard bondup={bondup} />
        )}

        {/* ── Who's coming ── */}
        <View style={s.whoSection}>
          <View style={s.whoHeader}>
            <Text style={s.whoTitle}>
              Who&apos;s Coming{' '}
              <Text style={s.whoCount}>
                ({spotsText}{bondup.maxParticipants ? '' : ' joined'})
              </Text>
            </Text>
            {participantCount > 6 && (
              <TouchableOpacity>
                <Text style={s.viewAllText}>View all</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.avatarOverlapRow}>
            {shownAvatars.map((pt, i) => {
              const u = pt.user;
              const uAv = avatarUrl(u);
              return uAv ? (
                <Image
                  key={i}
                  source={{ uri: uAv }}
                  style={[s.participantAvatar, { marginLeft: i > 0 ? -10 : 0, zIndex: shownAvatars.length - i }]}
                />
              ) : (
                <View
                  key={i}
                  style={[s.participantAvatar, s.participantAvatarFallback, { marginLeft: i > 0 ? -10 : 0, zIndex: shownAvatars.length - i }]}
                >
                  <Text style={s.participantAvatarInitial}>
                    {(u?.firstName || '?')[0].toUpperCase()}
                  </Text>
                </View>
              );
            })}
            {extraCount > 0 && (
              <View style={[s.participantAvatar, s.extraAvatar, { marginLeft: -10 }]}>
                <Text style={s.extraAvatarText}>+{extraCount}</Text>
              </View>
            )}
          </View>

          {participantCount > 0 && (
            <Text style={s.joinedFriendsText}>
              <Users size={13} color="#888" /> {participantCount} {participantCount === 1 ? 'person' : 'people'} joined
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ── Footer buttons ── */}
      <View style={s.footer}>
        {!isOwner ? (
          <>
            {hasJoined ? (
              <TouchableOpacity
                style={s.primaryBtn}
                onPress={() => onStartChat?.(bondup)}
                activeOpacity={0.85}
              >
                <MessageCircle size={18} color="#fff" />
                <Text style={s.primaryBtnText}>Open Chat</Text>
              </TouchableOpacity>
            ) : isFull ? (
              <View style={[s.primaryBtn, s.disabledBtn]}>
                <Text style={s.disabledBtnText}>Bondup is Full</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[s.primaryBtn, joinLoading && { opacity: 0.7 }]}
                onPress={() => onJoin?.(bondup._id)}
                disabled={joinLoading}
                activeOpacity={0.85}
              >
                {joinLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.primaryBtnText}>🔥 Join Bondup</Text>
                )}
              </TouchableOpacity>
            )}

            {hasJoined ? (
              <TouchableOpacity
                style={s.secondaryBtn}
                onPress={() => {
                  Alert.alert('Leave Bondup', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Leave', style: 'destructive', onPress: () => onLeave?.(bondup._id) },
                  ]);
                }}
                activeOpacity={0.8}
              >
                <Text style={s.secondaryBtnText}>Leave</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.bookmarkBtn} activeOpacity={0.8}>
                <Bookmark size={20} color="#666" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => onStartChat?.(bondup)}
              activeOpacity={0.85}
            >
              <MessageCircle size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Open Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => {
                Alert.alert('Delete Bondup', 'Remove this Bondup?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => { onClose?.(); onDelete?.(bondup._id); } },
                ]);
              }}
              activeOpacity={0.8}
            >
              <Text style={[s.secondaryBtnText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </BaseModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Trending badge
  trendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: `${BRAND}30`,
  },
  trendingText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
    letterSpacing: 0.5,
  },

  // Title section
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSansBold',
    color: '#0F0F0F',
    lineHeight: 34,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans',
    color: '#555',
    lineHeight: 22,
  },

  // Hosted by card
  hostedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  hostedAvatarBtn: {},
  hostedAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: `${BRAND}30`,
  },
  hostedAvatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostedAvatarInitial: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'PlusJakartaSansBold',
  },
  hostedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hostedLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSansBold',
    color: colors.secondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  hostedName: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  hostedSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    marginTop: 1,
  },
  messageIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // WHEN + TYPE pair
  metaPairRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  metaPairCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metaPairCardRight: {},
  metaPairIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaPairIconCircleLight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaPairEmoji: {
    fontSize: 18,
  },
  metaPairLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSansBold',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaPairValue: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    lineHeight: 18,
  },

  // Location card
  locationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  locationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSansBold',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  navIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 170,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    height: 170,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  mapEmoji: {
    fontSize: 40,
  },
  mapPlaceholderText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Who's coming
  whoSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  whoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  whoTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  whoCount: {
    color: '#888',
    fontFamily: 'PlusJakartaSans',
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },
  avatarOverlapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  participantAvatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatarInitial: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'PlusJakartaSansBold',
  },
  extraAvatar: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraAvatarText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSansBold',
    color: '#555',
  },
  joinedFriendsText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    marginTop: 4,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND,
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#555',
  },
  bookmarkBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#9CA3AF',
  },
});
