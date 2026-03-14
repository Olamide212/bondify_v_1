import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChevronLeft, Sparkles } from "lucide-react-native";
import React, { useState } from "react";
import { colors } from "../../constant/colors";
import feedService from "../../services/feedService";
import BaseModal from "../modals/BaseModal";

const BRAND = colors.primary;

const CreatePostModal = ({ visible, onClose, onCreated }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await feedService.createPost({ content: text.trim() });
      onCreated(res.data);
      setText("");
      setSuggestions([]);
      setAiContext("");
      onClose();
    } catch {
      setError("Failed to post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAI = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const res = await feedService.suggestPost(aiContext);
      setSuggestions(res.data?.suggestions ?? []);
    } catch {
      setError("AI suggestion failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Post</Text>
          <TouchableOpacity
            style={[styles.postBtn, (!text.trim() || loading) && styles.postBtnDisabled]}
            onPress={handleCreate}
            disabled={!text.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor="#BBB"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
            autoFocus
          />

          {/* AI context input */}
          <View style={styles.aiRow}>
            <TextInput
              style={styles.aiInput}
              placeholder="AI topic hint (optional)…"
              placeholderTextColor="#CCC"
              value={aiContext}
              onChangeText={setAiContext}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.aiBtn} onPress={handleAI} disabled={aiLoading}>
              {aiLoading ? (
                <ActivityIndicator size="small" color={BRAND} />
              ) : (
                <>
                  <Sparkles size={15} color={BRAND} />
                  <Text style={styles.aiBtnText}> AI</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* AI suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.chip} onPress={() => setText(s)}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.charCount}>{text.length}/2000</Text>
        </View>
      </KeyboardAvoidingView>
    </BaseModal>
  );
};

export default CreatePostModal;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: 17,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  postBtn: {
    backgroundColor: colors.primary,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  postBtnDisabled: { opacity: 0.45 },
  postBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
  },
  body: {
    flex: 1,
    padding: 16,
  },
  input: {
    minHeight: 140,
    fontSize: 16,
    fontFamily: "PlusJakartaSans",
    color: "#111",
    textAlignVertical: "top",
    marginBottom: 16,
    lineHeight: 24,
  },
  aiRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  aiInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 9,
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#333",
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  aiBtnText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
    color: colors.primary,
  },
  suggestions: { gap: 6, marginBottom: 10 },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryLight,
    padding: 10,
  },
  chipText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#333",
  },
  error: { color: "red", fontSize: 13, marginBottom: 8 },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  charCount: {
    fontSize: 12,
    color: "#CCC",
    fontFamily: "PlusJakartaSans",
    textAlign: "right",
  },
});
