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
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const RelocationPreference = () => {
  const [relocationPreference, setRelocationPreference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { options: relocationOptions, loading } = useLookupOptions("relocation-preference");

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
            <ScrollView style={{flex: 1}} className="" showsVerticalScrollIndicator={false}>
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-3xl font-OutfitBold text-white mb-2">
                Would you move for the right person?
              </Text>
<Text className="text-lg font-Outfit text-white">Are you willing to relocate, if you meet the right person on Bondies?</Text>
              <View>
                <RadioSelect
                  value={relocationPreference}
                  onChange={setRelocationPreference}
                  options={relocationOptions}
                  className="mt-2"
                />
              </View>
           
            </View>
            </ScrollView>

            <View className="w-full items-end pb-6 bg-[#121212]">
              <Button
                title="Continue"
                variant="primary"
                disabled={!relocationPreference}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ willRelocateForMarriage: relocationPreference });
                    router.push("/kids");
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

export default RelocationPreference;
