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
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import GeneralHeader from '../../../../components/headers/GeneralHeader';
import AboutMe from '../../../../components/profileScreen/About';
import BasicInfo from '../../../../components/profileScreen/BasicInfo';
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
import InterestCard from '../../../../components/profileScreen/InterestCard';
import LifestyleCard from '../../../../components/profileScreen/Lifestyle';
import LanguageSelection from '../../../../components/profileScreen/LanguageSelection';

const { width: SW } = Dimensions.get('window');
const TABS = ['Edit', 'View Profile'];

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TabBar = ({ activeIndex, onChange, colors }) => {
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabW = (SW - 32) / 2;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: activeIndex * tabW,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [activeIndex]);

  return (
    <View style={[tb.wrap, { backgroundColor: colors.surface,  }]}>
      {/* sliding pill */}
      <Animated.View
        style={[tb.pill, { width: tabW - 6, transform: [{ translateX: indicatorX }] }]}
      />
      {TABS.map((label, i) => (
        <TouchableOpacity
          key={label}
          style={[tb.tab, { width: tabW }]}
          onPress={() => onChange(i)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              tb.label,
              { color: activeIndex === i ? '#fff' : colors.textSecondary },
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
  wrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 15,
  
    padding: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: 3,
    left: 3,
    bottom: 3,
    borderRadius: 99,
    backgroundColor: '#E8651A',
    zIndex: 0,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 10,
    zIndex: 1,
  },
  label: { fontFamily: 'PlusJakartaSansBold', fontSize: 14 },
});

// ─── View Profile tab ─────────────────────────────────────────────────────────

const ViewProfileTab = ({ profile, colors }) => {
  const photo = profile?.profilePhoto ?? profile?.images?.[0]?.url ?? profile?.images?.[0] ?? null;

  const infoRows = [
    profile?.age && `🎂 ${profile.age} years old`,
    profile?.city && `📍 ${profile.city}`,
    profile?.religion && `🙏 ${profile.religion}`,
    profile?.lookingFor && `💛 ${profile.lookingFor}`,
    profile?.occupation && `💼 ${profile.occupation}`,
    profile?.education && `🎓 ${profile.education}`,
    profile?.height && `📏 ${profile.height} cm`,
    profile?.drinking && `🍷 ${profile.drinking}`,
    profile?.smoking && `🚬 ${profile.smoking}`,
    profile?.children && `👶 ${profile.children}`,
  ].filter(Boolean);

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16, gap: 16, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero photo */}
      <View style={vp.heroWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={vp.hero} resizeMode="cover" />
        ) : (
          <View style={[vp.hero, vp.heroFallback, { backgroundColor: colors.surface }]}>
            <Text style={vp.heroInitial}>{profile?.firstName?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        {/* Name overlay */}
        <View style={vp.nameOverlay}>
          <Text style={vp.heroName}>
            {profile?.firstName ?? ''}{profile?.lastName ? ` ${profile.lastName}` : ''}
            {profile?.age ? `, ${profile.age}` : ''}
          </Text>
          {profile?.isVerified && (
            <View style={vp.verifiedBadge}>
              <Text style={vp.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bio */}
      {!!profile?.bio && (
        <View style={[vp.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[vp.sectionLabel, { color: colors.textSecondary }]}>About me</Text>
          <Text style={[vp.bioText, { color: colors.textPrimary }]}>{profile.bio}</Text>
        </View>
      )}

      {/* Info grid */}
      {infoRows.length > 0 && (
        <View style={[vp.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[vp.sectionLabel, { color: colors.textSecondary }]}>Quick info</Text>
          <View style={vp.infoGrid}>
            {infoRows.map((row, i) => (
              <View key={i} style={[vp.infoChip, { backgroundColor: colors.background }]}>
                <Text style={[vp.infoChipText, { color: colors.textPrimary }]}>{row}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Photos */}
      {Array.isArray(profile?.images) && profile.images.length > 1 && (
        <View style={[vp.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[vp.sectionLabel, { color: colors.textSecondary }]}>Photos</Text>
          <View style={vp.photoGrid}>
            {profile.images.slice(1).map((img, i) => {
              const uri = img?.url ?? img;
              return (
                <Image key={i} source={{ uri }} style={vp.gridPhoto} resizeMode="cover" />
              );
            })}
          </View>
        </View>
      )}

      {/* Prompts */}
      {Array.isArray(profile?.answers) && profile.answers.length > 0 && (
        <View style={[vp.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[vp.sectionLabel, { color: colors.textSecondary }]}>Prompts</Text>
          {profile.answers.map((a, i) => (
            <View key={i} style={[vp.promptItem, { borderColor: colors.border }]}>
              <Text style={[vp.promptQ, { color: colors.textSecondary }]}>{a.question}</Text>
              <Text style={[vp.promptA, { color: colors.textPrimary }]}>{a.answer}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Voice prompt hint */}
      {!!profile?.voicePrompt && (
        <View style={[vp.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[vp.sectionLabel, { color: colors.textSecondary }]}>Voice Prompt</Text>
          <Text style={[vp.bioText, { color: colors.textPrimary }]}>
            🎙 You have a voice prompt set. Others can play it on your public profile.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const vp = StyleSheet.create({
  heroWrap: { borderRadius: 24, overflow: 'hidden', height: 380, position: 'relative' },
  hero:     { width: '100%', height: '100%' },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  heroInitial: { fontSize: 80, fontFamily: 'PlusJakartaSansBold', color: '#E8651A' },
  nameOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.38)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  heroName:   { color: '#fff', fontSize: 24, fontFamily: 'PlusJakartaSansBold', flex: 1 },
  verifiedBadge: {
    backgroundColor: '#22C55E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
  },
  verifiedText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 11 },

  card: { borderRadius: 20, padding: 16, borderWidth: 1, gap: 12 },
  sectionLabel: { fontSize: 11, fontFamily: 'PlusJakartaSansBold', textTransform: 'uppercase', letterSpacing: 0.6 },

  bioText: { fontSize: 14, fontFamily: 'PlusJakartaSans', lineHeight: 22 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99 },
  infoChipText: { fontFamily: 'PlusJakartaSansMedium', fontSize: 13 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridPhoto: { width: (SW - 32 - 16 * 2 - 8) / 2, height: 160, borderRadius: 14 },

  promptItem: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 4 },
  promptQ: { fontSize: 12, fontFamily: 'PlusJakartaSansMedium' },
  promptA: { fontSize: 14, fontFamily: 'PlusJakartaSans', lineHeight: 20 },
});

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
      loadProfile({ force: false, showLoading: !profile?._id && !profile?.id });
    }, [loadProfile, profile?._id, profile?.id])
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
        <TabBar activeIndex={activeTab} onChange={setActiveTab} colors={colors} />

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

            </View>
          </ScrollView>
        )}

        {/* ── VIEW PROFILE TAB ── */}
        {activeTab === 1 && (
          <ViewProfileTab profile={profile} colors={colors} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1 },
  sections: { flex: 1, gap: 12, marginTop: 10 },
});