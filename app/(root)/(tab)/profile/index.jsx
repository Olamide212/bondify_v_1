import { useFocusEffect, useRouter } from "expo-router";
import { Settings } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
// ...existing code...
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import InfoSection from "../../../../components/profileScreen/InfoSection";
import ProfileSection from "../../../../components/profileScreen/ProfileSection";
import SocialProfileTab from "../../../../components/profileScreen/SocialProfileTab";
import SubscriptionBannerSlider from "../../../../components/profileScreen/SubscriptionBannerSlider";
import { colors } from "../../../../constant/colors";
import { profileService } from "../../../../services/profileService";

const PROFILE_TABS = ["Dating Profile", "Social Profile"];

const ProfileScreen = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const lastFetchRef = useRef(0);

  // Set tab from query param if present
  useEffect(() => {
    if (router?.params?.tab === 'social') {
      setActiveTab(1);
    }
  }, [router?.params?.tab]);


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

        {/* ── Tab Switcher ─────────────────────────────────────────────── */}
        <View style={tabStyles.tabBar}>
          {PROFILE_TABS.map((label, i) => (
            <TouchableOpacity
              key={label}
              style={[
                tabStyles.tab,
                activeTab === i && tabStyles.tabActive,
              ]}
              onPress={() => setActiveTab(i)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  tabStyles.tabLabel,
                  activeTab === i ? tabStyles.tabLabelActive : tabStyles.tabLabelInactive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
     
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingBottom: 80,
          }}
        >
          {activeTab === 0 ? (
            /* ── Dating Profile ──────────────────────────────────────────── */
            <>
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
              ) : (
                <ProfileSection profile={profile || {}} />
              )}
              <InfoSection />
              <SubscriptionBannerSlider />
            </>
          ) : (
            /* ── Social Profile ──────────────────────────────────────────── */
            <SocialProfileTab />
          )}
        </ScrollView>
    
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default ProfileScreen

const tabStyles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#111",
  },
  tabLabel: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
  },
  tabLabelActive: {
    color: "#111",
  },
  tabLabelInactive: {
    color: "#9CA3AF",
  },
});