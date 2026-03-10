import { useFocusEffect, useRouter } from "expo-router";
import { Bell, Settings } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import Perks from "../../../../components/profileScreen/BoostAndChat";
import InfoSection from "../../../../components/profileScreen/InfoSection";
import ProfileSection from "../../../../components/profileScreen/ProfileSection";
import SubscriptionBannerSlider from "../../../../components/profileScreen/SubscriptionBannerSlider";
import { profileService } from "../../../../services/profileService";
import { colors } from "../../../../constant/colors";



const ProfileScreen = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lastFetchRef = useRef(0);


  const loadProfile = useCallback(async ({ force = false, showLoading = true } = {}) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 2000) return;

    try {
      lastFetchRef.current = now;
      if (showLoading) setLoading(true);
      const userProfile = await profileService.getMyProfile({ force });
      setProfile(userProfile || null);
    } catch (error) {
      console.error("Failed to load profile:", error);
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
      loadProfile({ force: false, showLoading: !profile });
    }, [loadProfile, profile])
  );



  return (
    <SafeAreaProvider>
     
      <SafeAreaView className="flex-1 bg-white ">
            <GeneralHeader
          title="Profile"
          icon={<Settings size={25} color={colors.textPrimary}
           />}
           onPress={() => router.push("/settings")}
        />
     
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingBottom: 80,
            // backgroundColor: colors.background,
          }}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <>
              <ProfileSection profile={profile || {}} />
          
            </>
          )}

          <InfoSection />
          {/* <Perks /> */}
          <SubscriptionBannerSlider />
        </ScrollView>
    
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default ProfileScreen