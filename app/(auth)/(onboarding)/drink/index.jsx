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




const Drink = () => {
  const [drinking, setDrinking] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { options: drinkingOptions, loading } = useLookupOptions("drinking-habits");

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
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-3xl font-OutfitBold  mb-2">
          Do you Drink?
              </Text>

              <View>
                <RadioSelect
                  value={drinking}
                  onChange={setDrinking}
                  options={drinkingOptions}
                  className="mt-2"
                />
              </View>
            
            </View>

            <View className="w-full items-end pb-6 bg-[#121212]">
              <Button
                title="Continue"
                variant="primary"
                disabled={!drinking}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ drinking });
                    router.push("/interests");
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

export default Drink;
