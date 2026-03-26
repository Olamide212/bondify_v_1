import { Bell, Plus, Settings, X } from "lucide-react-native";
import { useMemo } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { NOTIFICATION_META } from "../../services/notificationService";

// Helper to format relative time
const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

// Check if notification is recent (within last 24 hours)
const isRecent = (createdAt) => {
  if (!createdAt) return false;
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < 24;
};

// Get avatar image from notification
const getAvatarUrl = (notification) => {
  if (notification.sender?.images?.[0]?.url) return notification.sender.images[0].url;
  if (notification.sender?.images?.[0]) return notification.sender.images[0];
  if (notification.sender?.profilePhoto) return notification.sender.profilePhoto;
  if (notification.data?.senderImage) return notification.data.senderImage;
  if (notification.data?.imageUrl) return notification.data.imageUrl;
  return null;
};

// Get sender name from notification
const getSenderName = (notification) => {
  if (notification.sender?.firstName) {
    return notification.sender.firstName;
  }
  if (notification.sender?.name) {
    return notification.sender.name.split(" ")[0];
  }
  // Extract name from title if it contains a name
  const titleMatch = notification.title?.match(/^([A-Z][a-z]+)/);
  if (titleMatch) return titleMatch[1];
  return null;
};

// New Matches Avatar Component
const MatchAvatar = ({ notification, onPress }) => {
  const avatarUrl = getAvatarUrl(notification);
  const name = getSenderName(notification);
  
  return (
    <Pressable onPress={() => onPress?.(notification)} className="items-center mr-4">
      <View className="relative">
        <View className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-primary">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full items-center justify-center bg-gray-300">
              <Text className="text-gray-500 text-2xl font-PlusJakartaSansBold">
                {name?.[0] || "?"}
              </Text>
            </View>
          )}
        </View>
        {/* Match indicator badge */}
        <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary items-center justify-center border-2 border-white">
          <Text className="text-white text-xs">💞</Text>
        </View>
      </View>
      <Text className="mt-2 text-xs text-gray-700 font-PlusJakartaSansMedium" numberOfLines={1}>
        {name || "Match"}
      </Text>
    </Pressable>
  );
};

// Boost Button Component
const BoostButton = ({ onPress }) => (
  <Pressable onPress={onPress} className="items-center mr-4">
    <View className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50">
      <Plus size={24} color={colors.gray500} />
    </View>
    <Text className="mt-2 text-xs text-gray-500 font-PlusJakartaSansMedium">Boost</Text>
  </Pressable>
);

