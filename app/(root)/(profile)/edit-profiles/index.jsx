/**
 * ProfileDetails.js  — Edit Profile screen
 */

import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import GeneralHeader from '../../../../components/headers/GeneralHeader';
import OwnProfileCard from '../../../../components/homeScreen/OwnProfileCard';
import AboutMe from '../../../../components/profileScreen/About';
import BasicInfo from '../../../../components/profileScreen/BasicInfo';
import BloodGroup from '../../../../components/profileScreen/BloodGroup';
import Genotype from '../../../../components/profileScreen/Genotype';
import InterestCard from '../../../../components/profileScreen/InterestCard';
import LanguageSelection from '../../../../components/profileScreen/LanguageSelection';
import Location from '../../../../components/profileScreen/Location';
import MyInfo from '../../../../components/profileScreen/MyInfo';
import Occupation from '../../../../components/profileScreen/Occupation';
import ProfileAnswers from '../../../../components/profileScreen/ProfileAnswers';
import ProfilePhotoGrid from '../../../../components/profileScreen/ProfilePhotoGrid';
import School from '../../../../components/profileScreen/School';
import Tagline from '../../../../components/profileScreen/Tagline';
import Verification from '../../../../components/profileScreen/Verification';
import Education from '../../../../components/profileScreen/WorkAndEducation';
import TextHeadingOne from '../../../../components/ui/TextHeadingOne';
import { colors as C } from '../../../../constant/colors';
import { useAlert } from '../../../../context/AlertContext';
import { useTheme } from '../../../../context/ThemeContext';
import { profileService } from '../../../../services/profileService';
import { voiceIntroStore } from '../../../../store/voiceIntroStore';
import { normalizeProfileMedia } from '../../../../utils/profileMedia';

