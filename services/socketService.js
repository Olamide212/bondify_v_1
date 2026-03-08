import Constants from "expo-constants";
import { io } from "socket.io-client";
import { tokenManager } from "../utils/tokenManager";

let socketInstance = null;

const resolveBaseUrl = (url) => {
  if (__DEV__ && url) {
    const hostUri =
      Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    if (hostUri) {
      const devHost = hostUri.split(":")[0];
      if (devHost) {
        return url.replace(/localhost|127\.0\.0\.1/g, devHost);
      }
    }
  }
  return url;
};

const API_BASE_URL = resolveBaseUrl(
  (__DEV__
    ? process.env.EXPO_PUBLIC_DEV_API_BASE_URL
    : process.env.EXPO_PUBLIC_PROD_API_BASE_URL) ||
    process.env.EXPO_PUBLIC_DEV_API_BASE_URL
);

const buildSocketUrl = () => {
  if (!API_BASE_URL) {
    return "";
  }

  try {
    const parsedUrl = new URL(API_BASE_URL);
    return `${parsedUrl.protocol}//${parsedUrl.host}`;
  } catch (_error) {
    return API_BASE_URL.replace(/\/api\/?$/, "");
  }
};

const connect = async () => {
  const token = await tokenManager.getToken();
  if (!token) {
    return null;
  }

  const socketUrl = buildSocketUrl();
  if (!socketUrl) {
    return null;
  }

  if (!socketInstance) {
    socketInstance = io(socketUrl, {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  } else {
    socketInstance.auth = { token };
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
};

const on = (eventName, handler) => {
  if (!socketInstance || !eventName || !handler) return;
  socketInstance.on(eventName, handler);
};

const off = (eventName, handler) => {
  if (!socketInstance || !eventName) return;
  if (handler) {
    socketInstance.off(eventName, handler);
    return;
  }
  socketInstance.off(eventName);
};

const joinMatch = (matchId) => {
  if (!socketInstance || !matchId) return;
  socketInstance.emit("chat:join", { matchId });
};

const leaveMatch = (matchId) => {
  if (!socketInstance || !matchId) return;
  socketInstance.emit("chat:leave", { matchId });
};

const disconnect = () => {
  if (!socketInstance) return;
  socketInstance.disconnect();
};
const emit = (eventName, payload) => {
  if (!socketInstance || !eventName) return;
  socketInstance.emit(eventName, payload);
};

export const socketService = {
  connect,
  on,
  off,
  joinMatch,
  leaveMatch,
  emit,
  disconnect,
};
