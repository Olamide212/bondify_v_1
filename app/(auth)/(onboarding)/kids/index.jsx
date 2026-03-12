import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
    ActivityIndicator
} from "react-native";

import RadioSelect from "../../../../components/inputs/RadioSelect";
import Button from "../../../../components/ui/Button";
import Info from "../../../../components/ui/Info";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";



const Kids = () => {
  const [children, setChildren] = useState("");
  const { options: familyPlanOptions, loading } = useLookupOptions("family-plans");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

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
            <ScrollView className="flex-1 mt-8" showsVerticalScrollIndicator={false}>
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
            </ScrollView>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  await updateProfileStep({ children });
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
