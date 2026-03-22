import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * User-Specific Cache Manager
 *
 * Manages cached data with automatic user isolation.
 * When a new user logs in, the old user's cache is automatically cleared.
 * Prevents data leakage between users on shared devices.
 */

let currentUserId = null;

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getCacheKey = (userId, namespace, key) => {
  if (!userId || !namespace || !key) return null;
  return `@bondify/cache/${userId}/${namespace}/${key}`;
};

/**
 * Set the current user ID for cache operations
 * @param {string} userId - Current authenticated user ID
 */
const setCurrentUser = (userId) => {
  currentUserId = userId;
};

/**
 * Get the current user ID
 * @returns {string|null} Current user ID
 */
const getCurrentUser = () => {
  return currentUserId;
};

/**
 * Cache a value for the current user
 * @param {string} namespace - Cache namespace (e.g., 'profile', 'avatar', 'chat')
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttlMs - Time to live in milliseconds (optional)
 */
const set = async (namespace, key, value, ttlMs = null) => {
  if (!currentUserId) {
    console.warn("[CacheManager] No user ID set, cache operation skipped");
    return;
  }

  try {
    const cacheKey = getCacheKey(currentUserId, namespace, key);
    const cacheData = {
      value,
      savedAt: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn(
      `[CacheManager] Failed to cache ${namespace}/${key}:`,
      error?.message || error
    );
  }
};

/**
 * Get a cached value for the current user
 * @param {string} namespace - Cache namespace
 * @param {string} key - Cache key
 * @returns {*} Cached value or null if not found/expired
 */
const get = async (namespace, key) => {
  if (!currentUserId) {
    console.warn("[CacheManager] No user ID set, returning null");
    return null;
  }

  try {
    const cacheKey = getCacheKey(currentUserId, namespace, key);
    const raw = await AsyncStorage.getItem(cacheKey);

    if (!raw) return null;

    const cacheData = safeParse(raw);
    if (!cacheData) return null;

    // Check if expired
    if (cacheData.expiresAt && Date.now() > cacheData.expiresAt) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return cacheData.value;
  } catch (error) {
    console.warn(
      `[CacheManager] Failed to retrieve cache ${namespace}/${key}:`,
      error?.message || error
    );
    return null;
  }
};

/**
 * Check if a cached value exists and is not expired
 * @param {string} namespace - Cache namespace
 * @param {string} key - Cache key
 * @returns {boolean} True if valid cache exists
 */
const has = async (namespace, key) => {
  const value = await get(namespace, key);
  return value !== null;
};

/**
 * Remove a specific cached value
 * @param {string} namespace - Cache namespace
 * @param {string} key - Cache key
 */
const remove = async (namespace, key) => {
  if (!currentUserId) return;

  try {
    const cacheKey = getCacheKey(currentUserId, namespace, key);
    await AsyncStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn(
      `[CacheManager] Failed to remove cache ${namespace}/${key}:`,
      error?.message || error
    );
  }
};

/**
 * Clear all cache for a specific namespace of current user
 * @param {string} namespace - Cache namespace to clear
 */
const clearNamespace = async (namespace) => {
  if (!currentUserId) return;

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const prefixToRemove = `@bondify/cache/${currentUserId}/${namespace}/`;
    const keysToRemove = allKeys.filter((k) => k.startsWith(prefixToRemove));

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.warn(
      `[CacheManager] Failed to clear namespace ${namespace}:`,
      error?.message || error
    );
  }
};

/**
 * Clear ALL cache for current user
 * This should be called on logout or when user changes
 */
const clearAllForUser = async (userId = currentUserId) => {
  if (!userId) {
    console.warn("[CacheManager] No user ID provided to clear cache");
    return;
  }

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const prefixToRemove = `@bondify/cache/${userId}/`;
    const keysToRemove = allKeys.filter((k) => k.startsWith(prefixToRemove));

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.warn(
      `[CacheManager] Failed to clear all cache for user ${userId}:`,
      error?.message || error
    );
  }
};

/**
 * Clear old user cache on login
 * Call this when user changes to prevent data leakage
 * @param {string} newUserId - The new user ID
 * @param {string} oldUserId - The old user ID (optional)
 */
const onUserChange = async (newUserId, oldUserId = currentUserId) => {
  // Clear old user's cache
  if (oldUserId && oldUserId !== newUserId) {
    await clearAllForUser(oldUserId);
  }

  // Set new user
  setCurrentUser(newUserId);
};

export const cacheManager = {
  setCurrentUser,
  getCurrentUser,
  set,
  get,
  has,
  remove,
  clearNamespace,
  clearAllForUser,
  onUserChange,
};

export default cacheManager;
