import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import FriendItem from './FriendItem';

const MutualFriendsTab = ({ mutualFriends, loading }) => {
  if (loading) {
    return (
      <View style={s.tabContent}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!mutualFriends || mutualFriends.length === 0) {
    return (
      <View style={s.tabContent}>
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>🤝</Text>
          <Text style={s.emptyText}>No mutual friends</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.tabContent}>
      <FlatList
        data={mutualFriends}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <FriendItem friend={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const s = StyleSheet.create({
  tabContent: {
    flex: 1,
    minHeight: 200,
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
    fontFamily: 'PlusJakartaSans',
    color: '#888',
  },
});

export default MutualFriendsTab;