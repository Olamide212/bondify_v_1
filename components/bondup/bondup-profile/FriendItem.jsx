import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../constant/colors';

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const FriendItem = ({ friend }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/bondup-profile/${friend._id}`);
  };

  const friendAvatar = avatarUrl(friend);

  return (
    <TouchableOpacity style={s.friendItem} onPress={handlePress} activeOpacity={0.7}>
      {friendAvatar ? (
        <Image source={{ uri: friendAvatar }} style={s.friendAvatar} cachePolicy="memory-disk" transition={150} />
      ) : (
        <View style={[s.friendAvatar, s.friendAvatarFallback]}>
          <Text style={s.friendAvatarInitial}>
            {(friend.firstName || friend.userName || 'U')[0].toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={s.friendName}>{friend.firstName || friend.userName}</Text>
      {friend.displayName && <Text style={s.friendUsername}>{friend.userName}</Text>}
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  friendItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,

  },
  friendAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  friendAvatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarInitial: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'PlusJakartaSansBold',
  },
  friendName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
    textAlign: 'center',
  },
  friendUsername: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#666',
    textAlign: 'center',
  },
});

export default FriendItem;