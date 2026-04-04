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

const ReligionPractice = () => {
  const [religionPractice, setReligionPractice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { options: religionPracticeOptions, loading } = useLookupOptions("religion-practice");

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
            <View style={{flex: 1}} className="">
              <Text className="text-3xl font-OutfitBold text-app mb-2">
                How well do you practice your religion?
              </Text>

              <View>
                <RadioSelect
                  value={religionPractice}
                  onChange={setReligionPractice}
                  options={religionPracticeOptions}
                  className="mt-2"
                />
              </View>
           
            </View>
            </ScrollView>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="primary"
                disabled={!religionPractice}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ religionPractice });
                    router.push("/relocation-preference");
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

export default ReligionPractice;
