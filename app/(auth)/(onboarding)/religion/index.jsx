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

import { ScrollView } from "react-native-gesture-handler";
import RadioSelect from "../../../../components/inputs/RadioSelect";
import Button from "../../../../components/ui/Button";
import Info from "../../../../components/ui/Info";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";


const Religion = () => {
  const [religion, setReligion] = useState("");
  const { options: religionOptions, loading } = useLookupOptions("religions");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#E8651A" style={{ flex: 1, justifyContent: "center", alignItems: "center" }} />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-2">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-1 mt-8">
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
                <Info title="You can change this details later from your profile" />
              </View>
            </ScrollView>
            <View className="w-full items-end mt-4">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  await updateProfileStep({ religion });
                  router.push("/religion-question");
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
