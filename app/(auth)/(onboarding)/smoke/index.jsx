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

const smokingValueMap = {
  no: "never",
  occasionally: "rarely",
  occassionally: "rarely",
  often: "regularly",
  "a-lot": "regularly",
};


const Smoke = () => {
  const [smoking, setSmoking] = useState("");

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
              <Text className="text-3xl font-SatoshiBold mb-2">
          Do you Smoke?
              </Text>

              <View>
                <RadioSelect
                  value={smoking}
                  onChange={setSmoking}
                  options={[
                    { label: "No, i don't smoke", value: "never" },
                    { label: "Socially", value: "socially" },
                    { label: "Occasionally", value: "rarely" },
                    { label: "Regularly", value: "regularly" },
                    { label: "Prefer not to say", value: "prefer-not-to-say" },
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
                  const normalizedSmoking =
                    smokingValueMap[smoking?.toLowerCase?.()] || smoking;

                  await updateProfileStep({ smoking: normalizedSmoking });
                  router.push("/drink");
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Smoke;
