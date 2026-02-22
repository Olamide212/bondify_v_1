import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import RadioSelect from "../../../../components/inputs/RadioSelect";
import Button from "../../../../components/ui/Button";
import Info from "../../../../components/ui/Info";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const lookingForValueMap = {
  "committed-relationship": "long-term",
  "a-committed-relationship": "long-term",
  marriage: "long-term",
  "finding-a-date": "short-term",
  "something-casual": "casual",
  "meet-business-oriented-people": "friendship",
};


const Preference = () => {
  const [preference, setPreference] = useState("");

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
              <Text className="text-3xl font-SatoshiBold  mb-2">
                What are you hoping to find on Bondies?
              </Text>
              <Text className="text-lg font-Satoshi">
                Provide us with further insights into your preferences
              </Text>

              <View>
                <RadioSelect
                  value={preference}
                  onChange={setPreference}
                  options={[
                    {
                      label: "A committed relationship",
                      value: "committed-relationship",
                    },
                    { label: "Something Casual", value: "something-casual" },
                    { label: "Marriage", value: "marriage" },
                    { label: "Finding a Date", value: "finding-a-date" },
          
                    {
                      label: "Meet business oriented people",
                      value: "meet-business-oriented-people",
                    },
                    {
                      label: "I am not sure",
                      value: "not-sure",
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
                  const normalizedPreference =
                    lookingForValueMap[preference?.toLowerCase?.()] || preference;

                  await updateProfileStep({ lookingFor: normalizedPreference });
                  router.push("/religion");
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Preference;
