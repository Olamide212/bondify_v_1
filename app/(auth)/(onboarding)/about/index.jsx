import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Button from "../../../../components/ui/Button";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const PREDEFINED_BIOS = [
  "Looking for something real and meaningful 💛",
  "Adventure lover seeking a partner in crime 🌍",
  "Coffee addict & dog lover. Let's chat! ☕🐶",
  "Hopeless romantic with a great sense of humor 😄",
  "Living life one adventure at a time ✈️",
  "Foodie who loves trying new restaurants 🍕",
  "Gym enthusiast & Netflix binger 💪📺",
  "Music lover looking for my duet partner 🎵",
  "Simple soul with big dreams ✨",
  "Work hard, love harder ❤️",
  "Just here to meet genuine people 🤝",
  "Swipe right if you love spontaneous road trips 🚗",
];

const About = () => {
  const [aboutText, setAboutText] = useState("");
  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  const handleSelectPredefined = (text) => {
    setAboutText(text);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-3">
            <ScrollView className="flex-1 mt-8" showsVerticalScrollIndicator={false}>
              <Text className="text-3xl font-SatoshiBold  mb-4">
                Tell us a little about yourself
              </Text>

              <TextInput
                placeholder="Write your cool intro here..."
                placeholderTextColor="#999"
                value={aboutText}
                onChangeText={setAboutText}
                multiline
                numberOfLines={10}
                style={{
                  backgroundColor: "#f1f1f1",
                  color: "#000",
                  height: 100,
                  padding: 16,
                  borderRadius: 12,
                  textAlignVertical: "top",
                  fontSize: 16,
                }}
              />

              <Text className="text-lg font-SatoshiMedium mt-6 mb-3 text-gray-600">
                Or pick one of these:
              </Text>

              <View className="flex-row flex-wrap gap-2 mb-4">
                {PREDEFINED_BIOS.map((bio, index) => {
                  const isSelected = aboutText === bio;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSelectPredefined(bio)}
                      className={`px-4 py-3 rounded-full border ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-gray-100 border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-sm font-SatoshiMedium ${
                          isSelected ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {bio}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  await updateProfileStep({ bio: aboutText });
                  router.push("/interests");
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default About;
