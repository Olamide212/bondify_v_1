import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
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
import TextHeadingOne from "../../../../components/ui/TextHeadingOne";
import { profileService } from "../../../../services/profileService";

export default function ProfileDetails() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();
  const router = useRouter();

  const loadProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      const userProfile = await profileService.getMyProfile();
      setProfile(userProfile || {});
    } catch (error) {
      console.error("Failed to load edit profile data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();

      if (params.updatedField && params.updatedValue) {
        setProfile((prev) => ({
          ...prev,
          [params.updatedField]: params.updatedValue,
        }));

        // Clear the params after updating
        router.setParams({
          updatedField: undefined,
          updatedValue: undefined,
        });
      }
    }, [loadProfile, params, router])
  );

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
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: 40,
            backgroundColor: "#f1f1f1",
          }}
        >
          {loading && (
            <ActivityIndicator size="large" color="#5A56D0" style={{ marginTop: 20 }} />
          )}

          <ProfilePhotoGrid
            photos={profile?.images || []}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
          />

          <View>
            <TextHeadingOne name="Verification" />
            <Verification profile={profile} />
          </View>

          <View>
            <TextHeadingOne name="Basic Info" />
            <BasicInfo profile={profile} />
          </View>

          <View>
            <TextHeadingOne name="About Me" />
            <AboutMe profile={profile} />
          </View>

          <View>
            <TextHeadingOne name="Location" />
            <Location profile={profile} />
          </View>

          <View>
            <TextHeadingOne name="Education" />
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
            <TextHeadingOne name="More About Me" />
            <ProfileAnswers profile={profile} onUpdateField={handleUpdateField} />
          </View>

          <View className="">
            <TextHeadingOne name="My Info" />
            <MyInfo profile={profile} onUpdateField={handleUpdateField} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
