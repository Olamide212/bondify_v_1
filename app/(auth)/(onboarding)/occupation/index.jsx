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
    ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import Button from "../../../../components/ui/Button";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";

const Occupation = () => {
  const router = useRouter();
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });
  const { options: occupationOptions, loading } = useLookupOptions("occupations");

  const handleSelect = (itemValue) => {
    setSelectedOccupation(itemValue);
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#E8651A" style={{ flex: 1, justifyContent: "center", alignItems: "center" }} />
    );
  }

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
              <Text className="text-3xl font-PlusJakartaSansBold  mb-4">
                What&apos;s your occupation?
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
                    key={item.value}
                    onPress={() => handleSelect(item.value)}
                    className={`px-4 py-2 rounded-full  border ${
                      selectedOccupation === item.value
                        ? "bg-primary border-primary"
                        : "bg-white border-[#D1D1D1]"
                    }`}
                  >
                    <Text
                      className={`${
                        selectedOccupation === item.value
                          ? "text-white"
                          : "text-black"
                      } font-PlusJakartaSansMedium text-lg`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  await updateProfileStep({ occupation: selectedOccupation });
                  router.push("/smoke");
                }}
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
