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

const relationshipTypeMap = {
  seperated: "separated",
  anunulled: "annulled",
};


const MaritalStatus = () => {
  const [maritalStatus, setMaritalStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { options: relationshipStatusOptions, loading } = useLookupOptions("relationship-status");

  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

 if (loading) {
    return (
      <ActivityLoader />
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#121212'}} className="bg-[#121212]" >
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}} className="px-5">
            <ScrollView style={{flex: 1}} className="mt-8" showsVerticalScrollIndicator={false}>
              <Text className="text-3xl font-PlusJakartaSansBold text-white mb-2">
              Relationship Status?
              </Text>
              <Text className="text-lg font-PlusJakartaSans text-white">
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
      
            </ScrollView>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="primary"
                disabled={!maritalStatus}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    const normalizedRelationshipType =
                      relationshipTypeMap[maritalStatus?.toLowerCase?.()] || maritalStatus;
                    await updateProfileStep({ relationshipType: normalizedRelationshipType });
                    router.push("/meet");
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

export default MaritalStatus;
