import { View, Text, StyleSheet } from "react-native";
import React, { useState } from "react";
import HomeHeader from "../../../../components/headers/HomeHeader";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ActionButtons from "../../../../components/homeScreen/ActionButtons";
import { profiles } from "../../../../data/profileData";
import AroundYouTab from "../../../../components/homeScreen/AroundYouTab";
import TopPicksTab from "../../../../components/homeScreen/TopPicksTab";
import MatchmakingTab from "../../../../components/homeScreen/MatchmakingTab";
import HomeScreenTabs from "../../../../components/homeScreen/HomeScreenTabs";
import GeneralHeader from "../../../../components/headers/GeneralHeader";

const Discover = () => {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [matches, setMatches] = useState(12);
  const [likes, setLikes] = useState(48);
  const [flashMessage, setFlashMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("Around you");

  const currentProfile = profiles[currentProfileIndex];


  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 z-40  bg-white relative">
        <View style={{ flex: 1 }}>
          <GeneralHeader title="Discover" />

          {/* Tab Navigation */}
          <View>
            <HomeScreenTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </View>
          <View className='mt-3'>
            {activeTab === "Top picks" && (
              <TopPicksTab profile={currentProfile} />
            )}

            {activeTab === "Matchmaker" && <MatchmakingTab />}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  actionButtonWrapper: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
});

export default Discover;
