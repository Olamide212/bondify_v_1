import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import NextButton from "../../../../components/ui/NextButton";
import { useRouter } from "expo-router";

// Example occupation list
const occupationOptions = [
  "Software Developer",
  "Graphic Designer",
  "Teacher",
  "Doctor",
  "Engineer",
  "Lawyer",
  "Nurse",
  "Writer",
  "Entrepreneur",
  "Photographer",
  "Musician",
  "Student",
  "Fashion designer",
  "Model",
  "Makeup Artist",
  "Hair Stylist",
  "Content creator",
  "Streamer",
  "Engineers",
  "Architech",
  "Scientist",
  "Artist",
  "Chef",
  "Dancer",
  "Actor",
  "Music producer",
  "DJ",
  "Event planner",
  "Interior designer",
  "Others",
];

const Occupation = () => {
  const router = useRouter();
  const [selectedOccupation, setSelectedOccupation] = useState(null);

  const handleSelect = (item) => {
    setSelectedOccupation(item);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-2">
            <View className="flex-1 mt-8">
              <Text className="text-3xl font-SatoshiBold  mb-4">
                What's your occupation?
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  flexWrap: "wrap",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                {occupationOptions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleSelect(item)}
                    className={`px-4 py-2 rounded-full  border ${
                      selectedOccupation === item
                        ? "bg-[#FF0066] border-[#FF0066]"
                        : "bg-white border-[#D1D1D1]"
                    }`}
                  >
                    <Text
                      className={`${
                        selectedOccupation === item
                          ? "text-white"
                          : "text-gray-800"
                      } font-SatoshiMedium`}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="w-full items-end pb-6">
              <NextButton
                variant="gradient"
                onPress={() => router.push("/smoke")}
                disabled={!selectedOccupation}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Occupation;
