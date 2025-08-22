import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  ChevronRight,
  Flag,
  Globe,
  Ruler,
  Baby,
  Wine,
  Cigarette,
  PawPrint,
  Dumbbell,
  Sparkles,
  Heart,
  HeartHandshake,
  Users,
  BookOpen,
} from "lucide-react-native";
import { useRouter } from "expo-router";

const MyInfo = ({ profile }) => {
  const router = useRouter();

const items = [
  {
    key: "nationality",
    title: "Nationality",
    icon: Flag,
    screen: "nationality",
  },
  {
    key: "ethnicity",
    title: "Ethnicity",
    icon: Globe,
    screen: "EthnicityScreen",
  },
  { key: "height", title: "Height", icon: Ruler, screen: "HeightScreen" },
  { key: "kids", title: "Kids", icon: Baby, screen: "KidsScreen" },
  { key: "drink", title: "Do you drink?", icon: Wine, screen: "DrinkScreen" },
  {
    key: "smoke",
    title: "Do you smoke?",
    icon: Cigarette,
    screen: "SmokeScreen",
  },
  {
    key: "pets",
    title: "Do you like pets?",
    icon: PawPrint,
    screen: "PetsScreen",
  },
  {
    key: "workout",
    title: "Do you workout?",
    icon: Dumbbell,
    screen: "WorkoutScreen",
  },
  {
    key: "interests",
    title: "Interests",
    icon: Sparkles,
    screen: "InterestsScreen",
  },
  {
    key: "religion",
    title: "Religion",
    icon: BookOpen,
    screen: "ReligionScreen",
  },
  {
    key: "relationshipStatus",
    title: "Relationship Status",
    icon: Heart,
    screen: "RelationshipStatusScreen",
  },
  {
    key: "interestedIn",
    title: "I'm interested in...",
    icon: Users,
    screen: "InterestedInScreen",
  },
  {
    key: "sameBeliefs",
    title: "Dating someone with the same beliefs...",
    icon: HeartHandshake,
    screen: "SameBeliefsScreen",
  },
];

  return (
    <View className="bg-white mt-3 mx-4 p-5 rounded-2xl">
      <Text className="mb-2 font-SatoshiMedium text-lg text-gray-500">
        My Info
      </Text>
      {items.map(({ key, title, icon: Icon, screen }, index) => {
        const isLast = index === items.length - 1;
        const value = profile?.[key];

        return (
          <TouchableOpacity
            key={index}
            className={`flex-row items-center justify-between py-4 ${
              !isLast ? "border-b border-gray-200" : ""
            }`}
            onPress={() =>
              router.push({
                pathname: screen,
                params: {
                  fieldKey: key,
                  currentValue: value,
                },
              })
            }
          >
            <View className="flex-row items-center gap-3 flex-1">
              <Icon size={22} color="#333" />
              <View className="flex-1">
                <Text className="text-lg text-gray-900 font-GeneralSansMedium">
                  {title}
                </Text>

                {!value && (
                  <Text className="text-base text-red-500">Tap to Answer</Text>
                )}

                {value && (
                  <Text className="text-base text-gray-700">{value}</Text>
                )}
              </View>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default MyInfo;
