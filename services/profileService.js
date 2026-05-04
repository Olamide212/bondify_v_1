import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../utils/axiosInstance"; // your axios instance
import cacheManager from "../utils/cacheManager";

let cachedProfile = null;
let cachedAt = 0;
let inFlightProfilePromise = null;
const inFlightLookupPromises = new Map();
const PROFILE_CACHE_MS = 60000;
const PERSISTED_PROFILE_KEY = "@bondify/cache/profile";
const PERSISTED_PROFILE_BY_ID_PREFIX = "@bondify/cache/profileById/";
const PERSISTED_LOOKUPS_PREFIX = "@bondify/cache/lookups/";

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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

const compressImage = async (uri) => {
  try {
    const { manipulate } = await import("expo-image-manipulator");
    const result = await manipulate(
      uri,
      [], // no resize — keep original dimensions & clarity
      { compress: 0.95, format: "jpeg" }
    );
    return result.uri;
  } catch (err) {
    console.warn("Image compression failed, using original:", err);
    return uri;
  }
};

const MAX_PROFILE_VIDEO_DURATION_MS = 5000;

const getUploadAssetMeta = async (item, index) => {
  const asset = typeof item === "string" ? { uri: item, type: "image" } : item;
  const isVideo = asset?.type === "video" || asset?.mimeType?.startsWith?.("video/");

  if (!asset?.uri) {
    throw new Error("Invalid media selected");
  }

  const durationMs = Number(asset?.duration ?? 0);
  if (isVideo) {
    if (!durationMs) {
      throw new Error("Unable to verify video length. Please choose a video that is 5 seconds or less.");
    }

    if (durationMs > MAX_PROFILE_VIDEO_DURATION_MS) {
      throw new Error("Profile videos must be 5 seconds or less.");
    }
  }

  const uploadUri = isVideo ? asset.uri : await compressImage(asset.uri);
  const fallbackName = isVideo ? `video_${index}.mp4` : `photo_${index}.jpg`;
  const filename = asset.fileName || uploadUri.split("/").pop() || fallbackName;
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
  const inferredType = isVideo
    ? `video/${match?.[1]?.toLowerCase() || "mp4"}`
    : `image/${match?.[1]?.toLowerCase() || "jpeg"}`;

  return {
    uri: uploadUri,
    name: filename,
    type: asset.mimeType || inferredType,
    durationMs: isVideo ? durationMs : null,
  };
};

