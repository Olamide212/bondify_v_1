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
    View,
      ActivityIndicator
} from "react-native";

import RadioSelect from "../../../../components/inputs/RadioSelect";
import Button from "../../../../components/ui/Button";
import Info from "../../../../components/ui/Info";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const relationshipTypeMap = {
  seperated: "separated",
  anunulled: "annulled",
};


const MaritalStatus = () => {
  const [maritalStatus, setMaritalStatus] = useState("");
  const { options: relationshipStatusOptions, loading } = useLookupOptions("relationship-status");

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
            <ScrollView className="flex-1 mt-8" showsVerticalScrollIndicator={false}>
              <Text className="text-3xl font-PlusJakartaSansBold text-app mb-2">
              Relationship Status?
              </Text>
              <Text className="text-lg font-PlusJakartaSans">
                Please let us know your relationship status.
              
              </Text>

              <View>
                <RadioSelect
                  value={maritalStatus}
                  onChange={setMaritalStatus}
                  options={relationshipStatusOptions}
                  className="mt-2"
                />
              </View>
              <Info title="You can change this details later from your profile" />
            </ScrollView>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  const normalizedRelationshipType =
                    relationshipTypeMap[maritalStatus?.toLowerCase?.()] || maritalStatus;

                  await updateProfileStep({ relationshipType: normalizedRelationshipType });
                  router.push("/meet");
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MaritalStatus;
