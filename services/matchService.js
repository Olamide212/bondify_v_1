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

export const matchService = {
  getMatches,
};