const uploadPhotos = async (photoUris) => {
  try {
    const formData = new FormData();
    const durations = [];
    
    for (let i = 0; i < photoUris.length; i++) {
      const fileMeta = await getUploadAssetMeta(photoUris[i], i);
      durations.push(fileMeta.durationMs);
      formData.append("photos", {
        uri: fileMeta.uri,
        name: fileMeta.name,
        type: fileMeta.type,
      });
    }

    formData.append("durations", JSON.stringify(durations));

    const response = await apiClient.post("/upload/photos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const payload = response.data?.data ?? response.data;
    return payload?.images ?? [];
  } catch (err) {
    const message = err.response?.data?.message || err.message || "Profile media upload failed";
    const code = err.response?.data?.code || null;
    const uploadError = new Error(message);
    uploadError.code = code;
    throw uploadError;
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
  const inFlight = inFlightLookupPromises.get(type);
  if (inFlight) return inFlight;

  const requestPromise = (async () => {
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
  })();

  inFlightLookupPromises.set(type, requestPromise);
  try {
    return await requestPromise;
  } finally {
    if (inFlightLookupPromises.get(type) === requestPromise) {
      inFlightLookupPromises.delete(type);
    }
  }
};

const preloadLookups = async (types = []) => {
  const uniqueTypes = [...new Set((Array.isArray(types) ? types : [types]).filter(Boolean))];
  await Promise.all(uniqueTypes.map((type) => getLookups(type).catch(() => [])));
};

// ─── Discovery profiles caching ──────────────────────────────────────────────
const DISCOVERY_CACHE_KEY = "@bondify/cache/discoveryProfiles";
const DISCOVERY_CACHE_MS = 60000; // 1 minute cache
let discoveryCache = null;
let discoveryCachedAt = 0;

// Helper to determine if cache should be used
const shouldUseCachedDiscovery = (skipCache, params, now) => {
  const isFirstPage = !params.page || params.page === 1;
  const hasFilters = Object.keys(params).some(k => k !== 'page' && k !== 'limit');
  const isCacheValid = discoveryCache && now - discoveryCachedAt < DISCOVERY_CACHE_MS;
  
  return {
    canUseCache: !skipCache && isFirstPage && !hasFilters && isCacheValid,
    canCache: isFirstPage && !hasFilters,
    canUseStaleCacheOnError: isFirstPage && !hasFilters && discoveryCache !== null,
  };
};

const getDiscoveryProfiles = async (params = {}, config = {}) => {
  const { includePagination = false, skipCache = false } = config;
  const now = Date.now();
  const cacheInfo = shouldUseCachedDiscovery(skipCache, params, now);
  
  // Return cached data if valid
  if (cacheInfo.canUseCache) {
    console.log('[profileService] Using cached discovery profiles');
    if (includePagination) {
      return {
        profiles: discoveryCache.profiles,
        pagination: discoveryCache.pagination,
      };
    }
    return discoveryCache.profiles;
  }
  
  try {
    const response = await apiClient.get("/discover", { params });
    const payload = response.data?.data ?? response.data;
    const profiles = payload?.profiles ?? [];
    
    // Cache first page results without filters
    if (cacheInfo.canCache) {
      discoveryCache = {
        profiles,
        pagination: payload?.pagination ?? null,
      };
      discoveryCachedAt = now;
    }
    
    if (includePagination) {
      return {
        profiles,
        pagination: payload?.pagination ?? null,
      };
    }
    return profiles;
  } catch (err) {
    // On error, return cached data if available (stale-while-revalidate)
    if (cacheInfo.canUseStaleCacheOnError) {
      console.log('[profileService] Network error, using stale cache');
      if (includePagination) {
        return {
          profiles: discoveryCache.profiles,
          pagination: discoveryCache.pagination,
        };
      }
      return discoveryCache.profiles;
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

const getLikedYou = async (params = {}) => {
  try {
    const response = await apiClient.get("/discover/liked-you", { params });
    const payload = response.data?.data ?? response.data;
    return payload?.profiles ?? [];
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Failed to fetch likes";
    throw new Error(message);
  }
};

const getYouLiked = async (params = {}) => {
  try {
    const response = await apiClient.get("/discover/you-liked", { params });
    const payload = response.data?.data ?? response.data;
    return payload?.profiles ?? [];
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Failed to fetch likes";
    throw new Error(message);
  }
};

const getPassed = async (params = {}) => {
  try {
    const response = await apiClient.get("/discover/passed", { params });
    const payload = response.data?.data ?? response.data;
    return payload?.profiles ?? [];
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Failed to fetch passed";
    throw new Error(message);
  }
};

const getProfileVisitors = async (params = {}) => {
  try {
    const response = await apiClient.get("/profile/visitors", { params });
    const payload = response.data?.data ?? response.data;
    return payload?.profiles ?? [];
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Failed to fetch visitors";
    throw new Error(message);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
//  ADD THESE TWO METHODS TO YOUR EXISTING profileService.js
// ─────────────────────────────────────────────────────────────────────────────

// Paste these alongside your existing profileService methods:

  /**
   * Upload a voice prompt audio file.
   * @param {string} localUri — local file URI from expo-audio recording
   * @returns {{ voicePrompt: string, voicePromptPublicId: string }}
   */
  const uploadVoicePrompt = async (localUri) => {
    const formData = new FormData();

    // Derive filename and mime from URI
    const filename  = localUri.split('/').pop() || 'voice.m4a';
    const extension = filename.split('.').pop()?.toLowerCase() || 'm4a';
    const mimeMap   = { m4a: 'audio/m4a', mp4: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', mp3: 'audio/mpeg' };
    const mimeType  = mimeMap[extension] || 'audio/m4a';

    formData.append('voicePrompt', {
      uri:  localUri,
      name: filename,
      type: mimeType,
    });

    const response = await apiClient.post('/profile/voice-prompt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data?.data ?? {};
  };

  /**
   * Delete the current user's voice prompt.
   */
  const deleteVoicePrompt = async () => {
    const response = await apiClient.delete('/profile/voice-prompt');
    return response.data;
  };


// ─────────────────────────────────────────────────────────────────────────────
//  ADD THESE TWO ROUTES TO YOUR profileRoutes.js
// ─────────────────────────────────────────────────────────────────────────────

// (assuming multer is already configured for photo uploads — reuse the same instance)

// const upload = multer({ storage: multer.memoryStorage() });

// router.post('/voice-prompt',   protect, upload.single('voicePrompt'), uploadVoicePrompt);
// router.delete('/voice-prompt', protect, deleteVoicePrompt);


// ─────────────────────────────────────────────────────────────────────────────
//  ADD THESE FIELDS TO YOUR User.js MONGOOSE MODEL (inside the schema)
// ─────────────────────────────────────────────────────────────────────────────

// voicePrompt:          { type: String, default: null },   // Cloudinary secure_url
// voicePromptPublicId:  { type: String, default: null },   // Cloudinary public_id for deletion


// ─────────────────────────────────────────────────────────────────────────────
//  INSTALL (if not already present)
// ─────────────────────────────────────────────────────────────────────────────

// npx expo install expo-audio expo-file-system

/**
 * Called when user logs in to initialize cache for that user
 */
const onUserLogin = (userId) => {
  if (!userId) return;
  cacheManager.setCurrentUser(userId);
};

/**
 * Called when user changes or logs out to clear old user's cache
 */
const onUserLogout = async (userId) => {
  if (userId) {
    await cacheManager.clearAllForUser(userId);
  }
  cacheManager.setCurrentUser(null);
};

/**
 * Clear profile-related cache
 */
const clearProfileCache = async () => {
  await cacheManager.clearNamespace("profile");
};

/**
 * Boost profile visibility
 * @returns {Promise<{success: boolean, message: string, boostedAt: Date}>}
 */
const boostProfile = async () => {
  try {
    const response = await apiClient.post("/profile/boost");
    return response.data;
  } catch (error) {
    console.error("Failed to boost profile:", error);
    throw error;
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
  preloadLookups,
  getDiscoveryProfiles,
  performSwipeAction,
  getLikedYou,
  getYouLiked,
  getPassed,
  getProfileVisitors,
  uploadVoicePrompt,
  deleteVoicePrompt,
  boostProfile,
  onUserLogin,
  onUserLogout,
  clearProfileCache,
};
