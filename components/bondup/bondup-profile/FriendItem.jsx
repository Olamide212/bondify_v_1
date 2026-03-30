import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../constant/colors';

const BRAND = colors.primary;

const FriendItem = ({ friend }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/bondup-profile/${friend._id}`);
  };

  return (
    <TouchableOpacity style={s.friendItem} onPress={handlePress} activeOpacity={0.7}>
      {friend.profilePhoto ? (
        <Image source={{ uri: friend.profilePhoto }} style={s.friendAvatar} />
      ) : (
        <View style={[s.friendAvatar, s.friendAvatarFallback]}>
          <Text style={s.friendAvatarInitial}>
            {(friend.firstName || friend.userName || 'U')[0].toUpperCase()}
          </Text>
        </View>
      )}
      <View style={s.friendInfo}>
        <Text style={s.friendName}>{friend.firstName || friend.userName}</Text>
        {friend.displayName && <Text style={s.friendUsername}>@{friend.userName}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendAvatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarInitial: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  friendUsername: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#666',
  },
});

export default FriendItem;