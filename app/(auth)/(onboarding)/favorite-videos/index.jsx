import { useRouter } from "expo-router";
import { Play } from "lucide-react-native";
import { useState } from "react";
import {
    Alert,
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
import { favoriteVideosData } from "../../../../data/favoriteVideosData";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

// ─── Main Component ─────────────────────────────────────────────────────

const FavoriteVideos = () => {
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });
  const { options: videoOptions, loading, error } = useLookupOptions("favorite-videos");

  // Use fetched options if available, otherwise fall back to static data
  const finalOptions = videoOptions?.length > 0 ? videoOptions : favoriteVideosData;

  if (loading) {
    return <ActivityLoader />;
  }

  const handleContinue = async () => {
    if (selectedVideos.length === 0) {
      Alert.alert("Selection Required", "Please select at least one favorite video type.");
      return;
    }

    setSubmitting(true);
    try {
      await updateProfileStep({ favoriteVideos: selectedVideos });
      router.push("/fun-activities");
    } catch (err) {
      console.error("Save videos error:", err);
      Alert.alert("Error", "Could not save your video preferences. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push("/fun-activities");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
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
                  fontFamily: fonts.PlusJakartaSansBold,
                  fontSize: 28,
                  color: "#000",
                  marginBottom: 8
                }}>
                  What videos do you enjoy?
                </Text>
                <Text style={{
                  fontFamily: fonts.PlusJakartaSans,
                  fontSize: 16,
                  color: '#6b7280',
                  textAlign: 'center',
                  lineHeight: 24
                }}>
                  Select the types of videos you like watching to help us find better matches and conversation starters.
                </Text>
              </View>

              {/* Selected Videos Display */}
              {selectedVideos.length > 0 && (
                <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
                  <Text style={{
                    fontFamily: fonts.PlusJakartaSansBold,
                    fontSize: 16,
                    color: colors.primary,
                    marginBottom: 12,
                    textAlign: 'center'
                  }}>
                    Your selections ({selectedVideos.length})
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {selectedVideos.map((video, index) => (
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
                        <Play size={14} color={colors.primary} />
                        <Text style={{
                          fontFamily: fonts.PlusJakartaSansMedium,
                          fontSize: 13,
                          color: '#1a1a1a',
                        }}>
                          {video}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Video Options */}
              <View style={{ paddingHorizontal: 16 }}>
                <RadioSelect
                  label="Select your favorite video types"
                  options={finalOptions}
                  values={selectedVideos}
                  onMultiChange={setSelectedVideos}
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
                  disabled={submitting}
                />
                <TouchableOpacity
                  onPress={handleSkip}
                  style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontFamily: fonts.PlusJakartaSansMedium,
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

export default FavoriteVideos;
 