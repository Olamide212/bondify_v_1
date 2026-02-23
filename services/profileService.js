import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../utils/axiosInstance"; // your axios instance

let cachedProfile = null;
let cachedAt = 0;
let inFlightProfilePromise = null;
const PROFILE_CACHE_MS = 60000;
const PERSISTED_PROFILE_KEY = "@bondify/cache/profile";
const PERSISTED_PROFILE_BY_ID_PREFIX = "@bondify/cache/profileById/";
const PERSISTED_LOOKUPS_PREFIX = "@bondify/cache/lookups/";
const PERSISTED_DISCOVERY_PREFIX = "@bondify/cache/discovery/";

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

const writePersistedCache = async (key, value) => {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        value,
        updatedAt: Date.now(),
      })
    );
  } catch (error) {
    console.warn(`Failed to persist cache for ${key}:`, error?.message || error);
  }
};

const readPersistedCache = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const parsed = safeParse(raw);
    return parsed?.value ?? null;
  } catch (error) {
    console.warn(`Failed to read cache for ${key}:`, error?.message || error);
    return null;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMyProfile = async ({ force = false } = {}) => {
  const now = Date.now();

  if (!force && cachedProfile && now - cachedAt < PROFILE_CACHE_MS) {
    return cachedProfile;
  }

  if (!force && !cachedProfile) {
    const persistedProfile = await readPersistedCache(PERSISTED_PROFILE_KEY);
    if (persistedProfile) {
      cachedProfile = persistedProfile;
      cachedAt = Date.now();
      return persistedProfile;
    }
  }

  if (!force && inFlightProfilePromise) {
    return inFlightProfilePromise;
  }

  const requestPromise = (async () => {
    let lastError;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await apiClient.get("/profile");
        const payload = response.data?.data ?? response.data;
        const profile = payload?.user ?? payload;
        cachedProfile = profile;
        cachedAt = Date.now();
        await writePersistedCache(PERSISTED_PROFILE_KEY, profile);
        return profile;
      } catch (err) {
        lastError = err;
        if (err?.response?.status === 429 && attempt === 0) {
          await sleep(800);
          continue;
        }
        break;
      }
    }

    const persistedProfile = await readPersistedCache(PERSISTED_PROFILE_KEY);
    if (persistedProfile) {
      cachedProfile = persistedProfile;
      cachedAt = Date.now();
      return persistedProfile;
    }

    throw (
      lastError?.response?.data?.message ||
      lastError?.message ||
      "Failed to fetch profile"
    );
  })();

  inFlightProfilePromise = requestPromise;

  try {
    return await requestPromise;
  } finally {
    if (inFlightProfilePromise === requestPromise) {
      inFlightProfilePromise = null;
    }
  }
};

const getProfileById = async (id) => {
  const cacheKey = `${PERSISTED_PROFILE_BY_ID_PREFIX}${id}`;

  try {
    const response = await apiClient.get(`/profile/${id}`);
    const payload = response.data?.data ?? response.data;
    const profile = payload?.profile ?? payload?.user ?? payload;
    await writePersistedCache(cacheKey, profile);
    return profile;
  } catch (err) {
    const persistedProfile = await readPersistedCache(cacheKey);
    if (persistedProfile) {
      return persistedProfile;
    }

    throw (
      err.response?.data?.message || err.message || "Failed to fetch profile"
    );
  }
};

const updateProfile = async (fields) => {
  try {
    const response = await apiClient.patch("/profile", fields);
    const payload = response.data?.data ?? response.data;
    const profile = payload?.user ?? payload;
    cachedProfile = profile;
    cachedAt = Date.now();
    await writePersistedCache(PERSISTED_PROFILE_KEY, profile);
    return profile;
  } catch (err) {
    throw err.response?.data?.message || err.message || "Profile update failed";
  }
};

const completeOnboarding = async () => {
  try {
    const response = await apiClient.post("/profile/complete-onboarding");
    const payload = response.data?.data ?? response.data;
    const profile = payload?.user ?? payload;
    cachedProfile = profile;
    cachedAt = Date.now();
    await writePersistedCache(PERSISTED_PROFILE_KEY, profile);
    return profile;
  } catch (err) {
    throw (
      err.response?.data?.message || err.message || "Complete onboarding failed"
    );
  }
};

const uploadPhotos = async (photoUris) => {
  try {
    const formData = new FormData();
    photoUris.forEach((uri, index) => {
      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";
      formData.append("photos", {
        uri,
        name: filename || `photo_${index}.jpg`,
        type,
      });
    });

    const response = await apiClient.post("/upload/photos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const payload = response.data?.data ?? response.data;
    return payload?.images ?? [];
  } catch (err) {
    throw (
      err.response?.data?.message || err.message || "Photo upload failed"
    );
  }
};

const deletePhoto = async (publicId) => {
  try {
    const encodedPublicId = encodeURIComponent(publicId);
    const response = await apiClient.delete(`/upload/photos/${encodedPublicId}`);
    const payload = response.data?.data ?? response.data;
    return payload?.images ?? [];
  } catch (err) {
    throw err.response?.data?.message || err.message || "Photo delete failed";
  }
};

const getLookups = async (type) => {
  const cacheKey = `${PERSISTED_LOOKUPS_PREFIX}${type}`;
  try {
    const response = await apiClient.get(`/lookup?type=${type}`);
    const payload = response.data?.data?.lookups ?? response.data?.lookups;
    const lookups = Array.isArray(payload) ? payload : [];
    await writePersistedCache(cacheKey, lookups);
    return lookups;
  } catch (err) {
    const persistedLookups = await readPersistedCache(cacheKey);
    if (Array.isArray(persistedLookups) && persistedLookups.length > 0) {
      return persistedLookups;
    }

    throw (
      err.response?.data?.message || err.message || "Failed to fetch lookups"
    );
  }
};

const getDiscoveryProfiles = async (params = {}, config = {}) => {
  const { includePagination = false } = config;
  const cacheKey = `${PERSISTED_DISCOVERY_PREFIX}${stableStringify(params || {})}`;
  try {
    const response = await apiClient.get("/discover", { params });
    const payload = response.data?.data ?? response.data;
    const profiles = payload?.profiles ?? [];
    await writePersistedCache(cacheKey, profiles);
    if (includePagination) {
      return {
        profiles,
        pagination: payload?.pagination ?? null,
      };
    }
    return profiles;
  } catch (err) {
    const persistedProfiles = await readPersistedCache(cacheKey);
    if (Array.isArray(persistedProfiles) && persistedProfiles.length > 0) {
      if (includePagination) {
        return {
          profiles: persistedProfiles,
          pagination: null,
        };
      }
      return persistedProfiles;
    }

    const message =
      err.response?.data?.message ||
      err.message ||
      "Failed to fetch discovery profiles";
    throw new Error(message);
  }
};

const performSwipeAction = async ({ likedUserId, type }) => {
  try {
    const response = await apiClient.post("/discover/action", {
      likedUserId,
      type,
    });
    const payload = response.data?.data ?? response.data;
    return payload ?? {};
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Failed to record swipe";
    throw new Error(message);
  }
};

export const profileService = {
  getMyProfile,
  getProfileById,
  updateProfile,
  completeOnboarding,
  uploadPhotos,
  deletePhoto,
  getLookups,
  getDiscoveryProfiles,
  performSwipeAction,
};
