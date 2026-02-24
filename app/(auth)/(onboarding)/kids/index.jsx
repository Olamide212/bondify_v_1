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
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const childrenValueMap = {
  "i want": "I want kids",
  i_want: "I want kids",
  "i want children": "I want kids",
  "want-kids": "I want kids",
  "i dont": "I don't want kids",
  i_dont: "I don't want kids",
  "i don't want children": "I don't want kids",
  "dont-want-kids": "I don't want kids",
  "i have": "I have kids",
  i_have: "I have kids",
  "i have children and want more": "I am open to kids",
  "open-to-kids": "I am open to kids",
  dont_want: "I have kids",
  "i have children and don't want more": "I have kids",
  "have-kids": "I have kids",
  "prefer-not-to-say": "I prefer not to say",
};


const Kids = () => {
  const [children, setChildren] = useState("");
  const { options: familyPlanOptions } = useLookupOptions("family-plans");

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
              <Text className="text-3xl font-PlusJakartaSansBold  mb-2">
                Do you want kids?
              </Text>
              <Text className="text-lg font-PlusJakartaSans">
                Please select an option.
              </Text>

              <View>
                <RadioSelect
                  value={children}
                  onChange={setChildren}
                  options={familyPlanOptions}
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
                  const normalizedChildren =
                    childrenValueMap[children?.toLowerCase?.()] || children;

                  await updateProfileStep({ children: normalizedChildren });
                  router.push("/preference");
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Kids;
