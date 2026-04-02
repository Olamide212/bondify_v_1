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
} from "react-native";
import TextInput from "../../../../components/inputs/TextInput";
import Info from "../../../../components/ui/Info";
import NextButton from "../../../../components/ui/NextButton";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const Username = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  const router = useRouter();

  return (
    <SafeAreaView style={{flex: 1}} className="bg-white">
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}} className="px-2">
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-[25px] font-PlusJakartaSansBold text-app mb-2">
                What is your name?
              </Text>
              <Text className="text-app font-PlusJakartaSans">
                Let&apos;s Get to Know Each Other
              </Text>
              <View>
                <TextInput
                  placeholder="First name"
                  className="mt-4"
                  keyboardType="default"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput placeholder="Last name" className="" value={lastName} onChangeText={setLastName} />
              </View>
              <Info title="This would be used to match people" />
            </View>

            <View className="w-full items-end pb-6">
              <NextButton
                variant="gradient"
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ firstName, lastName });
                    router.push("/age");
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

export default Username;
