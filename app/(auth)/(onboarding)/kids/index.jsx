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
import Button from "../../../../components/ui/Button"


const Kids = () => {
  const [maritalStatus, setMaritalStatus] = useState("");

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
                Do you want kids?
              </Text>
              <Text className="text-lg font-Satoshi">
                Please select an option.
              </Text>

              <View>
                <RadioSelect
                  value={maritalStatus}
                  onChange={setMaritalStatus}
                  options={[
                    { label: "I want children", value: "i want" },
                    { label: "I don't want children", value: "i don't" },
                    { label: "I have children and want more", value: "i have" },
                    {
                      label: "I have children and don't want more",
                      value: "don't want",
                    },
                  ]}
                  className="mt-2"
                />
              </View>
              <Info title="You can change this details later from your profile" />
            </View>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={() => router.push("/preference")}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Kids;