const TABS = ['Edit', 'View Profile'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TabBar = ({ activeIndex, onChange }) => (
  <View style={tb.tabBar}>
    {TABS.map((label, i) => (
      <TouchableOpacity
        key={label}
        style={[tb.tabItem, activeIndex === i && tb.tabItemActive]}
        onPress={() => onChange(i)}
        activeOpacity={0.8}
      >
        <Text style={[tb.label, activeIndex === i ? tb.labelActive : tb.labelInactive]}>
          {label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const tb = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.whiteLight,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#111',
  },
  label: { fontFamily: 'PlusJakartaSansBold', fontSize: 15 },
  labelActive: { color: '#E5E5E5' },
  labelInactive: { color: '#9CA3AF' },
});

// ─── View Profile tab ─────────────────────────────────────────────────────────

const ViewProfileTab = ({ profile }) => {
  const normalizedProfile = {
    ...profile,
    images: normalizeProfileMedia(profile?.images),
    name: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.name || '',
  };

  return (
    <View style={{ flex: 1 }}>
      <OwnProfileCard profile={normalizedProfile} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileDetails() {
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const pagerRef = useRef(null);
  const hasLoadedRef = useRef(false);

  // ── Tab handling ─────────────────────────────────────────────────────────

  const handleTabPress = (index) => {
    setActiveTab(index);
    pagerRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  };

  const handlePageScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== activeTab && newIndex >= 0 && newIndex < TABS.length) {
      setActiveTab(newIndex);
    }
  };

  // ── Load profile ──────────────────────────────────────────────────────────

  const loadProfile = useCallback(async ({ force = false, showLoading = true } = {}) => {
    try {
      if (showLoading) setLoading(true);
      const userProfile = await profileService.getMyProfile({ force });
      setProfile(userProfile || {});
    } catch (error) {
      console.error('Failed to load edit profile data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadProfile({ force: true, showLoading: false });
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      // Only load once on initial mount, skip on subsequent visits
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;
      loadProfile({ force: false, showLoading: true });
    }, [loadProfile])
  );

  // ── Param-based field updates (from child screens) ────────────────────────

  useEffect(() => {
    if (!params.updatedField || !params.updatedValue) return;
    setProfile((prev) => ({ ...prev, [params.updatedField]: params.updatedValue }));
    router.setParams({ updatedField: undefined, updatedValue: undefined });
  }, [params.updatedField, params.updatedValue, router]);

  // ── Register voice intro store callbacks ──────────────────────────────────
  // These let VoiceIntroScreen call upload/delete without needing
  // function props through Expo Router params.

  useEffect(() => {
    if (!voiceIntroStore) return;

    voiceIntroStore.setSave(async (localUri) => {
      try {
        const updated = await profileService.uploadVoicePrompt(localUri);
        // Only update the flag — do NOT overwrite with remote URL.
        // VoiceIntroScreen keeps localUriRef so playback always uses
        // the cached local file, never the remote URL.
        setProfile((prev) => ({
          ...prev,
          voicePrompt: updated?.voicePrompt ?? prev.voicePrompt ?? localUri,
        }));
      } catch (err) {
        console.error('[ProfileDetails] uploadVoicePrompt failed:', err);
        throw err; // rethrow so VoiceIntroScreen can show its error alert
      }
    });

    voiceIntroStore.setDelete(async () => {
      try {
        await profileService.deleteVoicePrompt();
        setProfile((prev) => ({ ...prev, voicePrompt: null }));
      } catch (err) {
        console.error('[ProfileDetails] deleteVoicePrompt failed:', err);
        throw err;
      }
    });

    return () => voiceIntroStore.clear();
  }, []);

  // ── Field update (all other fields) ──────────────────────────────────────

  const handleUpdateField = async (field, value) => {
    try {
      const updatedProfile = await profileService.updateProfile({ [field]: value });
      setProfile(updatedProfile || {});
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }

  };

  // ── Photo handlers ────────────────────────────────────────────────────────

  const handleAddPhoto = async () => {
    try {
      const existingPhotoCount = Array.isArray(profile?.images) ? profile.images.length : 0;
      if (existingPhotoCount >= 6) {
        showAlert({
          icon: 'camera',
          title: 'Media Limit Reached',
          message: 'You can upload up to 6 photos or videos only.',
          actions: [{ label: 'OK', style: 'primary' }],
        });
        return;
      }
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: existingPhotoCount === 0 ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });
      if (result.canceled) return;

      await profileService.uploadPhotos([result.assets[0]]);
      await loadProfile();
    } catch (error) {
      console.error('Failed to add photo:', error);
      const isPhotoRejected = error?.code === 'INVALID_PHOTO';
      showAlert({
        icon: 'error',
        title: isPhotoRejected ? 'Photo Rejected' : 'Upload Failed',
        message: error?.message || String(error || 'Failed to upload media.'),
        actions: [{ label: 'OK', style: 'primary' }],
      });
    }
  };

  const handleEditPhoto = async (imageItem, index) => {
    try {
      if (!imageItem) return;

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: index === 0 ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const currentImages = normalizeProfileMedia(profile.images || []);
      const remainingImages = currentImages.filter((_, imageIndex) => imageIndex !== index);

      await profileService.updateProfile({ images: remainingImages });

      let didRebuildImages = false;

      try {
        const uploadedImages = normalizeProfileMedia(
          await profileService.uploadPhotos([result.assets[0]])
        );

        const newImage = uploadedImages.find(
          (uploaded) => uploaded?.publicId && !remainingImages.some((existing) => existing?.publicId === uploaded.publicId)
        );

        if (!newImage) {
          throw new Error('Failed to identify the edited media after upload.');
        }

        const rebuiltImages = [...remainingImages];
        rebuiltImages.splice(index, 0, newImage);

        await profileService.updateProfile({ images: rebuiltImages });
        didRebuildImages = true;
      } catch (error) {
        await profileService.updateProfile({ images: currentImages });
        throw error;
      }

      if (didRebuildImages && imageItem?.publicId) {
        try {
          await profileService.deletePhoto(imageItem.publicId);
        } catch (cleanupError) {
          console.warn('Failed to remove replaced image from storage:', cleanupError);
        }
      }

      await loadProfile({ force: true, showLoading: false });
    } catch (error) {
      console.error('Failed to edit photo:', error);
      showAlert({
        icon: 'error',
        title: 'Edit Failed',
        message: String(error || 'Failed to edit media.'),
        actions: [{ label: 'OK', style: 'primary' }],
      });
    }
  };

  const handleRemovePhoto = async (imageItem) => {
    try {
      const publicId = imageItem?.publicId;
      if (!publicId) return;
      await profileService.deletePhoto(publicId);
      await loadProfile();
    } catch (error) {
      console.error('Failed to remove photo:', error);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaProvider style={{ backgroundColor: '#121212' }}>
      <SafeAreaView style={[s.safe, { backgroundColor: '#121212' }]}>

        <GeneralHeader
          title="Edit Profile"
          leftIcon={<ArrowLeft color={C.white} />}
          style={{ backgroundColor: '#121212' }}
        />

        {/* Tab bar */}
        <TabBar activeIndex={activeTab} onChange={handleTabPress} />

        {/* Swipeable pages */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handlePageScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {/* ── EDIT TAB ── */}
          <ScrollView
            style={{ width: SCREEN_WIDTH, flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            nestedScrollEnabled
          >
            {loading && (
              <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 20 }} />
            )}

            <View style={s.sections}>

              {/* Photos */}
              <View>
                <ProfilePhotoGrid
                  photos={normalizeProfileMedia(profile.images || [])}
                  onAddPhoto={handleAddPhoto}
                  onEditPhoto={handleEditPhoto}
                  onRemovePhoto={handleRemovePhoto}
                  title="My Photos"
                />
              </View>

              {/* Voice Intro */}

              {/* <View>
                <TextHeadingOne name="Voice Intro" />
                <VoiceIntroCard
                  hasRecording={!!profile?.voicePrompt}
                  voiceUri={
                    typeof profile?.voicePrompt === 'string'
                      ? profile.voicePrompt
                      : profile?.voicePrompt?.url ?? profile?.voicePrompt?.uri ?? null
                  }
                  onPress={() => router.push('/voice-intro')}
                  onReplace={() => router.push('/voice-intro')}
                  onDelete={handleVoiceDelete}
                />
              </View> */}

              {/* Verification */}
              <View>
                <TextHeadingOne name="Verification" />
                <Verification profile={profile} />
              </View>

              {/* Basic Info */}
              <View>
                <TextHeadingOne name="Basic Info" />
                <BasicInfo profile={profile} />
              </View>

              {/* Bio */}
              <View>
                <TextHeadingOne name="Bio" />
                <AboutMe profile={profile} onUpdateField={handleUpdateField} />
              </View>

              {/* Tagline */}
              <View>
                <TextHeadingOne name="Tagline" />
                <Tagline profile={profile} onUpdateField={handleUpdateField} />
              </View>

              {/* Location */}
              <View>
                <TextHeadingOne name="Location" />
                <Location profile={profile} onUpdateField={handleUpdateField} />
              </View>

              {/* Education */}
              <View>
                <TextHeadingOne name="Education Level" />
                <Education profile={profile} onUpdateField={handleUpdateField} />
              </View>

              {/* School */}
              <View>
                <TextHeadingOne name="School" />
                <School profile={profile} onUpdateField={handleUpdateField} />
              </View>

              {/* Occupation */}
              <View>
                <TextHeadingOne name="Occupation" />
                <Occupation profile={profile} onUpdateField={handleUpdateField} />
              </View>

              {/* Prompts */}
              <View>
                <TextHeadingOne name="Prompt" />
                <ProfileAnswers profile={profile} onUpdateField={handleUpdateField} />
              </View>

              {/* Interests */}
              <View>
                <InterestCard profile={profile} onUpdateField={handleUpdateField} />
              </View>

              {/* Languages */}
              <View>
                <TextHeadingOne name="Languages" />
                <LanguageSelection profile={profile} onUpdateField={handleUpdateField} />
              </View>

              {/* About Me */}
              <View>
                <TextHeadingOne name="About Me" />
                <MyInfo profile={profile} onUpdateField={handleUpdateField} />
              </View>

              {/* Blood Group & Genotype */}
              <View>
                <TextHeadingOne name="Blood Group & Genotype" />
                <View className="flex-col gap-4">
                  <BloodGroup profile={profile} onUpdateField={handleUpdateField} />
                  <Genotype profile={profile} onUpdateField={handleUpdateField} />
                </View>
              </View>

            </View>
          </ScrollView>

          {/* ── VIEW PROFILE TAB ── */}
          <View style={{ width: SCREEN_WIDTH }}>
            <ViewProfileTab profile={profile} />
          </View>

        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  sections: { flex: 1, gap: 12, marginTop: 10 },
});