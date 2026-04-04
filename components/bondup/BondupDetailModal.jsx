/**
 * BondupDetailModal.jsx  —  Artistic redesign
 */

import * as ExpoLocation from 'expo-location';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bookmark,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Send,
  Share2,
  Trash2,
  Users
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import AlertModal from '../modals/AlertModal';
import BaseModal from '../modals/BaseModal';

const BRAND = colors.primary;

const ACTIVITY_EMOJI = {
  coffee: '☕', food: '🍔', drinks: '🍹', brunch: '🥐', dinner: '🍽️', lunch: '🥗', snacks: '🍿', dessert: '🍰',
  gym: '💪', yoga: '🧘', running: '🏃', hiking: '🥾', cycling: '🚴', swimming: '🏊', tennis: '🎾', basketball: '🏀', football: '⚽', volleyball: '🏐',
  walk: '🚶', park: '🌳', beach: '🏖️', picnic: '🧺', camping: '⛺', fishing: '🎣',
  movie: '🎬', theater: '🎭', concert: '🎵', museum: '🏛️', art: '🎨', comedy: '😂',
  board_games: '🎲', video_games: '🎮', karaoke: '🎤', dancing: '💃', party: '🎉', networking: '🤝',
  workshop: '🔨', class: '📚', photography: '📷', painting: '🖌️', music: '🎼',
  other: '✨',
};

