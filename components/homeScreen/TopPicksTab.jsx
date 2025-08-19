import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";

const TopPicksTab = ({ profile }) => {
  const [topPicks, setTopPicks] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Generate top picks data (10 curated profiles)
    const picks = Array(10)
      .fill()
      .map((_, i) => ({
        ...profile,
        id: `top-${i + 1}`,
        name: [
          "Alex",
          "Taylor",
          "Jordan",
          "Casey",
          "Riley",
          "Morgan",
          "Jamie",
          "Quinn",
          "Dylan",
          "Skyler",
        ][i],
        age: 24 + i,
        verified: i % 3 === 0, // Every 3rd is verified
        images: [profile.images[0]], // Use first image only
      }));
    setTopPicks(picks);
  }, [profile]);

  const handleNavigateToProfile = (id) => {
    router.push(`/user-profile/${id}`);
  };

  const renderTopPick = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handleNavigateToProfile(item.id)}
    >
      <Image source={{ uri: item.images[0] }} style={styles.gridImage} />
      <View className='flex-1 flex-row gap-1  px-3 items-center absolute bg-white/70 left-0 right-0  bottom-2 py-2 mx-2 rounded-full'>
        <Text className='text-lg font-SatoshiBold '>{item.name}</Text>
        {item.verified && (
          <View style={styles.gridVerified}>
            <Star size={12} color="white" fill="white" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView>
      <View style={styles.container}>
      
        <FlatList
          data={topPicks}
          renderItem={renderTopPick}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  topPicksTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
    color: "#333",
    fontFamily: "SatoshiBold",
  },
  gridContent: {
    paddingBottom: 20,
  },
  gridItem: {
    flex: 1,
    margin: 4,
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 0.8,
    backgroundColor: "#f8f8f8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    position: "relative"
  },
  gridInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "white",
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    marginRight: 10,
    marginLeft: 10,


  },
  gridName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 4,
  },
  gridVerified: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    padding: 2,
  },
});

export default TopPicksTab;
