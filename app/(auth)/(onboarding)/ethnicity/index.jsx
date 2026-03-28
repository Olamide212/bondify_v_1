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
import ActivityLoader from "../../../../components/ui/ActivityLoader";



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
      <ActivityLoader />
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor:'#fff'}} className="bg-white">
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1, backgroundColor:'#fff'}} className="">
            <ScrollView style={{flex: 1}} className=" bg-white" showsVerticalScrollIndicator={false}>
            <View style={{flex: 1}} className="mt-8">
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

            <View className="w-full items-end pb-6 bg-white">
              <Button
                title="Continue"
                variant="primary"
                onPress={async () => {
                  // Find the selected option's label
               await updateProfileStep({ ethnicity });
                  router.push("/gender");
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
