import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import RadioSelect from "../../../../components/inputs/RadioSelect";
import ActivityLoader from "../../../../components/ui/ActivityLoader";
import Button from "../../../../components/ui/Button";
import { colors } from "../../../../constant/colors";
import { fonts } from "../../../../constant/fonts";
import { useAlert } from "../../../../context/AlertContext";
import { funActivitiesData } from "../../../../data/funActivitiesData";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

// ─── Main Component ─────────────────────────────────────────────────────

const FunActivities = () => {
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });
  const { options: activityOptions, loading, error } = useLookupOptions("fun-activities");

  // Use fetched options if available, otherwise fall back to static data
  const finalOptions = activityOptions?.length > 0 ? activityOptions : funActivitiesData;

  if (loading) {
    return <ActivityLoader />;
  }

  const handleContinue = async () => {
    if (selectedActivities.length === 0) {
      showAlert({
        icon: 'warning',
        title: 'Selection Required',
        message: 'Please select at least one fun activity.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await updateProfileStep({ funActivities: selectedActivities });
      router.push("/onboarding-complete");
    } catch (err) {
      console.error("Save activities error:", err);
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Could not save your activity preferences. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push("/onboarding-complete");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback>
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Title */}
              <View style={{ paddingHorizontal: 16, marginTop: 32, marginBottom: 24 }}>
                <Text style={{
                  fontFamily: fonts.OutfitBold,
                  fontSize: 28,
                  color: '#FFFFFF',
                  marginBottom: 8
                }}>
                  What activities do you enjoy?
                </Text>
                <Text style={{
                  fontFamily: fonts.Outfit,
                  fontSize: 16,
                  color: '#6b7280',
                  textAlign: 'center',
                  lineHeight: 24
                }}>
                  Select the activities you love doing to help us find better matches and conversation starters.
                </Text>
              </View>

              {/* Selected Activities Display */}
              {selectedActivities.length > 0 && (
                <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
                  <Text style={{
                    fontFamily: fonts.OutfitBold,
                    fontSize: 16,
                    color: colors.primary,
                    marginBottom: 12,
                    textAlign: 'center'
                  }}>
                    Your selections ({selectedActivities.length})
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {selectedActivities.map((activity, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: '#F0FDF4',
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: '#BBF7D0',
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Heart size={14} color={colors.primary} />
                        <Text style={{
                          fontFamily: fonts.OutfitMedium,
                          fontSize: 13,
                          color: '#E5E5E5',
                        }}>
                          {activity}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Activity Options */}
              <View style={{ paddingHorizontal: 16 }}>
                <RadioSelect
                  label="Select your favorite activities"
                  options={finalOptions}
                  values={selectedActivities}
                  onMultiChange={setSelectedActivities}
                  multiSelect={true}
                  horizontal={false}
                />
              </View>

            </ScrollView>

            {/* Buttons */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 }}>
              <View style={{ gap: 12 }}>
                <Button
                  title="Continue"
                  variant="gradient"
                  onPress={handleContinue}
                  disabled={submitting || selectedActivities.length === 0}
                />
                <TouchableOpacity
                  onPress={handleSkip}
                  style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontFamily: fonts.OutfitMedium,
                    fontSize: 16,
                    color: '#6b7280',
                  }}>
                    Skip for now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FunActivities;
