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



const Gender = () => {
  const [gender, setGender] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { options: genderOptions, loading } = useLookupOptions("genders");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

 if (loading) {
    return (
      <ActivityLoader />
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#121212'}} className="bg-[#121212]" >
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}} className="px-5">
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-3xl text-white font-PlusJakartaSansBold mb-2">
                How do you identify yourself?
              </Text>
              <Text className="text-lg text-white font-PlusJakartaSans">
                Tell us about your gender
              </Text>

              <View>
                <RadioSelect
                  value={gender}
                  onChange={setGender}
                  options={genderOptions}
                  className="mt-2"
                />
              </View>
            </View>

            <View className="w-full items-end pb-6 bg-[#121212]">
              <Button
                title="Continue"
                variant="primary"
                disabled={!gender}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    const selected = genderOptions.find(opt => opt.value === gender);
                    const genderLabel = selected ? selected.label : gender;
                    await updateProfileStep({ gender: genderLabel });
                    router.push("/marital-status");
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

export default Gender;
