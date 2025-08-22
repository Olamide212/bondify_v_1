import { View, Text, StyleSheet } from "react-native";
import React, { useState } from "react";
import HomeHeader from "../../../../components/headers/HomeHeader";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ActionButtons from "../../../../components/homeScreen/ActionButtons";
import { profiles } from "../../../../data/profileData";
import AroundYouTab from "../../../../components/homeScreen/AroundYouTab";


const Home = () => {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [matches, setMatches] = useState(12);
  const [likes, setLikes] = useState(48);
  const [flashMessage, setFlashMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("Around you");

  const currentProfile = profiles[currentProfileIndex];

  const showFlashMessage = (type) => {
    const message = type === "right" ? "Liked ❤️" : "Passed 👎";
    setFlashMessage(message);
    setTimeout(() => {
      setFlashMessage(null);
    }, 300);
  };

  const handleSwipe = (direction) => {
    if (direction === "right") setMatches((prev) => prev + 1);
    showFlashMessage(direction);
    setTimeout(() => {
      setCurrentProfileIndex((prev) => (prev + 1) % profiles.length);
    }, 300);
  };

  const handleSuperLike = () => {
    setMatches((prev) => prev + 1);
    showFlashMessage("right");
    setTimeout(() => {
      setCurrentProfileIndex((prev) => (prev + 1) % profiles.length);
    }, 500);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 z-40 px-4 bg-white">
        <View style={{ flex: 1 }}>
          <HomeHeader title="Home" />

            <AroundYouTab
              profile={currentProfile}
              actionMessage={flashMessage}
            />

          {/* Action Buttons (only for Around You tab) */}

            <View style={styles.actionButtonWrapper}>
              <ActionButtons
                onSwipe={handleSwipe}
                onSuperLike={handleSuperLike}
              />
            </View>
    
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  actionButtonWrapper: {
    position: "absolute",
    bottom: -9,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: "center",
    zIndex: 10,
  },
});

export default Home;
