import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import DiscoverCard from "../../../../components/discoverScreen/DiscoverCard";



const DiscoverScreen = () => {
  const router = useRouter();

  // Define discover categories (Using the expanded data)
  const discoverCategories = [
    {
      type: "Religion dating preferences",
      description:
        "Connect with people who share your faith and spiritual values",
      data: [
        {
          id: "1",
          name: "Christian searching for Love",
          members: "12.4k members", // Adding ' members' for clarity
          icon: "Cross",
          preference: "Christian searching for Love",
          color: "#5A56D0",
          lightColor: "#EDE7F6",
        },
        {
          id: "2",
          name: "Muslim searching for Love",
          members: "8.7k members",
          icon: "Star",
          preference: "muslim searching for love",
          color: "#00695C",
          lightColor: "#E0F2F1",
        },
        {
          id: "3",
          name: "Traditionalist searching for Love",
          members: "6.2k members",
          icon: "Home",
          preference: "Traditionalist searching for love",
          color: "#B71C1C",
          lightColor: "#FFEBEE",
        },
        {
          id: "3a",
          name: "Agnostic dating",
          members: "4.1k members",
          icon: "Moon",
          preference: "Agnostic dating",
          color: "#757575",
          lightColor: "#F5F5F5",
        },
        {
          id: "3b",
          name: "Spiritual but not religious",
          members: "5.5k members",
          icon: "Star",
          preference: "Spiritual dating",
          color: "#4CAF50",
          lightColor: "#E8F5E9",
        },
      ],
    },
    {
      type: "Relationship Type",
      description:
        "Find connections based on your relationship goals and intentions",
      data: [
        {
          id: "4",
          name: "Something casual",
          members: "15.2k members",
          icon: "Clock",
          preference: "Short-term fun",
          color: "#FF5722",
          lightColor: "#FFF3E0",
        },
        {
          id: "5",
          name: "Long-term relationship",
          members: "20.1k members",
          icon: "Heart",
          preference: "Long-term relationship",
          color: "#388E3C",
          lightColor: "#E8F5E9",
        },
        {
          id: "6",
          name: "Marriage focused",
          members: "9.8k members",
          icon: "Home",
          preference: "Marriage focused",
          color: "#455A64",
          lightColor: "#ECEFF1",
        },
        {
          id: "7",
          name: "Just friends first",
          members: "11.1k members",
          icon: "Users",
          preference: "Just friends first",
          color: "#1976D2",
          lightColor: "#E3F2FD",
        },
      ],
    },
  ];

  const navigateToCategory = (category) => {
    router.push({
      pathname: "/discover-profile",
      params: {
        preference: category.preference,
        title: category.name,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <GeneralHeader title="Discover" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {discoverCategories.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle} className="font-GeneralSansSemiBold">
              {section.type}
            </Text>
            <Text style={styles.sectionDescription} className="font-Satoshi">
              {section.description}
            </Text>

            {/* --- Vertical Card Stack (Full Width) --- */}
            <View style={styles.verticalCardList}>
              {section.data.map((item) => (
                <DiscoverCard
                  key={item.id}
                  category={item}
                  onPress={() => navigateToCategory(item)}
                />
              ))}
            </View>
            {/* ------------------------------------------ */}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 3,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 20,
  },

 
});

export default DiscoverScreen;
