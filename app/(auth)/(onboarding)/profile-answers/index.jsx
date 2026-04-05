import { useRouter } from "expo-router";
import { MessageCircle, X } from "lucide-react-native";
import { useState } from "react";
import {
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView as RNScrollView,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView as SAV } from "react-native-safe-area-context";
import Button from "../../../../components/ui/Button";
import Info from "../../../../components/ui/Info";
import { colors } from "../../../../constant/colors";
import { PROMPT_CATEGORIES, PROMPT_QUESTIONS } from "../../../../data/profilePromptQuestions";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const MAX_PROMPTS = 3;

// ─── Category Tab ─────────────────────────────────────────────────────────────
const CategoryTab = ({ category, isActive, onPress }) => (
  <TouchableOpacity
    style={{
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: isActive ? colors.primary : colors.whiteLight,
      borderWidth: 1,
      borderColor: isActive ? '' : colors.whiteLight,
      marginRight: 8,
    }}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={{
        fontSize: 14,
        fontFamily: 'OutfitSemiBold',
        color: '#fff',
      }}
    >
      {category.label}
    </Text>
  </TouchableOpacity>
);

// ─── Answer Card ──────────────────────────────────────────────────────────────
const AnswerCard = ({ item, onRemove }) => (
  <View
    style={{
      backgroundColor: colors.whiteLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.whiteLight,
      padding: 14,
      marginBottom: 10,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8, }}>
      {/* <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MessageCircle size={13} color={colors.primary} strokeWidth={2} />
      </View> */}
      <Text
        numberOfLines={2}
        style={{
          flex: 1,
          fontSize: 12,
          fontFamily: 'OutfitSemiBold',
          color: colors.primary,
          lineHeight: 17,
        }}
      >
        {item.question}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={15} color={colors.white} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
    <Text
      style={{
        fontSize: 16,
        fontFamily: 'OutfitBold',
        color: colors.white,
        lineHeight: 22,
      }}
    >
      {item.answer}
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ProfileAnswers = () => {
  const [answers, setAnswers] = useState([]); // [{ question, answer }, ...]
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState('categories'); // 'categories' | 'answer'
  const [activeCategory, setActiveCategory] = useState(PROMPT_CATEGORIES[0].id);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });
  const router = useRouter();

  // Used questions
  const usedQuestions = answers.map((a) => a.question);

  // Filter available questions in current category
  const currentCategoryQuestions = (PROMPT_QUESTIONS[activeCategory] || []).filter(
    (q) => !usedQuestions.includes(q)
  );

  const openModal = () => {
    setSelectedQuestion(null);
    setAnswerText("");
    setActiveCategory(PROMPT_CATEGORIES[0].id);
    setModalStep('categories');
    setShowModal(true);
  };

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
    setModalStep('answer');
  };

  const handleSaveAnswer = () => {
    if (!selectedQuestion || !answerText.trim()) return;

    setAnswers((prev) => [...prev, { question: selectedQuestion, answer: answerText.trim() }]);
    setShowModal(false);
    setSelectedQuestion(null);
    setAnswerText("");
  };

  const handleRemoveAnswer = (index) => {
    setAnswers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    if (modalStep === 'answer') {
      setSelectedQuestion(null);
      setModalStep('categories');
    } else {
      setShowModal(false);
    }
  };

  const canAdd = answers.length < MAX_PROMPTS;
  const canContinue = answers.length > 0;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: "#121212"}} className="bg-[#121212]">
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <RNScrollView
          style={{flex: 1}}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View style={{flex: 1}} className="px-4">
            <View style={{flex: 1}} className="mt-8">
              <Text className="text-[25px] text-white font-OutfitBold text-app mb-2">
                Write your profile answers
              </Text>
              <Text className="text-white font-Outfit">
                Choose prompts from different categories and write your answers
              </Text>

              {/* ── Saved answers ── */}
              <View className="mt-5">
                {answers.map((item, index) => (
                  <AnswerCard
                    key={index}
                    item={item}
                    onRemove={() => handleRemoveAnswer(index)}
                  />
                ))}
              </View>

              {/* ── Add prompt button ── */}
              {canAdd && (
                <TouchableOpacity
                  onPress={openModal}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: '#121212',
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: '#374151',
                    borderStyle: 'dashed',
                    padding: 16,
                    marginTop: 4,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MessageCircle size={16} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'OutfitBold',
                        color: colors.white,
                      }}
                    >
                      Add a prompt
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Outfit',
                        color: colors.primary,
                        marginTop: 2,
                      }}
                    >
                      {MAX_PROMPTS - answers.length} of {MAX_PROMPTS} remaining
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              <View className="mt-4">
                <Info title="Pick a maximum of 3 questions for your profile" />
              </View>
            </View>

            {/* ── Continue button ── */}
            <View className="w-full items-end pb-6 mt-6 bg-[#121212]">
              <Button
                title="Continue"
                variant="primary"
                disabled={!canContinue}
                loading={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await updateProfileStep({ questions: answers });
                    router.push("/upload-photo");
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            </View>
          </View>
        </RNScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal ── */}
      <Modal visible={showModal} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#121212'}} className="bg-[#121212]">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

        <SAV style={{ flex: 1, backgroundColor: '#121212', paddingHorizontal: 20, paddingTop: 12 }}>

          {/* ── Categories & Questions Step ── */}
          {modalStep === 'categories' && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={22} color={colors.white} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontFamily: 'OutfitBold', color: colors.white }}>
                  Choose a prompt
                </Text>
                <View style={{ width: 22 }} />
              </View>

              {/* Category tabs */}
              <RNScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, marginBottom: 12 }}
              >
                {PROMPT_CATEGORIES.map((category) => (
                  <CategoryTab
                    key={category.id}
                    category={category}
                    isActive={activeCategory === category.id}
                    onPress={() => setActiveCategory(category.id)}
                  />
                ))}
              </RNScrollView>

              {/* Questions list */}
              <FlatList
                data={currentCategoryQuestions}
                keyExtractor={(q) => q}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#1E1E1E' }} />}
                ListEmptyComponent={() => (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Outfit', color: colors.white, textAlign: 'center' }}>
                      All questions in this category have been used
                    </Text>
                  </View>
                )}
                renderItem={({ item: q }) => (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 16, paddingHorizontal: 4 }}
                    onPress={() => handleSelectQuestion(q)}
                    activeOpacity={0.7}
                  >
                    {/* <MessageCircle size={16} color={colors.primary} strokeWidth={2} /> */}
                    <Text style={{ flex: 1, fontSize: 15, fontFamily: 'OutfitMedium', color: colors.white, lineHeight: 22 }}>
                      {q}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {/* ── Answer Step ── */}
          {modalStep === 'answer' && (
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <TouchableOpacity onPress={handleBack}>
                  <X size={22} color="#111" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontFamily: 'OutfitBold', color: '#E5E5E5' }}>
                  Your answer
                </Text>
                <View style={{ width: 22 }} />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <MessageCircle size={16} color={colors.primary} strokeWidth={2} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontFamily: 'OutfitSemiBold',
                    color: colors.primary,
                    lineHeight: 20,
                  }}
                >
                  {selectedQuestion}
                </Text>
              </View>

              <TextInput
                placeholder="Type your answer..."
                placeholderTextColor="#9CA3AF"
                value={answerText}
                onChangeText={setAnswerText}
                style={{
                  borderBottomWidth: 1.5,
                  borderBottomColor: '#E5E7EB',
                  fontSize: 17,
                  fontFamily: 'OutfitMedium',
                  color: '#E5E5E5',
                  paddingVertical: 12,
                  marginBottom: 6,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                multiline
                maxLength={200}
                autoFocus
              />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Outfit',
                  color: colors.white,
                  textAlign: 'right',
                  marginBottom: 20,
                }}
              >
                {answerText.length}/200
              </Text>

              <TouchableOpacity onPress={handleBack} style={{ marginBottom: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'OutfitMedium',
                    color: colors.white,
                    marginBottom: 16,
                  }}
                >
                  ← Choose a different prompt
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', marginTop: 'auto', paddingBottom: 8 }}>
                <Button
                  title="Save"
                  variant="primary"
                  onPress={handleSaveAnswer}
                  style={{ flex: 1 }}
                />
              </View>
            </KeyboardAvoidingView>
          )}
        </SAV>
        </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

export default ProfileAnswers;
