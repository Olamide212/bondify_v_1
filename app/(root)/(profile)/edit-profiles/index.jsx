import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
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

export default function ProfileDetails() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams();
  const router = useRouter();

  const loadProfile = React.useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) setLoading(true);
      const userProfile = await profileService.getMyProfile({ force: true });
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
      await loadProfile({ showLoading: false });
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [loadProfile])
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
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 pb-0 bg-white">
        <GeneralHeader
          title="Edit Profile"
          leftIcon={<ArrowLeft />}
          className="bg-white"
        />
        <ScrollView
          className="flex-1 flex-col gap-6"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingBottom: 40,
            backgroundColor: "#fff",
          }}
        >
          {loading && (
            <ActivityIndicator size="large" color="#5A56D0" style={{ marginTop: 20 }} />
          )}
          <View className="flex-1 gap-3">

          <ProfilePhotoGrid
            photos={profile?.images || []}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
            title="My Photos"
          />

          <View>
            <Verification profile={profile}  />
          </View>

          <View>
            <BasicInfo profile={profile} />
          </View>

          <View>
        
            <AboutMe profile={profile} onUpdateField={handleUpdateField} />
          </View>

          <View>
            <Location profile={profile} />
          </View>

          <View>
            <Education profile={profile} onUpdateField={handleUpdateField} />
          </View>

          <View>
            <School profile={profile} onUpdateField={handleUpdateField} />
          </View>

          <View>
            <Occupation profile={profile} onUpdateField={handleUpdateField} />
          </View>

          <View>

            <ProfileAnswers profile={profile} onUpdateField={handleUpdateField} />
          </View>

          <View className="">
            <MyInfo profile={profile} onUpdateField={handleUpdateField} />
          </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
