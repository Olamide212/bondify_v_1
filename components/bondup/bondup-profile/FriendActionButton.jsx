import { Edit, UserPlus, Users } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../constant/colors';

const BRAND = colors.primary;

const FriendActionButton = ({ friendStatus, onSendRequest, onShowRequests, onEditProfile, loading, isOwnProfile }) => {
  const getButtonText = () => {
    if (isOwnProfile) return 'Edit Profile';
    
    switch (friendStatus) {
      case 'friends': return 'Friends';
      case 'request_sent': return 'Request Sent';
      case 'request_received': return 'Accept Request';
      default: return 'Add as Friend';
    }
  };

  const getButtonIcon = () => {
    if (isOwnProfile) return <Edit size={16} color="#fff" />;
    return <UserPlus size={16} color={friendStatus === 'friends' ? BRAND : '#fff'} />;
  };

  const getButtonStyle = () => {
    if (isOwnProfile) {
      return [s.friendBtn, s.editBtn];
    }
    if (friendStatus === 'friends') {
      return [s.friendBtn, s.friendsBtn];
    }
    if (friendStatus === 'request_sent') {
      return [s.friendBtn, s.requestSentBtn];
    }
    return [s.friendBtn];
  };

  const handlePress = () => {
    if (isOwnProfile) {
      onEditProfile?.();
    } else if (friendStatus === 'none') {
      onSendRequest();
    }
    // For other states, maybe show a modal or different action
  };

  return (
    <View style={s.container}>
      <View style={s.buttonRow}>
        <TouchableOpacity
          style={getButtonStyle()}
          onPress={handlePress}
          disabled={loading || (friendStatus === 'friends' && !isOwnProfile) || (friendStatus === 'request_sent' && !isOwnProfile)}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              {getButtonIcon()}
              <Text style={isOwnProfile ? s.editBtnText : (friendStatus === 'friends' ? s.friendsBtnText : s.friendBtnText)}>
                {getButtonText()}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {isOwnProfile && (
          <TouchableOpacity
            style={s.requestsBtn}
            onPress={onShowRequests}
            activeOpacity={0.85}
          >
            <Users size={16} color="#fff" />
            <Text style={s.requestsBtnText}>Requests</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#121212',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  friendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 50,
    // shadowColor: BRAND,
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 8,
    // elevation: 4,
    flex: 1,
    minWidth: 150,
  },
  requestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 50,
    // shadowColor: BRAND,
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 8,
    elevation: 4,
    flex: 1,
    minWidth: 120,
  },
  friendsBtn: {
    backgroundColor: '#121212',
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
  editBtn: {
    backgroundColor: BRAND,
    borderRadius: 50,
  },
  friendBtnText: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: '#fff',
  },
  friendsBtnText: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: BRAND,
  },
  requestsBtnText: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: '#fff',
  },
  editBtnText: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: '#fff',
  },
});

export default FriendActionButton;