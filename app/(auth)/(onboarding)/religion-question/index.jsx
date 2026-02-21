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
import Button from "../../../../components/ui/Button";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";


const ReligionQuestions = () => {
  const [religionImportance, setReligionImportance] = useState("");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

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
              <Text className="text-3xl font-SatoshiBold text-app mb-2">
                Dating someone with the same beliefs...
              </Text>

              <View>
                <RadioSelect
                  value={religionImportance}
                  onChange={setReligionImportance}
                  options={[
                    { label: "Is very important", value: "very-important" },
                    { label: "Is quite important", value: "quite-important" },
                    {
                      label: "It doesn't matter to me at all",
                      value: "not-matter",
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
                onPress={async () => {
                  await updateProfileStep({ religionImportance });
                  router.push("/education");
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ReligionQuestions;
