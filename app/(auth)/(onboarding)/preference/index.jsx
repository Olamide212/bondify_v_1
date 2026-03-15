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
import ActivityLoader from "../../../../components/ui/ActivityLoader";



const Preference = () => {
  const [preference, setPreference] = useState("");
  const { options: lookingForOptions, loading } = useLookupOptions("looking-for");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  if (loading) {
    return (
      <ActivityLoader />
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
                What are you hoping to find on Bondies?
              </Text>
              <Text className="text-lg font-PlusJakartaSans">
                Provide us with further insights into your preferences
              </Text>

              <View>
                <RadioSelect
                  value={preference}
                  onChange={setPreference}
                  options={lookingForOptions}
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
                  // Find the selected option's label
                  const selected = lookingForOptions.find(opt => opt.value === preference);
                  const preferenceLabel = selected ? selected.label : preference;
                  await updateProfileStep({ lookingFor: preferenceLabel });
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
