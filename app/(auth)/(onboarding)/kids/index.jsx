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
import Info from "../../../../components/ui/Info";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";



const Kids = () => {
  const [children, setChildren] = useState("");
  const { options: familyPlanOptions, loading } = useLookupOptions("family-plans");

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
            <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
              <Text className="text-3xl font-PlusJakartaSansBold mt-8  mb-2">
                Do you want kids?
              </Text>
              <Text className="text-lg font-PlusJakartaSans">
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

            <View className="w-full items-end pb-6 bg-white">
              <Button
                title="Continue"
                variant="primary"
                disabled={!children}
                onPress={async () => {
                  await updateProfileStep({ children });
                  router.push("/education");
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

export default Kids;
