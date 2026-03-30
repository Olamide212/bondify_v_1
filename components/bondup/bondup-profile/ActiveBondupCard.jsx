import { MapPin, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../constant/colors';

const BRAND = colors.primary;

const ActiveBondupCard = ({ bondup }) => {
  const emoji = {
    coffee: '☕', food: '🍔', drinks: '🍹', gym: '💪',
    walk: '🚶', movie: '🎬', other: '✨',
  }[bondup.activityType] || '✨';

  const dateLabel = bondup.dateTime
    ? new Date(bondup.dateTime).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={s.bondupCard}>
      <Text style={s.bondupEmoji}>{emoji}</Text>
      <View style={s.bondupCardContent}>
        <Text style={s.bondupTitle} numberOfLines={1}>{bondup.title}</Text>
        <View style={s.bondupMeta}>
          {!!bondup.city && (
            <View style={s.bondupMetaRow}>
              <MapPin size={11} color="#888" />
              <Text style={s.bondupMetaText}>{bondup.city}</Text>
            </View>
          )}
          {!!dateLabel && <Text style={s.bondupMetaText}>{dateLabel}</Text>}
        </View>
      </View>
      <View style={s.bondupParticipants}>
        <Users size={13} color="#888" />
        <Text style={s.bondupParticipantCount}>{bondup.participantCount ?? 0}</Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  bondupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  bondupEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  bondupCardContent: {
    flex: 1,
  },
  bondupTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    marginBottom: 3,
  },
  bondupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bondupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bondupMetaText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
  },
  bondupParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bondupParticipantCount: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
    color: '#666',
  },
});

export default ActiveBondupCard;