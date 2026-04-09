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



const Kids = () => {
  const [children, setChildren] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { options: familyPlanOptions, loading } = useLookupOptions("family-plans");

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
          <View style={{flex: 1}} className="px-5">
            <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
              <Text className="text-3xl font-OutfitBold mt-8 text-white  mb-2">
                Do you want kids?
              </Text>
              <Text className="text-lg text-white font-Outfit">
                Please select an option.
              </Text>

              <View>
                <RadioSelect
                  value={children}
                  onChange={setChildren}
                  options={familyPlanOptions}  
                  className="mt-2"
                />
              </View>
            
            </ScrollView>

            <View className="w-full items-end pb-6 bg-[#121212]">
              <Button
                title="Continue"
                variant="primary"
                disabled={!children}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ children });
                    router.push("/education");
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

export default Kids;
