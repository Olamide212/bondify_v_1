import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../utils/axiosInstance";

const MESSAGES_CACHE_PREFIX = "@bondify/cache/messages/";
const inMemoryMessagesCache = new Map();

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const stableStringify = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const sortedKeys = Object.keys(value).sort();
  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`
  );
  return `{${pairs.join(",")}}`;
};

const isNetworkLikeError = (error) => !error?.response;

const buildMessagesCacheKey = (matchId, options = {}) =>
  `${MESSAGES_CACHE_PREFIX}${matchId}:${stableStringify(options || {})}`;

const readCachedMessages = async (key) => {
  if (inMemoryMessagesCache.has(key)) {
    return inMemoryMessagesCache.get(key);
  }

  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const parsed = safeParse(raw);
    const messages = Array.isArray(parsed?.value) ? parsed.value : null;

    if (messages) {
      inMemoryMessagesCache.set(key, messages);
    }

    return messages;
  } catch (error) {
    console.warn("Failed to read messages cache:", error?.message || error);
    return null;
  }
};

const writeCachedMessages = async (key, messages) => {
  inMemoryMessagesCache.set(key, messages);

  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ value: messages, updatedAt: Date.now() })
    );
  } catch (error) {
    console.warn("Failed to persist messages cache:", error?.message || error);
  }
};

const updateAllMatchCaches = async (matchId, updater) => {
  const prefix = `${MESSAGES_CACHE_PREFIX}${matchId}:`;
  const updateTasks = [];

  inMemoryMessagesCache.forEach((messages, key) => {
    if (!key.startsWith(prefix) || !Array.isArray(messages)) return;
    const nextMessages = updater(messages);
    inMemoryMessagesCache.set(key, nextMessages);
    updateTasks.push(
      AsyncStorage.setItem(
        key,
        JSON.stringify({ value: nextMessages, updatedAt: Date.now() })
      ).catch((error) => {
        console.warn("Failed to update messages cache:", error?.message || error);
      })
    );
  });

  if (updateTasks.length > 0) {
    await Promise.all(updateTasks);
  }
};

const getMessages = async (matchId, options = {}, config = {}) => {
  const cacheKey = buildMessagesCacheKey(matchId, options);
  const { includePagination = false } = config;

  try {
    const response = await apiClient.get(`/messages/${matchId}`, {
      params: options,
    });
    const payload = response.data?.data ?? response.data;
    const messages = payload?.messages ?? [];
    await writeCachedMessages(cacheKey, messages);
    if (includePagination) {
      return {
        messages,
        pagination: payload?.pagination || null,
      };
    }
    return messages;
  } catch (error) {
    if (isNetworkLikeError(error)) {
      const cachedMessages = await readCachedMessages(cacheKey);
      if (Array.isArray(cachedMessages)) {
        if (includePagination) {
          return {
            messages: cachedMessages,
            pagination: null,
          };
        }
        return cachedMessages;
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to load messages";
    throw new Error(message);
  }
};

const sendMessage = async (matchId, payload) => {
  try {
    const response = await apiClient.post(`/messages/${matchId}`, payload);
    const data = response.data?.data ?? response.data;
    const messageData = data?.message ?? data;

    await updateAllMatchCaches(matchId, (existingMessages) => [
      ...existingMessages,
      messageData,
    ]);

    return messageData;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to send message";
    throw new Error(message);
  }
};

const uploadChatMedia = async ({ uri, mimeType, fileName }) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: mimeType,
      name: fileName,
    });

    const response = await apiClient.post('/upload/chat-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const payload = response.data?.data ?? response.data;
    return {
      mediaUrl: payload?.mediaUrl,
      mediaType: payload?.mediaType,
      publicId: payload?.publicId,
    };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to upload chat media';
    throw new Error(message);
  }
};

const deleteMessage = async (messageId) => {
  try {
    const response = await apiClient.delete(`/messages/${messageId}`);
    const payload = response.data?.data ?? response.data;
    const deletedId = payload?.messageId ?? payload?.id ?? messageId;

    if (deletedId) {
      const updateTasks = [];
      inMemoryMessagesCache.forEach((messages, key) => {
        if (!Array.isArray(messages)) return;
        const nextMessages = messages.filter(
          (message) => (message?._id ?? message?.id) !== deletedId
        );
        if (nextMessages.length === messages.length) return;
        inMemoryMessagesCache.set(key, nextMessages);
        updateTasks.push(
          AsyncStorage.setItem(
            key,
            JSON.stringify({ value: nextMessages, updatedAt: Date.now() })
          )
        );
      });

      if (updateTasks.length > 0) {
        await Promise.all(
          updateTasks.map((task) =>
            task.catch((err) => {
              console.warn("Failed to update message cache after delete:", err?.message || err);
            })
          )
        );
      }
    }

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete message";
    throw new Error(message);
  }
};

export const messageService = {
  getMessages,
  sendMessage,
  uploadChatMedia,
  deleteMessage,
};
