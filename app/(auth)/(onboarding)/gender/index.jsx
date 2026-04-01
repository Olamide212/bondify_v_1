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
  const { options: genderOptions, loading } = useLookupOptions("genders");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

 if (loading) {
    return (
      <ActivityLoader />
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}} className="bg-white" >
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}} className="px-2">
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-3xl font-PlusJakartaSansBold mb-2">
                What’s Your Gender?
              </Text>
              <Text className="text-lg font-PlusJakartaSans">
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

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="primary"
                disabled={!gender}
                onPress={async () => {
                  // Find the selected option's label
                  const selected = genderOptions.find(opt => opt.value === gender);
                  const genderLabel = selected ? selected.label : gender;
                  await updateProfileStep({ gender: genderLabel });
                  router.push("/marital-status");
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