const ACTIVITY_LABEL = {
  coffee: 'Coffee', food: 'Dining', drinks: 'Drinks', brunch: 'Brunch', dinner: 'Dinner', lunch: 'Lunch', snacks: 'Snacks', dessert: 'Dessert',
  gym: 'Gym', yoga: 'Yoga', running: 'Running', hiking: 'Hiking', cycling: 'Cycling', swimming: 'Swimming', tennis: 'Tennis', basketball: 'Basketball', football: 'Football', volleyball: 'Volleyball',
  walk: 'Walking', park: 'Park', beach: 'Beach', picnic: 'Picnic', camping: 'Camping', fishing: 'Fishing',
  movie: 'Cinema', theater: 'Theater', concert: 'Concert', museum: 'Museum', art: 'Art Gallery', comedy: 'Comedy Show',
  board_games: 'Board Games', video_games: 'Video Games', karaoke: 'Karaoke', dancing: 'Dancing', party: 'Party', networking: 'Networking',
  workshop: 'Workshop', class: 'Class', photography: 'Photography', painting: 'Painting', music: 'Music',
  other: 'Other',
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

const getUserLocation = (user) => {
  if (!user) return '';
  if (typeof user.location === 'string') return user.location;
  if (user.location?.city || user.location?.state) {
    return [user.location.city, user.location.state].filter(Boolean).join(', ');
  }
  return user.city || '';
};

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
  onStartDirectChat,
  joinLoading,
}) {
  const router = useRouter();
  const [localAlert, setLocalAlert] = useState({ visible: false, icon: null, title: '', message: '', actions: [] });

  const hideLocalAlert = () => setLocalAlert({ visible: false, icon: null, title: '', message: '', actions: [] });

  if (!bondup) return null;

  const handleDeletePress = () => {
    setLocalAlert({
      visible: true,
      icon: 'delete',
      title: 'Remove Bondup',
      message: 'Are you sure you want to remove this Bondup?',
      actions: [
        { label: 'Cancel', style: 'cancel', onPress: hideLocalAlert },
        {
          label: 'Remove',
          style: 'destructive',
          onPress: () => {
            hideLocalAlert();
            onClose?.();
            setTimeout(() => onDelete?.(bondup._id), 100);
          },
        },
      ],
    });
  };

  const handleLeavePress = () => {
    setLocalAlert({
      visible: true,
      icon: 'leave',
      title: 'Leave Bondup',
      message: 'Are you sure you want to leave?',
      actions: [
        { label: 'Cancel', style: 'cancel', onPress: hideLocalAlert },
        {
          label: 'Leave',
          style: 'destructive',
          onPress: () => {
            hideLocalAlert();
            onClose?.();
            setTimeout(() => onLeave?.(bondup._id), 100);
          },
        },
      ],
    });
  };

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

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={onClose} style={s.iconBtn} hitSlop={10}>
          <ArrowLeft size={22} color={colors.white} />
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
            <Share2 size={20} color="#fff" />
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity
              style={s.iconBtn}
              onPress={handleDeletePress}
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
          </View>

          {/* Participant List */}
          <View style={s.participantList}>
            {(bondup.participants || []).map((pt, i) => {
              const u = pt.user;
              const uId = u?._id || u;
              const uAv = avatarUrl(u);
              const uLocation = getUserLocation(u);
              const isCurrentUser = String(uId) === String(currentUserId);
              
              return (
                <View key={uId || i} style={s.participantRow}>
                  <TouchableOpacity 
                    style={s.participantInfo}
                    onPress={() => !isCurrentUser && uId && router.push(`/bondup-profile/${uId}`)}
                    activeOpacity={isCurrentUser ? 1 : 0.7}
                  >
                    {uAv ? (
                      <Image source={{ uri: uAv }} style={s.participantListAvatar} />
                    ) : (
                      <View style={[s.participantListAvatar, s.participantListAvatarFallback]}>
                        <Text style={s.participantListInitial}>
                          {(u?.firstName || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={s.participantTextWrap}>
                      <Text style={s.participantName} numberOfLines={1}>
                        {getFullName(u)}{isCurrentUser ? ' (You)' : ''}
                      </Text>
                      {uLocation ? (
                        <View style={s.participantLocationRow}>
                          <MapPin size={11} color="#999" />
                          <Text style={s.participantLocation} numberOfLines={1}>{uLocation}</Text>
                        </View>
                      ) : null}
                    </View>

                     
                  {/* DM button - only show for other users and if current user can chat */}
                  {!isCurrentUser && canChat && (
                    <TouchableOpacity 
                      style={s.dmBtn}
                      onPress={() => onStartDirectChat?.(u)}
                      activeOpacity={0.7}
                    >
                      <Send size={16} color={BRAND} />
                    </TouchableOpacity>
                  )}
                  </TouchableOpacity>
                 
                </View>
              );
            })}
          </View>

          {participantCount === 0 && (
            <Text style={s.noParticipantsText}>No one has joined yet. Be the first!</Text>
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
                <Users size={18} color="#fff" />
                <Text style={s.primaryBtnText}>Group Chat</Text>
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
                onPress={handleLeavePress}
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
              <Users size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Group Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={handleDeletePress}
              activeOpacity={0.8}
            >
              <Text style={[s.secondaryBtnText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Local Alert Modal ── */}
      <AlertModal
        visible={localAlert.visible}
        icon={localAlert.icon}
        title={localAlert.title}
        message={localAlert.message}
        actions={localAlert.actions}
        onClose={hideLocalAlert}
      />
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
    // borderBottomWidth: 1,
    // borderBottomColor: '#F5F5F5',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight
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
    fontFamily: 'OutfitBold',
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
    fontFamily: 'OutfitBold',
    color: '#fff',
    lineHeight: 34,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Outfit',
    color: '#9CA3AF',
    lineHeight: 22,
  },

  // Hosted by card
  hostedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
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
    fontFamily: 'OutfitBold',
  },
  hostedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hostedLabel: {
    fontSize: 10,
    fontFamily: 'OutfitBold',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  hostedName: {
    fontSize: 16,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
    textTransform: 'capitalize',
  },
  hostedSubtitle: {
    fontSize: 12,
    fontFamily: 'Outfit',
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
    backgroundColor: colors.primaryLight,
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
    fontFamily: 'OutfitBold',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaPairValue: {
    fontSize: 13,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
    lineHeight: 18,
  },

  // Location card
  locationCard: {
    backgroundColor: '#121212',
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
    fontFamily: 'OutfitBold',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
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
    backgroundColor: '#1E1E1E',
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
    fontFamily: 'OutfitMedium',
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
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
  },
  whoCount: {
    color: '#888',
    fontFamily: 'Outfit',
  },
  
  // Participant list
  participantList: {
    gap: 2,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.primary + '10',
  },
  participantListAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  participantListAvatarFallback: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantListInitial: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'OutfitBold',
  },
  participantTextWrap: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontFamily: 'OutfitSemiBold',
    color: '#E5E5E5',
    marginBottom: 2,
  },
  participantLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantLocation: {
    fontSize: 12,
    fontFamily: 'Outfit',
    color: '#888',
  },
  dmBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${BRAND}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noParticipantsText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#121212',
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
    fontFamily: 'OutfitBold',
    color: '#fff',
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: '#9CA3AF',
  },
  bookmarkBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#1E1E1E',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledBtnText: {
    fontSize: 16,
    fontFamily: 'OutfitMedium',
    color: '#9CA3AF',
  },
});
