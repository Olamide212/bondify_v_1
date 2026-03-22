/**
 * BondupJoinedModal.jsx
 *
 * Full-screen celebration modal shown after a user successfully joins a Bondup.
 */

import * as Calendar from 'expo-calendar';
import {
  CalendarDays,
  MessageCircle,
  X,
} from 'lucide-react-native';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../constant/colors';
import BaseModal from '../modals/BaseModal';

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const d = new Date(dateTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (dDay.getTime() === today.getTime()) return `Today, ${timeStr}`;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + `, ${timeStr}`;
};

const getFullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

export default function BondupJoinedModal({
  visible,
  bondup,
  currentUserId,
  onClose,
  onOpenChat,
}) {
  if (!bondup) return null;

  const handleAddToCalendar = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Calendar access is required to add this event.');
        return;
      }

      // Get a writable calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      let targetCalendar = calendars.find(
        (c) => c.allowsModifications && c.isPrimary
      );
      if (!targetCalendar) {
        targetCalendar = calendars.find((c) => c.allowsModifications);
      }

      // On iOS, create a default calendar if none found
      if (!targetCalendar && Platform.OS === 'ios') {
        const defaultSource = calendars.find((c) => c.source?.isLocalAccount)?.source
          || { isLocalAccount: true, name: 'Bondies', type: 'local' };
        const newCalId = await Calendar.createCalendarAsync({
          title: 'Bondies',
          color: BRAND,
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: defaultSource.id,
          source: defaultSource,
          name: 'Bondies',
          ownerAccount: 'personal',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
        targetCalendar = { id: newCalId };
      }

      if (!targetCalendar) {
        Alert.alert('Error', 'No writable calendar found on this device.');
        return;
      }

      const startDate = new Date(bondup.dateTime);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
      const locationStr = [bondup.location, bondup.city].filter(Boolean).join(', ');

      await Calendar.createEventAsync(targetCalendar.id, {
        title: bondup.title || 'Bondup Meetup',
        startDate,
        endDate,
        location: locationStr,
        notes: bondup.description || `Bondup meetup with ${participantCount} people`,
        alarms: [{ relativeOffset: -30 }], // reminder 30 mins before
      });

      Alert.alert('Added! 🎉', 'This Bondup has been added to your calendar with a 30-min reminder.');
    } catch (err) {
      console.error('Calendar error:', err);
      Alert.alert('Error', 'Could not add to calendar. Please try again.');
    }
  };

  const participantCount = bondup.participants?.length ?? 0;
  const spotsText = bondup.maxParticipants
    ? `${participantCount}/${bondup.maxParticipants}`
    : `${participantCount}`;

  // Show up to 6 participant avatars in 2×3 grid
  const shownAvatars = (bondup.participants || []).slice(0, 6);
  const extraCount = Math.max(0, participantCount - 6);

  const locationTime = [
    [bondup.location, bondup.city].filter(Boolean).join(', '),
    formatDateTime(bondup.dateTime),
  ]
    .filter(Boolean)
    .join('  •  ');

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onClose} style={s.iconBtn} hitSlop={10}>
          <X size={22} color="#333" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bondup 🔥</Text>
        <View  />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Fire icon circle + party popper */}
        <View style={s.heroSection}>
          <View style={s.fireCircle}>
            <Text style={s.fireEmoji}>🔥</Text>
          </View>
          <Text style={s.partyEmoji}>🎉</Text>
        </View>

        {/* You're in title */}
        <Text style={s.mainTitle}>You&apos;re in 🎉</Text>
        <Text style={s.subtitle}>
          You just joined{' '}
          <Text style={s.subtitleHighlight}>{bondup.title}</Text>
          {'. Get ready!'}
        </Text>

        {/* THE SQUAD section */}
        <View style={s.squadCard}>
          <View style={s.squadHeader}>
            <Text style={s.squadLabel}>THE SQUAD</Text>
            <View style={s.squadBadge}>
              <Text style={s.squadBadgeText}>👥 {spotsText}</Text>
            </View>
          </View>

          {/* Avatar grid: 3 per row */}
          <View style={s.avatarGrid}>
            {shownAvatars.map((pt, i) => {
              const u = pt.user;
              const uAv = avatarUrl(u);
              return (
                <View key={i} style={s.avatarGridItem}>
                  {uAv ? (
                    <Image source={{ uri: uAv }} style={s.squadAvatar} />
                  ) : (
                    <View style={[s.squadAvatar, s.squadAvatarFallback]}>
                      <Text style={s.squadAvatarInitial}>
                        {(u?.firstName || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={s.avatarName} numberOfLines={1}>
                    {u?.firstName || 'User'}
                  </Text>
                </View>
              );
            })}
            {extraCount > 0 && (
              <View style={s.avatarGridItem}>
                <View style={[s.squadAvatar, s.extraAvatar]}>
                  <Text style={s.extraAvatarText}>+{extraCount}</Text>
                </View>
                <Text style={s.avatarName}>More</Text>
              </View>
            )}
          </View>
        </View>

        {/* Open Chat button */}
        <TouchableOpacity
          style={s.openChatBtn}
          onPress={() => onOpenChat?.(bondup)}
          activeOpacity={0.85}
        >
          <MessageCircle size={20} color="#fff" />
          <Text style={s.openChatBtnText}>Open Chat</Text>
        </TouchableOpacity>

        {/* Add to Calendar button */}
        <TouchableOpacity
          style={s.calendarBtn}
          onPress={handleAddToCalendar}
          activeOpacity={0.85}
        >
          <CalendarDays size={20} color={BRAND} />
          <Text style={s.calendarBtnText}>Add to Calendar</Text>
        </TouchableOpacity>

        {/* Location + time pill */}
        {!!locationTime && (
          <View style={s.locationPill}>
            <Text style={s.locationPillText}>📍 {locationTime}</Text>
          </View>
        )}
      </ScrollView>
    </BaseModal>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },

  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 32,
  },

  // Hero
  heroSection: {
    position: 'relative',
    marginBottom: 24,
  },
  fireCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fireEmoji: {
    fontSize: 46,
  },
  partyEmoji: {
    position: 'absolute',
    top: -10,
    right: -14,
    fontSize: 36,
  },

  mainTitle: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans',
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  subtitleHighlight: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansBold',
  },

  // Squad card
  squadCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  squadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  squadLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
    color: '#333',
    letterSpacing: 1,
  },
  squadBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${BRAND}30`,
  },
  squadBadgeText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarGridItem: {
    alignItems: 'center',
    width: 64,
  },
  squadAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    marginBottom: 4,
  },
  squadAvatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squadAvatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'PlusJakartaSansBold',
  },
  extraAvatar: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraAvatarText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#555',
  },
  avatarName: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#666',
    textAlign: 'center',
  },

  // Buttons
  openChatBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND,
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  openChatBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  calendarBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: BRAND,
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 20,
  },
  calendarBtnText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },

  // Location pill
  locationPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  locationPillText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#555',
    textAlign: 'center',
  },
});
