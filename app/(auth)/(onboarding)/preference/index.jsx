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
    View
} from "react-native";

import RadioSelect from "../../../../components/inputs/RadioSelect";
import ActivityLoader from "../../../../components/ui/ActivityLoader";
import Button from "../../../../components/ui/Button";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";



const Preference = () => {
  const [preference, setPreference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { options: lookingForOptions, loading } = useLookupOptions("looking-for");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

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
          <View style={{flex: 1}} className="px-2">
            <ScrollView style={{flex: 1}} className="mt-8" showsVerticalScrollIndicator={false}>
              <Text className="text-3xl text-white font-OutfitBold  mb-2">
                What are you hoping to find on Bondies?
              </Text>
              <Text className="text-lg text-white font-Outfit">
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
       
            </ScrollView>

            <View className="w-full items-center pb-6">
              <Button
                title="Continue"
                variant="primary"
                disabled={!preference}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ lookingFor: preference });
                    router.push("/religion");
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

export default Preference;
