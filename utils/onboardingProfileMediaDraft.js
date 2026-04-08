import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirstProfileImageUrl, normalizeProfileMedia } from "./profileMedia";

const KEY = "@bondify/onboarding/profileMediaDraft";

export const saveOnboardingProfileMediaDraft = async (mediaItems) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(Array.isArray(mediaItems) ? mediaItems : []));
};

export const getOnboardingProfileMediaDraft = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const clearOnboardingProfileMediaDraft = async () => {
  await AsyncStorage.removeItem(KEY);
};

export const getOnboardingDraftMainPhotoUrl = async () => {
  const items = await getOnboardingProfileMediaDraft();
  return getFirstProfileImageUrl(normalizeProfileMedia(items));
};