import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useProfile } from "../../../../context/ProfileContext";
import ProfileCard from "../../../../components/ui/UsersProfileCard";
import FindingProfilesAnimation from "../../../../components/ui/LogoLoader";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import { colors } from "../../../../constant/colors";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const DiscoverProfilesScreen = () => {
  const router = useRouter();
  const { preference, title } = useLocalSearchParams();
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { discoverProfiles } = useProfile();

  // Filter profiles based on the preference
  useEffect(() => {
    if (preference && discoverProfiles) {
      setIsLoading(true);

      // Simulate loading delay
      setTimeout(() => {
        const filtered = discoverProfiles.filter(
          (profile) =>
            profile.lookingFor.toLowerCase() ===
            String(preference).toLowerCase()
        );
        setFilteredProfiles(filtered);
        setIsLoading(false);
      }, 2000);
    }
  }, [preference, discoverProfiles]);

  const navigateToProfile = (profileId) => {
    router.push({
      pathname: "/profiles/[id]",
      params: {
        id: profileId,
        fromDiscover: true,
        categoryTitle: title,
        categoryPreference: preference,
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <GeneralHeader
        title={title}
        leftIcon={<ArrowLeft size={24} color="#000" />}
        onLeftPress={handleBack}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <FindingProfilesAnimation size={80} color={colors.primary} />
        </View>
      ) : filteredProfiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text className="text-3xl font-SatoshiBold">No Profile </Text>
          <Text style={styles.emptyText}>
            No profiles found for this category.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProfiles}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <ProfileCard
              profile={item}
              height={270}
              onPress={() => navigateToProfile(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: "#FF5864",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  grid: {
    paddingLeft: 4,
  },
});

export default DiscoverProfilesScreen;
