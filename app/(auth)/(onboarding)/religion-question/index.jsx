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
import Info from "../../../../components/ui/Info";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const religionImportanceMap = {
  "not-matter": "It doesn't matter to me at all",
  "very-important": "Is very important",
  "not-important": "It doesn't matter to me at all",
  "quite-important": "Is quite important",
};


const ReligionQuestions = () => {
  const [religionImportance, setReligionImportance] = useState("");
  const { options: sameBeliefsOptions, loading } = useLookupOptions("same-beliefs");

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
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-3xl font-PlusJakartaSansBold text-app mb-2">
                Dating someone with the same beliefs...
              </Text>

              <View>
                <RadioSelect
                  value={religionImportance}
                  onChange={setReligionImportance}
                  options={sameBeliefsOptions}
                  className="mt-2"
                />
              </View>
          
            </View>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="primary"
                disabled={!religionImportance}
                onPress={async () => {
                  const normalizedImportance =
                    religionImportanceMap[religionImportance?.toLowerCase?.()] ||
                    religionImportance;

                  await updateProfileStep({ religionImportance: normalizedImportance });
                  router.push("/religion-practice");
                }}
              />
                          <View className="w-full items-center mt-4">
  <Info title="You can change this details later from your profile" />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ReligionQuestions;
