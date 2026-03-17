import { MessageCircle, Plus, Trash2, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  FlatList, Modal, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Button from "../ui/Button";
import { colors } from "../../constant/colors";

const MAX_PROMPTS = 3;

const QUESTIONS = [
  "What's your love language?",
  "What's your perfect first date?",
  "What's your biggest passion?",
  "What are you currently reading?",
  "What makes you laugh the most?",
  "What's your dream travel destination?",
  "What's a fun fact about you?",
  "What's your go-to comfort food?",
  "What song always lifts your mood?",
  "What's the best advice you've ever received?",
  "What's something on your bucket list?",
  "What do you value most in a relationship?",
];

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

// ─── Main component ───────────────────────────────────────────────────────────
const ProfileAnswers = ({ profile, onUpdateField }) => {
  const [answers, setAnswers]               = useState(profile?.questions || []);
  const [showModal, setShowModal]           = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer]                 = useState("");
  const [editingIndex, setEditingIndex]     = useState(null); // null = new prompt

  useEffect(() => {
    setAnswers(Array.isArray(profile?.questions) ? profile.questions : []);
  }, [profile?.questions]);

  // ── Open modal for new prompt ─────────────────────────────────────────────
  const openAdd = () => {
    setEditingIndex(null);
    setSelectedQuestion(null);
    setAnswer("");
    setShowModal(true);
  };

  // ── Open modal to edit existing ───────────────────────────────────────────
  const openEdit = (index) => {
    const item = answers[index];
    setEditingIndex(index);
    setSelectedQuestion(item.question);
    setAnswer(item.answer);
    setShowModal(true);
  };

  // ── Delete a prompt card ──────────────────────────────────────────────────
  const handleDelete = (index) => {
    const updated = answers.filter((_, i) => i !== index);
    setAnswers(updated);
    onUpdateField?.("questions", updated);
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
  };

  // Questions already used (exclude from picker unless editing that slot)
  const usedQuestions = answers
    .map((a, i) => (i === editingIndex ? null : a.question))
    .filter(Boolean);

  const availableQuestions = QUESTIONS.filter((q) => !usedQuestions.includes(q));
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

      {answers.length === 0 && !canAdd && null /* safety */}

      {/* ── Modal ── */}
      <Modal visible={showModal} animationType="slide">
        <SafeAreaProvider>
          <SafeAreaView style={s.modal}>

            {/* ── Step 1: pick a question ── */}
            {!selectedQuestion ? (
              <>
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle}>Choose a prompt</Text>
                  <TouchableOpacity onPress={closeModal}>
                    <X size={22} color="#111" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={availableQuestions}
                  keyExtractor={(q) => q}
                  ItemSeparatorComponent={() => <View style={s.separator} />}
                  renderItem={({ item: q }) => (
                    <TouchableOpacity
                      style={s.questionRow}
                      onPress={() => setSelectedQuestion(q)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.questionText}>{q}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : (
              /* ── Step 2: write answer ── */
              <>
                <View style={s.modalHeader}>
                  <TouchableOpacity onPress={() => editingIndex === null ? setSelectedQuestion(null) : closeModal()}>
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
                />
                <Text style={s.charCount}>{answer.length}/200</Text>

                {editingIndex === null && (
                  <TouchableOpacity
                    onPress={() => setSelectedQuestion(null)}
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
                  {/* <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={closeModal}
                    style={{ flex: 1, marginLeft: 12 }}
                  /> */}
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
    paddingVertical:   16,
    paddingHorizontal:  4,
  },
  questionText: {
    fontSize:   16,
    fontFamily: 'PlusJakartaSansMedium',
    color:      '#111',
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