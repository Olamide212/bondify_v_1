import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Text,
    TouchableWithoutFeedback,
    View
} from "react-native";

import { ScrollView } from "react-native-gesture-handler";
import RadioSelect from "../../../../components/inputs/RadioSelect";
import ActivityLoader from "../../../../components/ui/ActivityLoader";
import Button from "../../../../components/ui/Button";
import { ETHNICITY_OPTIONS } from "../../../../data/ethnicityData";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";



const Ethnicity = () => {
  const [ethnicity, setEthnicity] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
      <ActivityLoader />
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#121212'}} className="bg-[#121212]">
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1, backgroundColor: '#121212'}} className="">
            <ScrollView style={{flex: 1}} className=" bg-[#121212]" showsVerticalScrollIndicator={false}>
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-3xl text-white font-OutfitBold mb-2">
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

            <View className="w-full items-end pb-6 bg-[#121212]">
              <Button
                title="Continue"
                variant="primary"
                disabled={!ethnicity}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ ethnicity });
                    router.push("/gender");
                  } finally {
                    setSubmitting(false);
                  }
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
