import { useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
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

// ─── Prompt Selection Modal ─────────────────────────────

const PromptModal = ({ visible, onClose, onSaveAnswer }) => {
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const prompts = [
    "Dating me is like…",
    "My ideal Sunday…",
    "The fastest way to my heart…",
    "You know you're my type if…",
    "My hidden talent is…",
    "The best advice I ever got…",
    "My go-to comfort food is…",
    "If I could travel anywhere right now…",
    "My favorite way to unwind…",
    "What I'm passionate about…",
    "My dream date would be…",
    "Something I'm really good at…",
    "My favorite childhood memory…",
    "What makes me laugh…",
    "My perfect day looks like…",
  ];

  const generateAISuggestions = async (prompt) => {
    if (!prompt) return;

    setLoadingSuggestions(true);
    try {
      // This would need a new AI service method for generating answers to prompts
      // For now, we'll use a placeholder
      const suggestions = [
        `For "${prompt}", you could say something personal and engaging...`,
        `A great answer might highlight your unique personality...`,
        `Consider sharing a specific example that shows your character...`,
      ];
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("AI suggestions error:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setAnswer("");
    setAiSuggestions([]);
    generateAISuggestions(prompt);
  };

  const handleSave = () => {
    if (!selectedPrompt || !answer.trim()) {
      Alert.alert("Incomplete", "Please select a prompt and provide an answer.");
      return;
    }

    onSaveAnswer({
      prompt: selectedPrompt,
      answer: answer.trim()
    });

    // Reset modal
    setSelectedPrompt("");
    setAnswer("");
    setAiSuggestions([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedPrompt("");
    setAnswer("");
    setAiSuggestions([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '90%',
          paddingTop: 20,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 20,
          }}>
            <Text style={{
              fontFamily: fonts.PlusJakartaSansBold,
              fontSize: 20,
              color: colors.primary,
            }}>
              Choose a prompt & answer
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: 500 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Prompt Selection */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Text style={{
                fontFamily: fonts.PlusJakartaSansBold,
                fontSize: 16,
                color: '#333',
                marginBottom: 12,
              }}>
                Select a prompt
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              >
                {prompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSelectPrompt(prompt)}
                    style={{
                      backgroundColor: selectedPrompt === prompt ? colors.primary : '#f8f9fa',
                      borderRadius: 20,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderWidth: selectedPrompt === prompt ? 0 : 1,
                      borderColor: '#e1e5e9',
                    }}
                  >
                    <Text style={{
                      fontFamily: fonts.PlusJakartaSansMedium,
                      fontSize: 14,
                      color: selectedPrompt === prompt ? 'white' : '#333',
                    }}>
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Answer Input */}
            {selectedPrompt && (
              <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <Text style={{
                  fontFamily: fonts.PlusJakartaSansBold,
                  fontSize: 16,
                  color: '#333',
                  marginBottom: 8,
                }}>
                  Your answer
                </Text>
                <Text style={{
                  fontFamily: fonts.PlusJakartaSansMedium,
                  fontSize: 14,
                  color: colors.primary,
                  marginBottom: 12,
                }}>
                  {selectedPrompt}
                </Text>
                <TextInput
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder="Share your answer..."
                  multiline
                  numberOfLines={3}
                  style={{
                    borderWidth: 1,
                    borderColor: '#e1e5e9',
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    fontFamily: fonts.PlusJakartaSans,
                    fontSize: 15,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                />

                {/* AI Suggestions */}
                {loadingSuggestions && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 12,
                    gap: 8,
                  }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{
                      fontFamily: fonts.PlusJakartaSansMedium,
                      fontSize: 14,
                      color: '#666',
                    }}>
                      Getting AI suggestions...
                    </Text>
                  </View>
                )}

                {aiSuggestions.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{
                      fontFamily: fonts.PlusJakartaSansBold,
                      fontSize: 14,
                      color: colors.primary,
                      marginBottom: 8,
                    }}>
                      💡 AI Suggestions
                    </Text>
                    {aiSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setAnswer(suggestion)}
                        style={{
                          backgroundColor: '#f0f9ff',
                          borderRadius: 8,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          marginBottom: 6,
                          borderWidth: 1,
                          borderColor: '#bae6fd',
                        }}
                      >
                        <Text style={{
                          fontFamily: fonts.PlusJakartaSans,
                          fontSize: 13,
                          color: '#0369a1',
                          lineHeight: 18,
                        }}>
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Save Button */}
          <View style={{
            paddingHorizontal: 20,
            paddingBottom: 30,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
          }}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!selectedPrompt || !answer.trim()}
              style={{
                backgroundColor: (selectedPrompt && answer.trim()) ? colors.primary : '#f3f4f6',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontFamily: fonts.PlusJakartaSansBold,
                fontSize: 16,
                color: (selectedPrompt && answer.trim()) ? 'white' : '#9ca3af',
              }}>
                Save Answer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Component ─────────────────────────────

export default function ProfilePromptsScreen() {
  const router = useRouter();
  const { profileData, updateProfileData } = useProfileSetup();
  const [modalVisible, setModalVisible] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState(profileData?.profilePrompts || []);

  const handleSaveAnswer = (newAnswer) => {
    const updatedAnswers = [...savedAnswers, newAnswer];
    setSavedAnswers(updatedAnswers);
    updateProfileData({ profilePrompts: updatedAnswers });
  };

  const handleRemoveAnswer = (index) => {
    const updatedAnswers = savedAnswers.filter((_, i) => i !== index);
    setSavedAnswers(updatedAnswers);
    updateProfileData({ profilePrompts: updatedAnswers });
  };

  const handleContinue = () => {
    if (savedAnswers.length === 0) {
      Alert.alert(
        "Add at least one prompt",
        "Share something about yourself to help others get to know you better."
      );
      return;
    }
    router.push("/(auth)/(onboarding)/profile-answers");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={{ marginBottom: 30 }}>
              <Text style={{
                fontFamily: fonts.PlusJakartaSansBold,
                fontSize: 28,
                color: '#1a1a1a',
                textAlign: 'center',
                marginBottom: 8,
              }}>
                Share your story
              </Text>
              <Text style={{
                fontFamily: fonts.PlusJakartaSans,
                fontSize: 16,
                color: '#666',
                textAlign: 'center',
                lineHeight: 24,
              }}>
                Pick prompts and share your answers to help others get to know the real you.
              </Text>
            </View>

            {/* Add Prompt Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 24,
              }}
            >
              <Plus size={20} color="white" />
              <Text style={{
                fontFamily: fonts.PlusJakartaSansBold,
                fontSize: 16,
                color: 'white',
              }}>
                Add a prompt & answer
              </Text>
            </TouchableOpacity>

            {/* Saved Answers */}
            {savedAnswers.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontFamily: fonts.PlusJakartaSansBold,
                  fontSize: 18,
                  color: colors.primary,
                  marginBottom: 16,
                  textAlign: 'center',
                }}>
                  Your answers ({savedAnswers.length}/6)
                </Text>
                <View style={{ gap: 12 }}>
                  {savedAnswers.map((item, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: 12,
                        paddingVertical: 16,
                        paddingHorizontal: 16,
                        borderWidth: 1,
                        borderColor: '#e9ecef',
                      }}
                    >
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                      }}>
                        <Text style={{
                          fontFamily: fonts.PlusJakartaSansBold,
                          fontSize: 15,
                          color: colors.primary,
                          flex: 1,
                          marginRight: 8,
                        }}>
                          {item.prompt}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveAnswer(index)}
                          style={{
                            padding: 4,
                          }}
                        >
                          <X size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                      <Text style={{
                        fontFamily: fonts.PlusJakartaSans,
                        fontSize: 15,
                        color: '#333',
                        lineHeight: 22,
                      }}>
                        {item.answer}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Empty State */}
            {savedAnswers.length === 0 && (
              <View style={{
                alignItems: 'center',
                paddingVertical: 40,
                paddingHorizontal: 20,
              }}>
                <Text style={{
                  fontFamily: fonts.PlusJakartaSansMedium,
                  fontSize: 16,
                  color: '#666',
                  textAlign: 'center',
                  lineHeight: 24,
                }}>
                  No prompts added yet. Tap the button above to start sharing about yourself!
                </Text>
              </View>
            )}

            {/* Continue Button */}
            <View style={{ marginTop: 20 }}>
              <Button
                title="Continue"
                onPress={handleContinue}
                disabled={savedAnswers.length === 0}
                style={{
                  opacity: savedAnswers.length === 0 ? 0.5 : 1,
                }}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Prompt Modal */}
      <PromptModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaveAnswer={handleSaveAnswer}
      />
    </SafeAreaView>
  );
}