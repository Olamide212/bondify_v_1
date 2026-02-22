import { useFocusEffect, useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import Perks from "../../../../components/profileScreen/BoostAndChat";
import InfoSection from "../../../../components/profileScreen/InfoSection";
import ProfileSection from "../../../../components/profileScreen/ProfileSection";
import SubscriptionBannerSlider from "../../../../components/profileScreen/SubscriptionBannerSlider";
import { profileService } from "../../../../services/profileService";


const ProfileScreen = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userProfile = await profileService.getMyProfile();
      setProfile(userProfile || null);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );


  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-[#fff] ">
        <GeneralHeader
          title="Profile"
          icon=<Bell color="#000" />
          className="text-black"
          onPress={() => router.push("/settings")}
        />
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 80,
            backgroundColor: "#fff",
          }}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#5A56D0" style={{ marginTop: 24 }} />
          ) : (
            <ProfileSection profile={profile || {}} />
          )}

          <InfoSection />
          <Perks />
          <SubscriptionBannerSlider />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default ProfileScreen