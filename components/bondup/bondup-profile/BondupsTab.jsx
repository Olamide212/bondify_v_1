import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ActiveBondupCard from './ActiveBondupCard';

const BondupsTab = ({ bondups, loading, currentUserId, onBondupUpdate }) => {
  if (loading) {
    return (
      <View style={s.tabContent}>
        <Text style={s.loadingText}>Loading bondups...</Text>
      </View>
    );
  }

  if (!bondups || bondups.length === 0) {
    return (
      <View style={s.tabContent}>
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>🤝</Text>
          <Text style={s.emptyText}>No active bondups</Text>
        </View>
      </View>
    );
  }

  // Group bondups by day
  const groupedBondups = bondups.reduce((groups, bondup) => {
    const date = new Date(bondup.dateTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let dayLabel;
    if (date.toDateString() === today.toDateString()) {
      dayLabel = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayLabel = 'Tomorrow';
    } else {
      dayLabel = date.toLocaleDateString(undefined, { weekday: 'long' });
    }

    if (!groups[dayLabel]) groups[dayLabel] = [];
    groups[dayLabel].push(bondup);
    return groups;
  }, {});

  return (
    <View style={s.tabContent}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {Object.entries(groupedBondups).map(([day, dayBondups]) => (
          <View key={day} style={s.daySection}>
            <Text style={s.dayLabel}>{day}</Text>
            {dayBondups.map((bondup) => (
              <ActiveBondupCard 
                key={bondup._id} 
                bondup={bondup} 
                currentUserId={currentUserId}
                onBondupUpdate={onBondupUpdate}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  tabContent: {
    flex: 1,
    minHeight: 200,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Outfit',
    color: '#888',
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: '#888',
  },
  daySection: {
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 16,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    // backgroundColor: '#1E1E1E',
  },
});

export default BondupsTab;