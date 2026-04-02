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

import RadioSelect from "../../../../components/inputs/RadioSelect";
import ActivityLoader from "../../../../components/ui/ActivityLoader";
import Button from "../../../../components/ui/Button";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";




const Education = () => {
  const [education, setEducation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { options: educationOptions, loading } = useLookupOptions("education");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  if (loading) {
    return (
      <ActivityLoader />
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}} className="bg-white">
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}} className="px-2">
            <View style={{flex: 1}} className="">
              <Text className="text-3xl font-PlusJakartaSansBold mt-8  mb-2">
                Highest Education Obtained
              </Text>

              <View>
                <RadioSelect
                  value={education}
                  onChange={setEducation}
                  options={educationOptions}
                  className="mt-2"
                />
              </View>
          
            </View>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="primary"
                disabled={!education}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ education });
                    router.push("/occupation");
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

export default Education;
