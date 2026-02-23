import { Bell, X } from "lucide-react-native";
import {
    FlatList,
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";

const formatTimestamp = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const NotificationsModal = ({
  visible,
  notifications,
  onClose,
  onMarkAllRead,
  onClearAll,
  onPressNotification,
}) => {
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-5 py-3 flex-row items-center justify-between border-b border-gray-100">
            <Text className="text-2xl font-SatoshiBold text-black">Notifications</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.primary} size={22} />
            </TouchableOpacity>
          </View>

          {notifications.length > 0 && (
            <View className="px-5 py-3 border-b border-gray-100 flex-row items-center justify-between">
              <TouchableOpacity onPress={onMarkAllRead}>
                <Text className="text-primary font-SatoshiMedium">
                  {unreadCount > 0 ? "Mark all as read" : "All read"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClearAll}>
                <Text className="text-primary font-SatoshiMedium">Clear all</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{
              flexGrow: notifications.length === 0 ? 1 : 0,
              paddingBottom: 24,
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-8">
                <Bell color={colors.primary} size={28} />
                <Text className="mt-3 text-lg text-black font-SatoshiBold">No notifications yet</Text>
                <Text className="mt-1 text-center text-gray-500 font-Satoshi">
                  New messages and matches will appear here in real time.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onPressNotification?.(item)}
                className={`px-5 py-4 border-b border-gray-100 ${
                  item.read ? "bg-white" : "bg-primary/5"
                }`}
              >
                <View className="flex-row items-start justify-between gap-4">
                  <View className="flex-1">
                    <Text className="text-black font-SatoshiBold">
                      {item.title}
                      {!item.read ? " •" : ""}
                    </Text>
                    <Text className="mt-1 text-gray-600 font-Satoshi" numberOfLines={2}>
                      {item.body}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-500 font-Satoshi">
                    {formatTimestamp(item.createdAt)}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

export default NotificationsModal;
