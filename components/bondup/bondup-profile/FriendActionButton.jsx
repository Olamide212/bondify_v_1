import { UserPlus } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../constant/colors';

const BRAND = colors.primary;

const FriendActionButton = ({ friendStatus, onSendRequest, loading }) => {
  const getButtonText = () => {
    switch (friendStatus) {
      case 'friends': return 'Friends';
      case 'request_sent': return 'Request Sent';
      case 'request_received': return 'Accept Request';
      default: return 'Add as Friend';
    }
  };

  const getButtonStyle = () => {
    if (friendStatus === 'friends') {
      return [s.friendBtn, s.friendsBtn];
    }
    if (friendStatus === 'request_sent') {
      return [s.friendBtn, s.requestSentBtn];
    }
    return [s.friendBtn];
  };

  const handlePress = () => {
    if (friendStatus === 'none') {
      onSendRequest();
    }
    // For other states, maybe show a modal or different action
  };

  return (
    <View style={s.container}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handlePress}
        disabled={loading || friendStatus === 'friends' || friendStatus === 'request_sent'}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <UserPlus size={16} color={friendStatus === 'friends' ? BRAND : '#fff'} />
            <Text style={friendStatus === 'friends' ? s.friendsBtnText : s.friendBtnText}>
              {getButtonText()}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  friendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: 200,
    alignSelf: 'center',
  },
  friendsBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: BRAND,
    shadowOpacity: 0,
    elevation: 0,
  },
  requestSentBtn: {
    backgroundColor: '#FFA500',
    shadowOpacity: 0,
    elevation: 0,
  },
  friendBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  friendsBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: BRAND,
  },
});

export default FriendActionButton;