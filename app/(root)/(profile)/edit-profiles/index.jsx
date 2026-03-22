/**
 * ProfileDetails.js  — Edit Profile screen
 *
 * Two tabs:
 *   "Edit"         — all form sections (existing) + new VoicePrompt section
 *   "View Profile" — read-only preview card exactly as others see you
 *
 * Voice prompt:
 *   onUpdateField('voicePrompt', localUri) → calls profileService.uploadVoicePrompt(uri)
 */

import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import Verification from '../../../../components/profileScreen/Verification';
import VoicePrompt from '../../../../components/profileScreen/VoicePrompt';
import Education from '../../../../components/profileScreen/WorkAndEducation';
import TextHeadingOne from '../../../../components/ui/TextHeadingOne';
import { colors as C } from '../../../../constant/colors';
import { useTheme } from '../../../../context/ThemeContext';
import { profileService } from '../../../../services/profileService';

const TABS = ['Edit', 'View Profile'];

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TabBar = ({ activeIndex, onChange }) => {
  return (
    <View style={tb.tabBar}>
      {TABS.map((label, i) => (
        <TouchableOpacity
          key={label}
          style={[tb.tabItem, activeIndex === i && tb.tabItemActive]}
          onPress={() => onChange(i)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              tb.label,
              activeIndex === i ? tb.labelActive : tb.labelInactive,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const tb = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  labelActive: { color: '#111' },
  labelInactive: { color: '#9CA3AF' },
});

// ─── View Profile tab ─────────────────────────────────────────────────────────

const ViewProfileTab = ({ profile }) => {
  // Normalise profile images so OwnProfileCard can render them
  const normalizedProfile = {
    ...profile,
    images: Array.isArray(profile?.images)
      ? profile.images.map((img) => (typeof img === 'string' ? img : img?.url ?? img))
      : [],
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
  const [profile, setProfile]     = useState({});
  const [loading, setLoading]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Edit, 1 = View
  const params = useLocalSearchParams();
  const router = useRouter();

  // ── load ────────────────────────────────────────────────────

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
      loadProfile({ force: true, showLoading: !profile?._id && !profile?.id });
    }, [loadProfile])
  );

  // Handle param-based field updates (e.g. from child screens)
  useEffect(() => {
    if (!params.updatedField || !params.updatedValue) return;
    setProfile((prev) => ({ ...prev, [params.updatedField]: params.updatedValue }));
    router.setParams({ updatedField: undefined, updatedValue: undefined });
  }, [params.updatedField, params.updatedValue, router]);

  // ── field update ─────────────────────────────────────────────

  const handleUpdateField = async (field, value) => {
    // Voice prompt uses its own multipart endpoint
    if (field === 'voicePrompt') {
      if (value === null) {
        // delete
        try {
          await profileService.deleteVoicePrompt();
          setProfile((prev) => ({ ...prev, voicePrompt: null }));
        } catch (err) {
          console.error('Failed to delete voice prompt:', err);
          Alert.alert('Error', 'Could not delete voice prompt.');
        }
      } else {
        // upload local URI
        try {
          const updated = await profileService.uploadVoicePrompt(value);
          setProfile((prev) => ({ ...prev, voicePrompt: updated.voicePrompt }));
        } catch (err) {
          console.error('Failed to upload voice prompt:', err);
          throw err; // rethrow so VoicePrompt component can handle its own state
        }
      }
      return;
    }

    // All other fields
    try {
      const updatedProfile = await profileService.updateProfile({ [field]: value });
      setProfile(updatedProfile || {});
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }
  };

  // ── photo handlers ───────────────────────────────────────────

  const handleAddPhoto = async () => {
    try {
      const existingPhotoCount = Array.isArray(profile?.images) ? profile.images.length : 0;
      if (existingPhotoCount >= 6) {
        Alert.alert('Photo Limit Reached', 'You can upload up to 6 photos only.');
        return;
      }
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (result.canceled) return;

      await profileService.uploadPhotos([result.assets[0].uri]);
      await loadProfile();
    } catch (error) {
      console.error('Failed to add photo:', error);
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

  // ── render ───────────────────────────────────────────────────

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <SafeAreaView style={[s.safe, { backgroundColor: '#fff' }]}>
        <GeneralHeader
          title="Edit Profile"
          leftIcon={<ArrowLeft />}
          style={{ backgroundColor: '#fff' }}
        />

        {/* Tab bar */}
        <TabBar activeIndex={activeTab} onChange={setActiveTab} />

        {/* ── EDIT TAB ── */}
        {activeTab === 0 && (
          <ScrollView
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {loading && (
              <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 20 }} />
            )}

            <View style={s.sections}>

              <View>
                {/* <TextHeadingOne name="Media" /> */}
                <ProfilePhotoGrid
                  photos={profile?.images || []}
                  onAddPhoto={handleAddPhoto}
                  onRemovePhoto={handleRemovePhoto}
                  title="My Photos"
                />
              </View>

              {/* ── Voice Prompt ── */}
              <View>
                <TextHeadingOne name="Voice Prompt" />
                <VoicePrompt profile={profile} onUpdateField={handleUpdateField} />
              </View>

              <View>
                <TextHeadingOne name="Verification" />
                <Verification profile={profile} />
              </View>

              <View>
                <TextHeadingOne name="Basic Info" />
                <BasicInfo profile={profile} />
              </View>

              <View>
                <TextHeadingOne name="Bio" />
                <AboutMe profile={profile} onUpdateField={handleUpdateField} />
              </View>

              <View>
                <TextHeadingOne name="Location" />
                <Location profile={profile} onUpdateField={handleUpdateField} />
              </View>

              <View>
                <TextHeadingOne name="Education Level" />
                <Education profile={profile} onUpdateField={handleUpdateField} />
              </View>

              <View>
                <TextHeadingOne name="School" />
                <School profile={profile} onUpdateField={handleUpdateField} />
              </View>

              <View>
                <TextHeadingOne name="Occupation" />
                <Occupation profile={profile} onUpdateField={handleUpdateField} />
              </View>

              <View>
                <TextHeadingOne name="Prompt" />
                <ProfileAnswers profile={profile} onUpdateField={handleUpdateField} />
              </View>


<View>
<InterestCard profile={profile} onUpdateField={handleUpdateField} />
</View>

              <View>
                <TextHeadingOne name="Languages" />
                <LanguageSelection profile={profile} onUpdateField={handleUpdateField} />
              </View>

              <View>
                <TextHeadingOne name="About Me" />
                <MyInfo profile={profile} onUpdateField={handleUpdateField} />
              </View>

              <View>
                <TextHeadingOne name="Blood Group & Genotype" />
                <View className="flex-col gap-4">
                <BloodGroup profile={profile} onUpdateField={handleUpdateField} />

                <Genotype profile={profile} onUpdateField={handleUpdateField} />
                </View>
              </View>

            </View>
          </ScrollView>
        )}

        {/* ── VIEW PROFILE TAB ── */}
        {activeTab === 1 && (
          <ViewProfileTab profile={profile} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1 },
  sections: { flex: 1, gap: 12, marginTop: 10 },
});