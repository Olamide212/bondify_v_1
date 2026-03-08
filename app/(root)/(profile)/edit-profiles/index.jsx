import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import AboutMe from "../../../../components/profileScreen/About";
import BasicInfo from "../../../../components/profileScreen/BasicInfo";
import Location from "../../../../components/profileScreen/Location";
import MyInfo from "../../../../components/profileScreen/MyInfo";
import Occupation from "../../../../components/profileScreen/Occupation";
import ProfileAnswers from "../../../../components/profileScreen/ProfileAnswers";
import ProfilePhotoGrid from "../../../../components/profileScreen/ProfilePhotoGrid";
import School from "../../../../components/profileScreen/School";
import Verification from "../../../../components/profileScreen/Verification";
import Education from "../../../../components/profileScreen/WorkAndEducation";
import { profileService } from "../../../../services/profileService";
import { colors } from "../../../../constant/colors";
import TextHeadingOne from "../../../../components/ui/TextHeadingOne";

export default function ProfileDetails() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams();
  const router = useRouter();

  const loadProfile = React.useCallback(async ({ force = false, showLoading = true } = {}) => {
    try {
      if (showLoading) setLoading(true);
      const userProfile = await profileService.getMyProfile({ force });
      setProfile(userProfile || {});
    } catch (error) {
      console.error("Failed to load edit profile data:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await loadProfile({ force: true, showLoading: false });
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile({ force: false, showLoading: !profile?._id && !profile?.id });
    }, [loadProfile, profile?._id, profile?.id])
  );

  React.useEffect(() => {
    if (!params.updatedField || !params.updatedValue) return;

    setProfile((prev) => ({
      ...prev,
      [params.updatedField]: params.updatedValue,
    }));

    router.setParams({
      updatedField: undefined,
      updatedValue: undefined,
    });
  }, [params.updatedField, params.updatedValue, router]);

  const handleUpdateField = async (field, value) => {
    try {
      const updatedProfile = await profileService.updateProfile({ [field]: value });
      setProfile(updatedProfile || {});
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    }
  };

  const handleAddPhoto = async () => {
    try {
      const existingPhotoCount = Array.isArray(profile?.images)
        ? profile.images.length
        : 0;

      if (existingPhotoCount >= 6) {
        Alert.alert("Photo Limit Reached", "You can upload up to 6 photos only.");
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result.canceled) return;

      await profileService.uploadPhotos([result.assets[0].uri]);
      await loadProfile();
    } catch (error) {
      console.error("Failed to add photo:", error);
    }
  };

  const handleRemovePhoto = async (imageItem) => {
    try {
      const publicId = imageItem?.publicId;
      if (!publicId) return;
      await profileService.deletePhoto(publicId);
      await loadProfile();
    } catch (error) {
      console.error("Failed to remove photo:", error);
    }
  };

  return (
    <SafeAreaProvider className='bg-white'>
      <SafeAreaView className="flex-1 pb-0 bg-white ">
        <GeneralHeader
          title="Edit Profile"
          leftIcon={<ArrowLeft />}
          className="bg-white"
        />
        <ScrollView
          className="flex-1 flex-col gap-6 bg-background"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingBottom: 30,
     
          }}
        >
          {loading && (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          )}
          <View className="flex-1 gap-3">

<View>
              <TextHeadingOne name="Media"  />
             
          <ProfilePhotoGrid
            photos={profile?.images || []}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
            title="My Photos"
          />
</View>
          <View>
            <TextHeadingOne name="Verification" />
            <Verification profile={profile}  />
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
                <TextHeadingOne name="Education Level"  />
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

          <View className="">
                <TextHeadingOne name="About Me" />
            <MyInfo profile={profile} onUpdateField={handleUpdateField} />
          </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
