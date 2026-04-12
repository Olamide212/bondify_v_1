import { useRouter } from "expo-router";
import { Music } from "lucide-react-native";
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
import { favoriteMusicData } from "../../../../data/favoriteMusicData";
import { useLookupOptions } from "../../../../hooks/useLookupOptions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

// ─── Main Component ─────────────────────────────────────────────────────

const FavoriteMusic = () => {
  const [selectedMusic, setSelectedMusic] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });
  const { options: musicOptions, loading, error } = useLookupOptions("favorite-music");

  // Use fetched options if available, otherwise fall back to static data
  const finalOptions = musicOptions?.length > 0 ? musicOptions : favoriteMusicData;

  if (loading) {
    return <ActivityLoader />;
  }

  const handleMusicSelect = (music) => {
    if (selectedMusic.includes(music)) {
      // Remove if already selected
      setSelectedMusic(selectedMusic.filter(item => item !== music));
    } else {
      // Add if not selected (allow multiple selections)
      setSelectedMusic([...selectedMusic, music]);
    }
  };

  const handleContinue = async () => {
    if (selectedMusic.length === 0) {
      showAlert({
        icon: 'warning',
        title: 'Selection Required',
        message: 'Please select at least one favorite music genre.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await updateProfileStep({ favoriteMusic: selectedMusic });
      router.push("/favorite-videos");
    } catch (err) {
      console.error("Save music error:", err);
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Could not save your music preferences. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push("/favorite-videos");
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
                  fontFamily: fonts.PlusJakartaSansBold,
                  fontSize: 28,
                  color: '#FFFFFF',
                  marginBottom: 8
                }}>
                  What&apos;s your favorite music?
                </Text>
                <Text style={{
                  fontFamily: fonts.PlusJakartaSans,
                  fontSize: 16,
                  color: '#6b7280',
                  textAlign: 'center',
                  lineHeight: 24
                }}>
                  Select all the music genres you enjoy to help us find better matches and conversation starters.
                </Text>
              </View>

              {/* Selected Music Display */}
              {selectedMusic.length > 0 && (
                <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
                  <Text style={{
                    fontFamily: fonts.PlusJakartaSansBold,
                    fontSize: 16,
                    color: colors.primary,
                    marginBottom: 12,
                    textAlign: 'center'
                  }}>
                    Your selections ({selectedMusic.length})
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {selectedMusic.map((music, index) => (
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
                        <Music size={14} color={colors.primary} />
                        <Text style={{
                          fontFamily: fonts.PlusJakartaSansMedium,
                          fontSize: 13,
                          color: '#E5E5E5',
                        }}>
                          {music}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Music Options */}
              <View style={{ paddingHorizontal: 16 }}>
                <RadioSelect
                  label="Select your favorite music genres"
                  options={finalOptions}
                  values={selectedMusic}
                  onMultiChange={setSelectedMusic}
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
                  disabled={submitting || selectedMusic.length === 0}
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

export default FavoriteMusic;