import { useRouter } from "expo-router";
import { RefreshCw, Sparkles } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import Button from "../../../../components/ui/Button";
import { colors } from "../../../../constant/colors";
import { fonts } from "../../../../constant/fonts";
import { useAlert } from "../../../../context/AlertContext";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import AIService from "../../../../services/aiService";

// ─── Prompt Suggestion Cards ─────────────────────────────

const PromptSuggestions = ({ onSelectPrompt }) => {
  const suggestions = [
    "Adventurous, Funny, Kind",
    "Ambitious, Creative, Loyal",
    "Charming, Intelligent, Caring",
    "Energetic, Optimistic, Generous",
    "Mysterious, Witty, Passionate",
    "Relaxed, Thoughtful, Honest",
    "Bold, Empathetic, Adventurous",
    "Playful, Sincere, Ambitious"
  ];

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{
        fontFamily: fonts.OutfitBold,
        fontSize: 16,
        color: colors.primary,
        marginBottom: 12,
        textAlign: 'center'
      }}>
        Need inspiration? Try these prompts
      </Text>
      <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} horizontal={true}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onSelectPrompt(suggestion)}
            style={{
              backgroundColor: colors.primary + 20,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.primary,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{
              fontFamily: fonts.OutfitMedium,
              fontSize: 13,
              color: colors.primary,
            }}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── AI Generate Prompts ─────────────────────────────

// const AIGeneratePrompts = ({ onUsePrompt }) => {
//   const [loading, setLoading] = useState(false);
//   const [generatedPrompts, setGeneratedPrompts] = useState([]);

//   const generatePrompts = async () => {
//     setLoading(true);
//     try {
//       // Assuming AIService has a method to generate prompts
//       const response = await AIService.generatePrompts(); // Need to implement this
//       setGeneratedPrompts(response.prompts || []);
//     } catch (err) {
//       console.error("AI prompts error:", err);
//       Alert.alert("Error", "Couldn't generate prompts. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={{ marginBottom: 20 }}>
//       <TouchableOpacity
//         onPress={generatePrompts}
//         disabled={loading}
//         style={{
//           backgroundColor: loading ? '#F5A878' : colors.primary,
//           borderRadius: 50,
//           paddingVertical: 12,
//           alignItems: 'center',
//           flexDirection: 'row',
//           justifyContent: 'center',
//           gap: 8,
//         }}
//       >
//         {loading ? (
//           <ActivityIndicator size="small" color="#fff" />
//         ) : (
//           <Sparkles size={16} color="#fff" strokeWidth={2} />
//         )}
//         <Text style={{ color: "#fff", fontFamily: fonts.OutfitBold, fontSize: 14 }}>
//           {loading ? "Generating..." : "Generate prompts with AI"}
//         </Text>
//       </TouchableOpacity>
//       {generatedPrompts.map((prompt, index) => (
//         <TouchableOpacity
//           key={index}
//           onPress={() => onUsePrompt(prompt)}
//           style={{
//             backgroundColor: '#1E1E1E',
//             borderRadius: 12,
//             padding: 12,
//             marginTop: 8,
//           }}
//         >
//           <Text style={{ fontFamily: fonts.Outfit, fontSize: 14, color: '#E5E5E5' }}>
//             {prompt}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );
// };

// ─────────────────────────────────────────────────────────────────────────────

const About = () => {
  const [promptWords, setPromptWords] = useState("");
  const [generatedBio, setGeneratedBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  const handleSelectPrompt = (prompt) => {
    setPromptWords(prompt);
  };

  const handleGenerateBio = async () => {
    if (!promptWords.trim()) {
      showAlert({
        icon: 'warning',
        title: 'Prompt required',
        message: 'Please enter 3 words to describe yourself.',
      });
      return;
    }
    setLoading(true);
    try {
      const response = await AIService.generateBioFromPrompt({ prompt: promptWords });
      setGeneratedBio(response.bio || "");
      setEditing(true);
    } catch (err) {
      console.error("Bio generation error:", err);
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Couldn\'t generate bio. Try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerateBio();
  };

  const handleContinue = async () => {
    const bio = generatedBio.trim();
    if (!bio) {
      showAlert({
        icon: 'warning',
        title: 'Bio required',
        message: 'Please generate and edit your bio.',
      });
      return;
    }
    if (bio.length > 500) {
      showAlert({
        icon: 'warning',
        title: 'Bio too long',
        message: 'Please keep your bio under 500 characters.',
      });
      return;
    }
    setSubmitting(true);
    try {
      await updateProfileStep({ bio });
      router.push("/profile-answers");
    } catch (err) {
      console.error("Bio save error:", err);
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Failed to save bio.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#121212'}} className="bg-[#121212]">
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}} className="px-3">
            <ScrollView
              style={{flex: 1}}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <View className="mt-8 mb-6">
                <Text className="text-3xl font-OutfitBold mb-2">
                  Create your bio
                </Text>
                <Text className="text-base font-Outfit text-gray-400">
                  Describe yourself in 3 words, then let AI craft your perfect bio.
                </Text>
              </View>

              {/* Prompt Input */}
              <View className="mb-6">
                {/* <Text style={{
                  fontFamily: fonts.OutfitBold,
                  fontSize: 16,
                  color: '#E5E5E5',
                  marginBottom: 8
                }}>
                  Describe yourself in 3 words
                </Text> */}
                <TextInput
                  placeholder="e.g. Adventurous, Funny, Kind"
                  placeholderTextColor="#999"
                  value={promptWords}
                  onChangeText={setPromptWords}
                  style={{
                    backgroundColor: '#1E1E1E',
                    color: '#FFFFFF',
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 16,
                    fontFamily: fonts.OutfitMedium,
                  }}
                />
                 {/* Generated Bio */}
              {generatedBio && (
                <View className="my-6">
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 }}>
                    <Text style={{
                      fontFamily: fonts.OutfitBold,
                      fontSize: 16,
                      color: '#E5E5E5',
                    }}>
                      Your bio
                    </Text>
                    <TouchableOpacity
                      onPress={handleRegenerate}
                      disabled={loading}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <RefreshCw size={14} color={colors.primary} strokeWidth={2} />
                      <Text style={{ fontFamily: fonts.OutfitBold, fontSize: 12, color: colors.primary }}>
                        Regenerate
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    value={generatedBio}
                    onChangeText={setGeneratedBio}
                    multiline
                    numberOfLines={10}
                    style={{
                      backgroundColor: '#1E1E1E',
                      color: '#FFFFFF',
                      height: 150,
                      padding: 16,
                      borderRadius: 12,
                      textAlignVertical: "top",
                      fontSize: 16,
                      fontFamily: fonts.OutfitMedium,
                    }}
                  />
                  <Text style={{
                    fontFamily: fonts.Outfit,
                    fontSize: 12,
                    color: '#9CA3AF',
                    textAlign: 'right',
                    marginTop: 4
                  }}>
                    {generatedBio.length}/500 characters
                  </Text>
                </View>
              )}
              </View>

              {/* Suggestions */}
              <PromptSuggestions onSelectPrompt={handleSelectPrompt} />
              {/* <AIGeneratePrompts onUsePrompt={handleSelectPrompt} /> */}

              {/* Generate Button */}
              <TouchableOpacity
                onPress={handleGenerateBio}
                disabled={loading || !promptWords.trim()}
                style={{
                 
                  borderRadius: 50,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <Sparkles size={16} color={colors.secondary} strokeWidth={2} />
                )}
                <Text style={{ color: colors.secondary, fontFamily: fonts.OutfitBold, fontSize: 14 }}>
                  {loading ? "Generating bio..." : "Click to Generate bio"}
                </Text>
              </TouchableOpacity>

             
            </ScrollView>

            <View className="w-full items-end pb-6 bg-[#121212]">
              <Button
                title="Continue"
                variant="primary"
                onPress={handleContinue}
                disabled={!generatedBio.trim()}
                loading={submitting}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default About;