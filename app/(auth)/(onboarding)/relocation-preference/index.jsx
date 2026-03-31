import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Text,
    TouchableWithoutFeedback,
    View,
    ActivityIndicator
} from "react-native";

import RadioSelect from "../../../../components/inputs/RadioSelect";
import Button from "../../../../components/ui/Button";
import Info from "../../../../components/ui/Info";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import { ScrollView } from "react-native-gesture-handler";
import ActivityLoader from "../../../../components/ui/ActivityLoader";

const RelocationPreference = () => {
  const [relocationPreference, setRelocationPreference] = useState("");
  const { options: relocationOptions, loading } = useLookupOptions("relocation-preference");

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
            <ScrollView style={{flex: 1}} className="" showsVerticalScrollIndicator={false}>
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-3xl font-PlusJakartaSansBold text-app mb-2">
                Would you move for the right person?
              </Text>
<Text className="text-lg font-PlusJakartaSans">Are you willing to relocate, if you meet the right person on Bondies?</Text>
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

            <View className="w-full items-end pb-6 bg-white">
              <Button
                title="Continue"
                variant="primary"
                onPress={async () => {
                  await updateProfileStep({ willRelocateForMarriage: relocationPreference });
                  router.push("/kids");
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

export default RelocationPreference;
