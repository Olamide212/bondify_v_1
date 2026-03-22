import { MessageCircle, Plus, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  FlatList, Modal, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { PROMPT_CATEGORIES, PROMPT_QUESTIONS } from "../../data/profilePromptQuestions";
import Button from "../ui/Button";

const MAX_PROMPTS = 3;

// ─── Single answer card ───────────────────────────────────────────────────────
const PromptCard = ({ item, index, onEdit, onDelete }) => (
  <View style={s.promptCard}>
    {/* Top row: question + delete */}
    <View style={s.promptHeader}>
      <View style={s.promptIconWrap}>
        <MessageCircle size={14} color={colors.primary} strokeWidth={2} />
      </View>
      <Text style={s.promptQuestion} numberOfLines={2}>{item.question}</Text>
      <TouchableOpacity
        onPress={() => onDelete(index)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={s.deleteBtn}
      >
        <X size={16} color="#9CA3AF" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>

    {/* Answer */}
    <TouchableOpacity onPress={() => onEdit(index)} activeOpacity={0.75}>
      <Text style={s.promptAnswer}>{item.answer}</Text>
      <Text style={s.editHint}>Tap to edit</Text>
    </TouchableOpacity>
  </View>
);

// ─── Add prompt card ──────────────────────────────────────────────────────────
const AddPromptCard = ({ onPress, remaining }) => (
  <TouchableOpacity style={s.addCard} onPress={onPress} activeOpacity={0.7}>
    <View style={s.addIconWrap}>
      <Plus size={18} color={colors.primary} strokeWidth={2.5} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.addTitle}>Add a prompt</Text>
      <Text style={s.addSub}>{remaining} of {MAX_PROMPTS} remaining</Text>
    </View>
  </TouchableOpacity>
);

// ─── Category Tab ─────────────────────────────────────────────────────────────
const CategoryTab = ({ category, isActive, onPress }) => (
  <TouchableOpacity
    style={[s.categoryTab, isActive && s.categoryTabActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[s.categoryTabText, isActive && s.categoryTabTextActive]}>
      {category.label}
    </Text>
  </TouchableOpacity>
);

// ─── Main component ───────────────────────────────────────────────────────────
const ProfileAnswers = ({ profile, onUpdateField }) => {
  const [answers, setAnswers]               = useState(profile?.questions || []);
  const [showModal, setShowModal]           = useState(false);
  const [modalStep, setModalStep]           = useState('categories'); // 'categories' | 'questions' | 'answer'
  const [activeCategory, setActiveCategory] = useState(PROMPT_CATEGORIES[0].id);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer]                 = useState("");
  const [editingIndex, setEditingIndex]     = useState(null); // null = new prompt
  const tabScrollRef = useRef(null);

  useEffect(() => {
    setAnswers(Array.isArray(profile?.questions) ? profile.questions : []);
  }, [profile?.questions]);

  // ── Open modal for new prompt ─────────────────────────────────────────────
  const openAdd = () => {
    setEditingIndex(null);
    setSelectedQuestion(null);
    setAnswer("");
    setActiveCategory(PROMPT_CATEGORIES[0].id);
    setModalStep('categories');
    setShowModal(true);
  };

  // ── Open modal to edit existing ───────────────────────────────────────────
  const openEdit = (index) => {
    const item = answers[index];
    setEditingIndex(index);
    setSelectedQuestion(item.question);
    setAnswer(item.answer);
    setModalStep('answer');
    setShowModal(true);
  };

  // ── Delete a prompt card ──────────────────────────────────────────────────
  const handleDelete = (index) => {
    const updated = answers.filter((_, i) => i !== index);
    setAnswers(updated);
    onUpdateField?.("questions", updated);
  };

  // ── Select a question ─────────────────────────────────────────────────────
  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
    setModalStep('answer');
  };

  // ── Save answer ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedQuestion || !answer.trim()) return;

    let updated;
    if (editingIndex !== null) {
      updated = answers.map((item, i) =>
        i === editingIndex
          ? { question: selectedQuestion, answer: answer.trim() }
          : item
      );
    } else {
      updated = [...answers, { question: selectedQuestion, answer: answer.trim() }];
    }

    setAnswers(updated);
    await onUpdateField?.("questions", updated);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedQuestion(null);
    setAnswer("");
    setEditingIndex(null);
    setModalStep('categories');
  };

  const handleBack = () => {
    if (modalStep === 'answer' && editingIndex === null) {
      setSelectedQuestion(null);
      setModalStep('categories');
    } else {
      closeModal();
    }
  };

  // Questions already used (exclude from picker unless editing that slot)
  const usedQuestions = answers
    .map((a, i) => (i === editingIndex ? null : a.question))
    .filter(Boolean);

  const currentCategoryQuestions = (PROMPT_QUESTIONS[activeCategory] || [])
    .filter((q) => !usedQuestions.includes(q));

  const remaining = MAX_PROMPTS - answers.length;
  const canAdd    = answers.length < MAX_PROMPTS;

  return (
    <View style={s.container}>

      {/* ── Standalone prompt cards ── */}
      {answers.map((item, index) => (
        <PromptCard
          key={index}
          item={item}
          index={index}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ))}

      {/* ── Add prompt card (shown only if under limit) ── */}
      {canAdd && (
        <AddPromptCard onPress={openAdd} remaining={remaining} />
      )}

      {/* ── Modal ── */}
      <Modal visible={showModal} animationType="slide">
        <SafeAreaProvider>
          <SafeAreaView style={s.modal}>

            {/* ── Categories & Questions Step ── */}
            {(modalStep === 'categories') && (
              <>
                <View style={s.modalHeader}>
                  <TouchableOpacity onPress={closeModal}>
                    <X size={22} color="#111" />
                  </TouchableOpacity>
                  <Text style={s.modalTitle}>Choose a prompt</Text>
                  <View style={{ width: 22 }} />
                </View>

                {/* Category tabs */}
                <ScrollView
                  ref={tabScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={s.categoryTabsContainer}
                  contentContainerStyle={s.categoryTabsContent}
                >
                  {PROMPT_CATEGORIES.map((category) => (
                    <CategoryTab
                      key={category.id}
                      category={category}
                      isActive={activeCategory === category.id}
                      onPress={() => setActiveCategory(category.id)}
                    />
                  ))}
                </ScrollView>

                {/* Questions list */}
                <FlatList
                  data={currentCategoryQuestions}
                  keyExtractor={(q) => q}
                  ItemSeparatorComponent={() => <View style={s.separator} />}
                  ListEmptyComponent={() => (
                    <View style={s.emptyList}>
                      <Text style={s.emptyText}>
                        All questions in this category have been used
                      </Text>
                    </View>
                  )}
                  renderItem={({ item: q }) => (
                    <TouchableOpacity
                      style={s.questionRow}
                      onPress={() => handleSelectQuestion(q)}
                      activeOpacity={0.7}
                    >
                      <MessageCircle size={16} color={colors.primary} strokeWidth={2} />
                      <Text style={s.questionText}>{q}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {/* ── Answer Step ── */}
            {modalStep === 'answer' && (
              <>
                <View style={s.modalHeader}>
                  <TouchableOpacity onPress={handleBack}>
                    <X size={22} color="#111" />
                  </TouchableOpacity>
                  <Text style={s.modalTitle}>Your answer</Text>
                  <View style={{ width: 22 }} />
                </View>

                <View style={s.questionBubble}>
                  <MessageCircle size={16} color={colors.primary} strokeWidth={2} />
                  <Text style={s.questionBubbleText}>{selectedQuestion}</Text>
                </View>

                <TextInput
                  placeholder="Type your answer..."
                  placeholderTextColor="#9CA3AF"
                  value={answer}
                  onChangeText={setAnswer}
                  style={s.input}
                  multiline
                  maxLength={200}
                  autoFocus
                />
                <Text style={s.charCount}>{answer.length}/200</Text>

                {editingIndex === null && (
                  <TouchableOpacity
                    onPress={handleBack}
                    style={{ marginBottom: 8 }}
                  >
                    <Text style={s.changeQuestion}>← Choose a different prompt</Text>
                  </TouchableOpacity>
                )}

                <View style={s.modalActions}>
                  <Button
                    title="Save"
                    variant="primary"
                    onPress={handleSave}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
};

export default ProfileAnswers;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    gap:             12,
    paddingHorizontal: 16,
  },

  // ── Prompt card ──
  promptCard: {
    backgroundColor: '#fff',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     '#F3F4F6',
    padding:         16,
  },
  promptHeader: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            8,
    marginBottom:   10,
  },
  promptIconWrap: {
    width:           28,
    height:          28,
    borderRadius:    99,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    marginTop:       1,
  },
  promptQuestion: {
    flex:       1,
    fontSize:   13,
    fontFamily: 'PlusJakartaSansSemiBold',
    color:      colors.primary,
    lineHeight: 18,
  },
  deleteBtn: {
    marginTop: 2,
  },
  promptAnswer: {
    fontSize:   18,
    fontFamily: 'PlusJakartaSansBold',
    color:      '#111',
    lineHeight: 26,
    marginBottom: 4,
  },
  editHint: {
    fontSize:   12,
    fontFamily: 'PlusJakartaSans',
    color:      '#D1D5DB',
  },

  // ── Add card ──
  addCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    backgroundColor: '#fff',
    borderRadius:    16,
    borderWidth:     1.5,
    borderColor:     '#E5E7EB',
    borderStyle:     'dashed',
    padding:         16,
  },
  addIconWrap: {
    width:           40,
    height:          40,
    borderRadius:    99,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
  },
  addTitle: {
    fontSize:   15,
    fontFamily: 'PlusJakartaSansBold',
    color:      colors.primary,
  },
  addSub: {
    fontSize:   12,
    fontFamily: 'PlusJakartaSans',
    color:      colors.secondary,
    marginTop:  2,
  },

  // ── Modal ──
  modal: {
    flex:            1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop:      12,
  },
  modalHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   20,
  },
  modalTitle: {
    fontSize:   18,
    fontFamily: 'PlusJakartaSansBold',
    color:      '#111',
  },
  separator: {
    height:          1,
    backgroundColor: '#F3F4F6',
  },
  questionRow: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               10,
    paddingVertical:   16,
    paddingHorizontal:  4,
  },
  questionText: {
    flex:       1,
    fontSize:   15,
    fontFamily: 'PlusJakartaSansMedium',
    color:      '#111',
    lineHeight: 22,
  },

  // ── Category tabs ──
  categoryTabsContainer: {
    flexGrow:     0,
    marginBottom: 12,
  },
  categoryTabsContent: {
    paddingRight:  20,
    gap:           8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderRadius:      20,
    backgroundColor:   '#F3F4F6',
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryTabText: {
    fontSize:   14,
    fontFamily: 'PlusJakartaSansSemiBold',
    color:      '#6B7280',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  emptyList: {
    paddingVertical: 40,
    alignItems:      'center',
  },
  emptyText: {
    fontSize:   14,
    fontFamily: 'PlusJakartaSans',
    color:      '#9CA3AF',
    textAlign:  'center',
  },

  // ── Answer step ──
  questionBubble: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             8,
    backgroundColor: colors.background,
    borderRadius:    12,
    padding:         12,
    marginBottom:    16,
  },
  questionBubbleText: {
    flex:       1,
    fontSize:   14,
    fontFamily: 'PlusJakartaSansSemiBold',
    color:      colors.primary,
    lineHeight: 20,
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#E5E7EB',
    fontSize:          17,
    fontFamily:        'PlusJakartaSansMedium',
    color:             '#111',
    paddingVertical:   12,
    marginBottom:      6,
    minHeight:         80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize:     12,
    fontFamily:   'PlusJakartaSans',
    color:        '#9CA3AF',
    textAlign:    'right',
    marginBottom: 20,
  },
  changeQuestion: {
    fontSize:   14,
    fontFamily: 'PlusJakartaSansMedium',
    color:      colors.secondary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop:     'auto',
    paddingBottom: 8,
  },
});