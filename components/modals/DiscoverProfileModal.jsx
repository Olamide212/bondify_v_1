import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UsersProfileCard from "../../components/ui/UsersProfileCard";
import { useProfile } from "../../context/ProfileContext";
import FindingProfilesAnimation from "../ui/LogoLoader";
import BaseModal from "./BaseModal";

const { width } = Dimensions.get("window");

const DiscoverProfileModal = ({ visible, onClose, preference, title }) => {
  const router = useRouter();
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { discoverProfiles, profilesLoading } = useProfile();

  // Filter profiles based on the preference
  useEffect(() => {
    setIsLoading(profilesLoading);

    if (!preference || !Array.isArray(discoverProfiles)) {
      setFilteredProfiles([]);
      return;
    }

    const filtered = discoverProfiles.filter(
      (profile) =>
        String(profile?.lookingFor || "").toLowerCase() ===
        String(preference).toLowerCase()
    );
    setFilteredProfiles(filtered);
  }, [preference, discoverProfiles, profilesLoading]);


  

  const navigateToProfile = (profileId) => {
    onClose(); // Close the modal first

    // Then navigate to the profile screen with the correct profile ID
    router.push({
      pathname: "/profiles/[id]",
      params: {
        id: profileId,
        fromDiscover: true, // Add this flag to indicate we came from discover
        categoryTitle: title,
        categoryPreference: preference,
      },
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <BaseModal visible={visible} onClose={handleClose} fullScreen={true}>
      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.spacer} />
        </View>

        {isLoading && <FindingProfilesAnimation size={80} color="#FF5864" />}

        {!isLoading && filteredProfiles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No profiles found for this category.
            </Text>
          </View>
        ) : (
          !isLoading && (
            <FlatList
              data={filteredProfiles}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <UsersProfileCard
                  profile={item}
                  height={220}
                  onPress={() => navigateToProfile(item.id)} // Pass the correct profile ID
                />
              )}
            />
          )
        )}
      </SafeAreaView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 1001,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  spacer: {
    width: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: "center",
  },
  grid: {
    padding: 12,
  },
});

export default DiscoverProfileModal;
