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

const childrenValueMap = {
  "i want": "want-kids",
  i_want: "want-kids",
  "i want children": "want-kids",
  "i dont": "dont-want-kids",
  i_dont: "dont-want-kids",
  "i don't want children": "dont-want-kids",
  "i have": "open-to-kids",
  i_have: "open-to-kids",
  "i have children and want more": "open-to-kids",
  dont_want: "have-kids",
  "i have children and don't want more": "have-kids",
};


const Kids = () => {
  const [children, setChildren] = useState("");

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
                Do you want kids?
              </Text>
              <Text className="text-lg font-Satoshi">
                Please select an option.
              </Text>

              <View>
                <RadioSelect
                  value={children}
                  onChange={setChildren}
                  options={[
                    { label: "I want children", value: "want-kids" },
                    { label: "I don't want children", value: "dont-want-kids" },
                    { label: "I have children and want more", value: "open-to-kids" },
                    {
                      label: "I have children and don't want more",
                      value: "have-kids",
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
