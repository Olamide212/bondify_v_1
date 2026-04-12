import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import SettingsService from "./settingsService";

const PUSH_TOKEN_CACHE_PREFIX = "@bondify/pushToken/";
let lastHandledNotificationId = null;

const ACTION_OPEN_CHAT = "open_chat";
const ACTION_OPEN_BONDUP_CHAT = "open_bondup_chat";
const ACTION_OPEN_NOTIFICATIONS = "open_notifications";

const MESSAGE_TYPES = new Set(["message", "new_message", "direct_message"]);
const BONDUP_TYPES = new Set(["bondup_message", "event_invite"]);

const NOTIFICATION_ACTIONS = {
  message: ACTION_OPEN_CHAT,
  new_message: ACTION_OPEN_CHAT,
  direct_message: ACTION_OPEN_CHAT,
  bondup_message: ACTION_OPEN_BONDUP_CHAT,
  event_invite: ACTION_OPEN_BONDUP_CHAT,
  default: ACTION_OPEN_NOTIFICATIONS,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getProjectId = () => {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    null
  );
};

const configureAndroidChannel = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FE01AA",
  });
};

const requestPushPermission = async () => {
  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;

  if (finalStatus !== "granted") {
    const permission = await Notifications.requestPermissionsAsync();
    finalStatus = permission.status;
  }

  return finalStatus === "granted";
};

const getExpoPushToken = async () => {
  const projectId = getProjectId();
  if (!projectId) {
    console.warn("Push notification setup skipped: missing EAS projectId");
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse?.data || null;
};

const getCacheKey = (userId) => `${PUSH_TOKEN_CACHE_PREFIX}${userId}`;

const syncPushTokenWithBackend = async ({ userId, pushToken }) => {
  if (!userId || !pushToken) return;

  const cacheKey = getCacheKey(userId);
  const cachedToken = await AsyncStorage.getItem(cacheKey);
  if (cachedToken === pushToken) return;

  await SettingsService.updatePushToken({ pushToken });
  await AsyncStorage.setItem(cacheKey, pushToken);
};

const registerForPushNotifications = async ({ userId }) => {
  try {
    await configureAndroidChannel();

    const granted = await requestPushPermission();
    if (!granted) return { pushToken: null, granted: false };

    const pushToken = await getExpoPushToken();
    if (!pushToken) return { pushToken: null, granted: true };

    if (userId) {
      await syncPushTokenWithBackend({ userId, pushToken });
    }

    return { pushToken, granted: true };
  } catch (error) {
    console.warn("Push notification registration failed:", error?.message || error);
    return { pushToken: null, granted: false, error };
  }
};

const addNotificationListeners = ({
  onNotificationReceived,
  onNotificationResponse,
} = {}) => {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    onNotificationReceived?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onNotificationResponse?.(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
};

const buildNavigationAction = (notification) => {
  const content = notification?.request?.content ?? {};
  const data = content?.data ?? {};
  const type = String(data?.type || "").toLowerCase();

  if (data?.pathname) {
    return {
      pathname: String(data.pathname),
      params: data?.params && typeof data.params === "object" ? data.params : {},
    };
  }

  const action =
    String(data?.action || "").toLowerCase() ||
    NOTIFICATION_ACTIONS[type] ||
    (MESSAGE_TYPES.has(type)
      ? ACTION_OPEN_CHAT
      : BONDUP_TYPES.has(type)
        ? ACTION_OPEN_BONDUP_CHAT
        : NOTIFICATION_ACTIONS.default);

  if (action === ACTION_OPEN_CHAT && data?.matchId) {
    return {
      pathname: "/chat-screen",
      params: {
        matchId: String(data.matchId),
        userId: data.senderId ? String(data.senderId) : "",
        name: data.senderName || content.title || "Chat",
        profileImage: data.senderImage || "",
        isOnline: "false",
        isSystem: "false",
        isVerified: "false",
        matchedDate: "",
      },
    };
  }

  if (action === ACTION_OPEN_BONDUP_CHAT && (data?.chatId || data?.bondupId)) {
    return {
      pathname: "/bondup-chat",
      params: {
        chatId: data.chatId ? String(data.chatId) : "",
        bondupId: data.bondupId ? String(data.bondupId) : "",
        bondupTitle: data.bondupTitle ? String(data.bondupTitle) : "Bondup",
        participantCount: data.participantCount ? String(data.participantCount) : "0",
      },
    };
  }

  return {
    pathname: "/(root)/(tab)/home",
    params: { openNotifications: "true" },
  };
};

const handleNotificationResponse = ({ response, router }) => {
  const notification = response?.notification;
  const requestId = notification?.request?.identifier;

  if (!notification || !router) return;
  if (requestId && requestId === lastHandledNotificationId) return;

  lastHandledNotificationId = requestId || Date.now().toString();
  const action = buildNavigationAction(notification);
  router.push(action);
};

const handleInitialNotificationResponse = async ({ router }) => {
  if (!router) return;
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response?.notification) return;

  handleNotificationResponse({ response, router });
};

const PushNotificationService = {
  registerForPushNotifications,
  addNotificationListeners,
  buildNavigationAction,
  handleNotificationResponse,
  handleInitialNotificationResponse,
};

export default PushNotificationService;
