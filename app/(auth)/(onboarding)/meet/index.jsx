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

import CheckboxSelect from "../../../../components/inputs/CheckboxSelect";
import ActivityLoader from "../../../../components/ui/ActivityLoader";
import Button from "../../../../components/ui/Button";
import Info from "../../../../components/ui/Info";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";


const Meet = () => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { options: meetOptions, loading } = useLookupOptions("gender-preferences");

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
          <View style={{flex: 1}} className="px-2">
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-3xl text-white font-OutfitBold mb-2">
                I would like to meet...
              </Text>

              <View>
                <CheckboxSelect
                  options={meetOptions}
                  value={selectedOptions}
                  onChange={setSelectedOptions}
                  className="mt-2"
                />
              </View>
              <View className="w-full mt-4 justify-center items-center">
                <Info title="You can change this details later from your profile"  />
              </View>
            </View>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="primary"
                disabled={selectedOptions.length === 0}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    const preferenceValues = selectedOptions.map((val) => {
                      const opt = meetOptions.find((o) => o.value === val);
                      return opt ? opt.value : val;
                    });
                    await updateProfileStep({
                      discoveryPreferences: { genderPreference: preferenceValues },
                    });
                    router.push("/preference");
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

export default Meet;
