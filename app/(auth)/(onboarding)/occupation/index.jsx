import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import ActivityLoader from "../../../../components/ui/ActivityLoader";
import Button from "../../../../components/ui/Button";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const Occupation = () => {
  const router = useRouter();
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });
  const { options: occupationOptions, loading } = useLookupOptions("occupations");

  const handleSelect = (itemValue) => {
    setSelectedOccupation(itemValue);
  };

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
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-3xl font-OutfitBold text-white  mb-4">
                What&apos;s your occupation?
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  flexWrap: "wrap",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                {occupationOptions.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => handleSelect(item.value)}
                    className={`px-4 py-2 rounded-full  border ${
                      selectedOccupation === item.value
                        ? "bg-primary border-primary"
                        : "bg-[#121212] border-whiteLight"
                    }`}
                  >
                    <Text
                      className={`${
                        selectedOccupation === item.value
                          ? "text-white"
                          : "text-white"
                      } font-OutfitMedium text-lg`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="w-full items-end pb-6 bg-[#121212]">
              <Button
                title="Continue"
                variant="primary"
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ occupation: selectedOccupation });
                    router.push("/smoke");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={!selectedOccupation}
                loading={submitting}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Occupation;
