import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../utils/axiosInstance";

const MATCHES_CACHE_PREFIX = "@bondify/cache/matches/";
const inMemoryMatchesCache = new Map();

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

const buildCacheKey = (options = {}) =>
  `${MATCHES_CACHE_PREFIX}${stableStringify(options || {})}`;

const readCachedMatches = async (key) => {
  if (inMemoryMatchesCache.has(key)) {
    return inMemoryMatchesCache.get(key);
  }

  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const parsed = safeParse(raw);
    const matches = Array.isArray(parsed?.value) ? parsed.value : null;

    if (matches) {
      inMemoryMatchesCache.set(key, matches);
    }

    return matches;
  } catch (error) {
    console.warn("Failed to read matches cache:", error?.message || error);
    return null;
  }
};

const writeCachedMatches = async (key, matches) => {
  inMemoryMatchesCache.set(key, matches);

  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ value: matches, updatedAt: Date.now() })
    );
  } catch (error) {
    console.warn("Failed to persist matches cache:", error?.message || error);
  }
};

const getMatches = async (options = {}) => {
  const cacheKey = buildCacheKey(options);

  try {
    const response = await apiClient.get("/matches", { params: options });
    const payload = response.data?.data ?? response.data;
    const matches = payload?.matches ?? [];
    await writeCachedMatches(cacheKey, matches);
    return matches;
  } catch (error) {
    if (isNetworkLikeError(error)) {
      const cachedMatches = await readCachedMatches(cacheKey);
      if (Array.isArray(cachedMatches)) {
        return cachedMatches;
      }
    }

    const message =
      error.response?.data?.message || error.message || "Failed to load matches";
    throw new Error(message);
  }
};

const getCachedMatches = async (options = {}) => {
  const cacheKey = buildCacheKey(options);
  const cachedMatches = await readCachedMatches(cacheKey);
  return Array.isArray(cachedMatches) ? cachedMatches : [];
};

const unmatch = async (matchId) => {
  if (!matchId) {
    throw new Error("Match ID is required");
  }

  try {
    const response = await apiClient.delete(`/matches/${matchId}`);
    return response.data?.data ?? response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Failed to unmatch user";
    throw new Error(message);
  }
};

// @desc  Check if the current user has already interacted with a target user.
// @returns {{ status: 'liked' | 'passed' | 'superliked' | 'matched' | 'none' }}
const getInteractionStatus = async (targetUserId) => {
  try {
    const response = await apiClient.get(`/matches/interaction/${targetUserId}`);
    return response.data?.data ?? { status: 'none' };
  } catch (error) {
    // Fail gracefully — if endpoint isn't wired yet, default to 'none'
    // so the action buttons still render rather than permanently hiding.
    console.warn("getInteractionStatus error:", error?.message);
    return { status: 'none' };
  }
};

export const matchService = {
  getCachedMatches,
  getMatches,
  unmatch,
  getInteractionStatus,
};