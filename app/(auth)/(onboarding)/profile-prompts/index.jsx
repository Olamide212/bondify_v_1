import { useRouter } from "expo-router";
import { Plus, Sparkles, X } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import AIService from "../../../../services/aiService";

// ─── Example Prompts ─────────────────────────────

const ExamplePrompts = ({ onSelectPrompt }) => {
  const examples = [
    "Dating me is like…",
    "My ideal Sunday…",
    "The fastest way to my heart…",
    "You know you're my type if…",
    "My hidden talent is…",
    "The best advice I ever got…",
  ];

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{
        fontFamily: fonts.PlusJakartaSansBold,
        fontSize: 16,
        color: colors.primary,
        marginBottom: 12,
        textAlign: 'center'
      }}>
        Try these popular prompts
      </Text>
      <View style={{ gap: 8 }}>
        {examples.map((example, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onSelectPrompt(example)}
            style={{
              backgroundColor: '#FFF8F3',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#FDD9C0',
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{
              fontFamily: fonts.PlusJakartaSansMedium,
              fontSize: 15,
              color: '#1a1a1a',
            }}>
              {example}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── AI Generated Prompts ─────────────────────────────

const AIGeneratedPrompts = ({ onSelectPrompt }) => {
  const [loading, setLoading] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState([]);

  const generatePrompts = async () => {
    setLoading(true);
    try {
      const response = await AIService.generateConversationPrompts();
      setGeneratedPrompts(response.prompts || []);
    } catch (err) {
      console.error("AI prompts error:", err);
      Alert.alert("Error", "Couldn't generate prompts. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <TouchableOpacity
        onPress={generatePrompts}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#f3f4f6' : colors.primary,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Sparkles size={18} color="white" />
        )}
        <Text style={{
          fontFamily: fonts.PlusJakartaSansBold,
          fontSize: 15,
          color: loading ? colors.primary : 'white',
        }}>
          ✨ Generate prompt ideas
        </Text>
      </TouchableOpacity>

      {generatedPrompts.length > 0 && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <Text style={{
            fontFamily: fonts.PlusJakartaSansBold,
            fontSize: 14,
            color: colors.primary,
            textAlign: 'center'
          }}>
            AI suggestions for you
          </Text>
          {generatedPrompts.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onSelectPrompt(prompt)}
              style={{
                backgroundColor: '#F0F9FF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#BAE6FD',
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{
                fontFamily: fonts.PlusJakartaSansMedium,
                fontSize: 15,
                color: '#1a1a1a',
              }}>
                {prompt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Selected Prompts List ─────────────────────────────

const SelectedPrompts = ({ prompts, onRemovePrompt }) => {
  if (prompts.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{
        fontFamily: fonts.PlusJakartaSansBold,
        fontSize: 16,
        color: colors.primary,
        marginBottom: 12,
        textAlign: 'center'
      }}>
        Your selected prompts ({prompts.length}/6)
      </Text>
      <View style={{ gap: 8 }}>
        {prompts.map((prompt, index) => (
          <View
            key={index}
            style={{
              backgroundColor: '#F0FDF4',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#BBF7D0',
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{
              fontFamily: fonts.PlusJakartaSansMedium,
              fontSize: 15,
              color: '#1a1a1a',
              flex: 1,
            }}>
              {prompt}
            </Text>
            <TouchableOpacity
              onPress={() => onRemovePrompt(index)}
              style={{
                marginLeft: 8,
                padding: 4,
              }}
            >
              <X size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────

const ProfilePrompts = () => {
  const [selectedPrompts, setSelectedPrompts] = useState([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  const handleSelectPrompt = (prompt) => {
    if (selectedPrompts.length >= 6) {
      Alert.alert("Maximum reached", "You can select up to 6 prompts.");
      return;
    }
    if (!selectedPrompts.includes(prompt)) {
      setSelectedPrompts([...selectedPrompts, prompt]);
    }
  };

  const handleRemovePrompt = (index) => {
    const newPrompts = [...selectedPrompts];
    newPrompts.splice(index, 1);
    setSelectedPrompts(newPrompts);
  };

  const handleAddCustomPrompt = () => {
    if (!customPrompt.trim()) return;

    if (selectedPrompts.length >= 6) {
      Alert.alert("Maximum reached", "You can select up to 6 prompts.");
      return;
    }

    handleSelectPrompt(customPrompt.trim());
    setCustomPrompt("");
  };

  const handleContinue = async () => {
    if (selectedPrompts.length === 0) {
      Alert.alert("Select prompts", "Please select at least one prompt to continue.");
      return;
    }

    setSubmitting(true);
    try {
      // Save the selected prompts to the user's profile
      await updateProfileStep({ profilePrompts: selectedPrompts });
      router.push("/profile-answers");
    } catch (err) {
      console.error("Save prompts error:", err);
      Alert.alert("Error", "Could not save your prompts. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <View style={{ marginTop: 32, marginBottom: 24 }}>
                <Text style={{
                  fontFamily: fonts.PlusJakartaSansBold,
                  fontSize: 28,
                  color: colors.primary,
                  textAlign: 'center',
                  marginBottom: 8
                }}>
                  Create conversation starters
                </Text>
                <Text style={{
                  fontFamily: fonts.PlusJakartaSans,
                  fontSize: 16,
                  color: '#6b7280',
                  textAlign: 'center',
                  lineHeight: 24
                }}>
                  Choose prompts that will appear on your profile for others to answer and start conversations with you.
                </Text>
              </View>

              {/* Selected Prompts */}
              <SelectedPrompts
                prompts={selectedPrompts}
                onRemovePrompt={handleRemovePrompt}
              />

              {/* Custom Prompt Input */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontFamily: fonts.PlusJakartaSansBold,
                  fontSize: 16,
                  color: colors.primary,
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Or create your own
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={customPrompt}
                    onChangeText={setCustomPrompt}
                    placeholder="Enter your custom prompt..."
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      fontFamily: fonts.PlusJakartaSans,
                      fontSize: 15,
                    }}
                  />
                  <TouchableOpacity
                    onPress={handleAddCustomPrompt}
                    disabled={!customPrompt.trim()}
                    style={{
                      backgroundColor: customPrompt.trim() ? colors.primary : '#f3f4f6',
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={20} color={customPrompt.trim() ? 'white' : '#9ca3af'} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* AI Generated Prompts */}
              <AIGeneratedPrompts onSelectPrompt={handleSelectPrompt} />

              {/* Example Prompts */}
              <ExamplePrompts onSelectPrompt={handleSelectPrompt} />

            </ScrollView>

            {/* Continue Button */}
            <View style={{ paddingBottom: 24, paddingTop: 16 }}>
              <Button
                title="Continue"
                variant="gradient"
                onPress={handleContinue}
                disabled={submitting || selectedPrompts.length === 0}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfilePrompts;