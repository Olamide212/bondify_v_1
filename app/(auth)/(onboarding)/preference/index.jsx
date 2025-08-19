import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import NextButton from "../../../../components/ui/NextButton";
import { useRouter } from "expo-router";

import RadioSelect from "../../../../components/inputs/RadioSelect";
import Info from "../../../../components/ui/Info";


const Preference = () => {
  const [gender, setGender] = useState("");

  const router = useRouter();

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
              <Text className="text-3xl font-SatoshiBold  mb-2">
                What are you hoping to find on Bondify?
              </Text>
              <Text className="text-lg font-Satoshi">
                Provide us with further insights into your preferences
              </Text>

              <View>
                <RadioSelect
                  value={gender}
                  onChange={setGender}
                  options={[
                    {
                      label: "A committed relationship",
                      value: "A committed relationship",
                    },
                    { label: "Something Casual", value: "Something Casual" },
                    { label: "Long Term Fun", value: "Long Term Fun" },
                    { label: "Short Term Fun", value: "Short Term Fun" },
                    { label: "Marriage", value: "Marriage" },
                    { label: "Finding a Date", value: "Finding a Date" },
                    { label: "New Friend", value: "New Friend" },
                    {
                      label: "Meet business oriented people",
                      value: "Meet business oriented people",
                    },
                  ]}
                  className="mt-2"
                />
              </View>
              <Info title="You can change this details later from your profile" />
            </View>

            <View className="w-full items-end pb-6">
              <NextButton
                variant="gradient"
                onPress={() => router.push("/religion")}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Preference;
