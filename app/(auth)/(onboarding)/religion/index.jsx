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


const Religion = () => {
  const [religion, setReligion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { options: religionOptions, loading } = useLookupOptions("religions");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  if (loading) {
    return (
      <ActivityLoader />
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} className="bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }} className="px-2">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flex: 1 }} className="mt-8">
                <Text className="text-3xl font-PlusJakartaSansBold text-app mb-2">
                  Your religion or spiritual belief?
                </Text>

                <View>
                  <RadioSelect
                    value={religion}
                    onChange={setReligion}
                    options={religionOptions}
                    className="mt-2"
                  />
                </View>

              </View>
            </ScrollView>
            <View className="w-full items-end mt-4 bg-white">
              <Button
                title="Continue"
                variant="primary"
                disabled={!religion}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ religion });
                    router.push("/religion-question");
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

export default Religion;