// Photo Like Notification Card
const PhotoLikeCard = ({ notification, onPress }) => {
  const avatarUrl = getAvatarUrl(notification);
  const name = getSenderName(notification);
  const photoUrl = notification.data?.photoUrl || notification.imageUrl;
  
  return (
    <Pressable
      onPress={() => onPress?.(notification)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-start">
        <View className="relative">
          <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gray-300">
                <Text className="text-gray-500 text-lg font-PlusJakartaSansBold">
                  {name?.[0] || "?"}
                </Text>
              </View>
            )}
          </View>
          {/* Like badge */}
          <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 items-center justify-center border-2 border-white">
            <Text className="text-white text-[10px]">❤️</Text>
          </View>
        </View>
        
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-black font-PlusJakartaSansBold">
              <Text className="text-black">{name}</Text>
              <Text className="text-gray-600 font-PlusJakartaSans"> liked your photo</Text>
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 font-PlusJakartaSans mr-1">
                {formatRelativeTime(notification.createdAt)}
              </Text>
              {!notification.read && (
                <View className="w-2 h-2 rounded-full bg-primary" />
              )}
            </View>
          </View>
          
          {photoUrl && (
            <View className="mt-3 w-14 h-14 rounded-xl overflow-hidden bg-gray-200">
              <Image source={{ uri: photoUrl }} className="w-full h-full" resizeMode="cover" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

// Event Invite Card
const EventInviteCard = ({ notification, onPress, onJoin, onDecline }) => {
  const avatarUrl = getAvatarUrl(notification);
  const name = getSenderName(notification);
  const eventTitle = notification.data?.eventTitle || notification.data?.title;
  
  return (
    <Pressable
      onPress={() => onPress?.(notification)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-start">
        <View className="relative">
          <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gray-300">
                <Text className="text-gray-500 text-lg font-PlusJakartaSansBold">
                  {name?.[0] || "?"}
                </Text>
              </View>
            )}
          </View>
          {/* Invite badge */}
          <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-500 items-center justify-center border-2 border-white">
            <Text className="text-white text-[10px]">🎉</Text>
          </View>
        </View>
        
        <View className="flex-1 ml-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-black font-PlusJakartaSansBold">
                {name}
                <Text className="text-gray-600 font-PlusJakartaSans"> invited you to</Text>
              </Text>
              {eventTitle && (
                <Text className="text-primary font-PlusJakartaSansMedium mt-1">
                  "{eventTitle}"
                </Text>
              )}
            </View>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 font-PlusJakartaSans mr-1">
                {formatRelativeTime(notification.createdAt)}
              </Text>
            </View>
          </View>
          
          <View className="flex-row mt-3 gap-2">
            <TouchableOpacity
              onPress={() => onJoin?.(notification)}
              className="bg-primary px-5 py-2 rounded-full"
            >
              <Text className="text-white font-PlusJakartaSansMedium text-sm">Join</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDecline?.(notification)}
              className="bg-gray-100 px-5 py-2 rounded-full"
            >
              <Text className="text-gray-700 font-PlusJakartaSansMedium text-sm">Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// AI Tip Card
const AITipCard = ({ notification, onPress, onViewTip }) => {
  return (
    <Pressable
      onPress={() => onPress?.(notification)}
      className="bg-orange-50 rounded-2xl p-4 mb-3 border border-orange-100"
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
          <Text className="text-2xl">✨</Text>
        </View>
        
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-black font-PlusJakartaSansBold">
              AI Assistant:
              <Text className="text-gray-600 font-PlusJakartaSans"> {notification.body}</Text>
            </Text>
            <Text className="text-xs text-gray-500 font-PlusJakartaSans">
              {formatRelativeTime(notification.createdAt)}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => onViewTip?.(notification)}
            className="mt-3 border border-primary rounded-full py-2 px-4 self-start"
          >
            <Text className="text-primary font-PlusJakartaSansMedium text-sm">View Tip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
};

// Message Notification Card
const MessageCard = ({ notification, onPress }) => {
  const avatarUrl = getAvatarUrl(notification);
  const name = getSenderName(notification);
  
  return (
    <Pressable
      onPress={() => onPress?.(notification)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full items-center justify-center bg-gray-300">
              <Text className="text-gray-500 text-lg font-PlusJakartaSansBold">
                {name?.[0] || "?"}
              </Text>
            </View>
          )}
        </View>
        
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-black font-PlusJakartaSansBold">{name || "Someone"}</Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 font-PlusJakartaSans mr-1">
                {formatRelativeTime(notification.createdAt)}
              </Text>
              {!notification.read && (
                <View className="w-2 h-2 rounded-full bg-primary" />
              )}
            </View>
          </View>
          <Text className="text-gray-600 font-PlusJakartaSans mt-1" numberOfLines={1}>
            "{notification.body}"
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

// Older/Simple Notification Card
const SimpleNotificationCard = ({ notification, onPress }) => {
  const meta = NOTIFICATION_META[notification.type] || NOTIFICATION_META.system;
  
  return (
    <Pressable
      onPress={() => onPress?.(notification)}
      className="flex-row items-start py-3"
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
        <Text className="text-lg">{meta.icon}</Text>
      </View>
      
      <View className="flex-1 ml-3">
        <Text className="text-gray-700 font-PlusJakartaSans leading-5">
          {notification.body}
        </Text>
        <Text className="text-xs text-gray-400 font-PlusJakartaSans mt-1">
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
};

const NotificationsModal = ({
  visible,
  notifications,
  onClose,
  onMarkAllRead,
  onClearAll,
  onPressNotification,
  onBoost,
  onJoinEvent,
  onDeclineEvent,
  onViewTip,
  onOpenSettings,
}) => {
  // Categorize notifications
  const { newMatches, recentActivity, olderNotifications, newCount } = useMemo(() => {
    const matches = [];
    const recent = [];
    const older = [];
    let unread = 0;
    
    notifications.forEach((notif) => {
      if (!notif.read) unread++;
      
      // New matches go to the top section
      if (notif.type === "new_match" || notif.type === "match") {
        if (isRecent(notif.createdAt)) {
          matches.push(notif);
        } else {
          older.push(notif);
        }
      }
      // Recent activity (last 24 hours)
      else if (isRecent(notif.createdAt)) {
        recent.push(notif);
      }
      // Older notifications
      else {
        older.push(notif);
      }
    });
    
    return {
      newMatches: matches.slice(0, 5), // Max 5 in horizontal scroll
      recentActivity: recent.slice(0, 10),
      olderNotifications: older.slice(0, 20),
      newCount: unread,
    };
  }, [notifications]);

  // Render notification based on type
  const renderActivityNotification = (notification) => {
    const type = notification.type;
    
    if (type === "photo_like" || type === "new_like" || type === "super_like") {
      return (
        <PhotoLikeCard
          key={notification.id}
          notification={notification}
          onPress={onPressNotification}
        />
      );
    }
    
    if (type === "event_invite") {
      return (
        <EventInviteCard
          key={notification.id}
          notification={notification}
          onPress={onPressNotification}
          onJoin={onJoinEvent}
          onDecline={onDeclineEvent}
        />
      );
    }
    
    if (type === "ai_tip") {
      return (
        <AITipCard
          key={notification.id}
          notification={notification}
          onPress={onPressNotification}
          onViewTip={onViewTip}
        />
      );
    }
    
    if (type === "new_message" || type === "message") {
      return (
        <MessageCard
          key={notification.id}
          notification={notification}
          onPress={onPressNotification}
        />
      );
    }
    
    // Default card for other types
    return (
      <PhotoLikeCard
        key={notification.id}
        notification={notification}
        onPress={onPressNotification}
      />
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-gray-50">
          {/* Header */}
          <View className="px-5 py-3 flex-row items-center justify-between bg-white">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-lg">🔔</Text>
              </View>
              <Text className="text-lg font-PlusJakartaSansBold text-primary">Bondies</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={onOpenSettings}>
                <Settings size={22} color={colors.gray500} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <X color={colors.primary} size={24} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Title */}
            <View className="px-5 py-4">
              <Text className="text-3xl font-PlusJakartaSansBold text-black">Notifications</Text>
            </View>
            
            {/* NEW MATCHES Section */}
            {newMatches.length > 0 && (
              <View className="mb-6">
                <View className="px-5 flex-row items-center justify-between mb-3">
                  <Text className="text-xs font-PlusJakartaSansBold text-gray-500 tracking-wider">
                    NEW MATCHES
                  </Text>
                  <View className="bg-primary px-2 py-1 rounded-full">
                    <Text className="text-white text-xs font-PlusJakartaSansBold">
                      {newMatches.length} NEW
                    </Text>
                  </View>
                </View>
                
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {newMatches.map((match) => (
                    <MatchAvatar
                      key={match.id}
                      notification={match}
                      onPress={onPressNotification}
                    />
                  ))}
                  <BoostButton onPress={onBoost} />
                </ScrollView>
              </View>
            )}
            
            {/* RECENT ACTIVITY Section */}
            {recentActivity.length > 0 && (
              <View className="mb-6">
                <View className="px-5 mb-3">
                  <Text className="text-xs font-PlusJakartaSansBold text-gray-500 tracking-wider">
                    RECENT ACTIVITY
                  </Text>
                </View>
                
                <View className="px-5">
                  {recentActivity.map(renderActivityNotification)}
                </View>
              </View>
            )}
            
            {/* OLDER NOTIFICATIONS Section */}
            {olderNotifications.length > 0 && (
              <View className="mb-6">
                <View className="px-5 mb-3">
                  <Text className="text-xs font-PlusJakartaSansBold text-gray-500 tracking-wider">
                    OLDER NOTIFICATIONS
                  </Text>
                </View>
                
                <View className="px-5">
                  {olderNotifications.map((notification) => (
                    <SimpleNotificationCard
                      key={notification.id}
                      notification={notification}
                      onPress={onPressNotification}
                    />
                  ))}
                </View>
              </View>
            )}
            
            {/* Empty State */}
            {notifications.length === 0 && (
              <View className="flex-1 items-center justify-center px-8 py-20">
                <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
                  <Bell color={colors.primary} size={32} />
                </View>
                <Text className="text-xl text-black font-PlusJakartaSansBold text-center">
                  No notifications yet
                </Text>
                <Text className="mt-2 text-center text-gray-500 font-PlusJakartaSans leading-5">
                  New messages, matches, and activity will appear here in real time.
                </Text>
              </View>
            )}
          </ScrollView>
          
          {/* Action Buttons */}
          {notifications.length > 0 && (
            <View className="px-5 py-4 border-t border-gray-100 bg-white flex-row items-center justify-between">
              <TouchableOpacity onPress={onMarkAllRead}>
                <Text className="text-primary font-PlusJakartaSansMedium">
                  {newCount > 0 ? "Mark all as read" : "All read ✓"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClearAll}>
                <Text className="text-gray-500 font-PlusJakartaSansMedium">Clear all</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

export default NotificationsModal;
