import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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
import { ETHNICITY_OPTIONS } from "../../../../data/ethnicityData";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import { ScrollView } from "react-native-gesture-handler";


const Ethnicity = () => {
  const [ethnicity, setEthnicity] = useState("");
  const { options: ethnicityOptions, loading, error } = useLookupOptions("ethnicity");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  // Use fetched options if available, otherwise fall back to static data
  const finalOptions = ethnicityOptions?.length > 0 ? ethnicityOptions : ETHNICITY_OPTIONS;

  // Debug logging
  console.log("[Ethnicity] API options count:", ethnicityOptions?.length || 0);
  console.log("[Ethnicity] Using final options count:", finalOptions?.length || 0);
  if (error) console.log("[Ethnicity] Fetch error:", error);

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
            <View className="flex-1 mt-8">
              <Text className="text-3xl font-PlusJakartaSansBold mb-2">
                What’s Your Ethnicity?
              </Text>
             

              <View>
                <RadioSelect
                  value={ethnicity}
                  onChange={setEthnicity}
                  options={finalOptions}
                  className="mt-2"
                />
              </View>
            
            </View>
                </ScrollView>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  // Find the selected option's label
               await updateProfileStep({ ethnicity });
                  router.push("/meet");
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Ethnicity;
