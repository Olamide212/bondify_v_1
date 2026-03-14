import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ChevronLeft, ImagePlus, Sparkles, X } from "lucide-react-native";
import React, { useState } from "react";
import { colors } from "../../constant/colors";
import feedService from "../../services/feedService";
import BaseModal from "../modals/BaseModal";

const BRAND = colors.primary;
const DEFAULT_FILENAME = "photo.jpg";
const DEFAULT_MIME_TYPE = "image/jpeg";
const MAX_MEDIA = 4;

const CreatePostModal = ({ visible, onClose, onCreated }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_MEDIA,
    });
    if (result.canceled) return;
    setMediaAssets((prev) => {
      const combined = [...prev, ...result.assets];
      return combined.slice(0, MAX_MEDIA);
    });
  };

  const handleRemoveMedia = (index) => {
    setMediaAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!text.trim() && mediaAssets.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      let mediaUrls = [];
      if (mediaAssets.length > 0) {
        setUploadingMedia(true);
        try {
          const uploadRes = await feedService.uploadPostMedia(
            mediaAssets.map((a) => ({
              uri: a.uri,
              fileName: a.uri.split("/").pop() || DEFAULT_FILENAME,
              type: a.mimeType || DEFAULT_MIME_TYPE,
            }))
          );
          mediaUrls = (uploadRes?.data ?? uploadRes ?? []).map((u) => u.url ?? u);
        } catch {
          setError("Photo upload failed. Please try again.");
          return;
        } finally {
          setUploadingMedia(false);
        }
      }
      const res = await feedService.createPost({ content: text.trim(), mediaUrls });
      onCreated(res.data);
      setText("");
      setSuggestions([]);
      setAiContext("");
      setMediaAssets([]);
      onClose();
    } catch {
      setError("Failed to create post. Please try again.");
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
            style={[styles.postBtn, ((!text.trim() && mediaAssets.length === 0) || loading) && styles.postBtnDisabled]}
            onPress={handleCreate}
            disabled={(!text.trim() && mediaAssets.length === 0) || loading}
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

          {/* Selected media preview */}
          {mediaAssets.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewRow}>
              {mediaAssets.map((asset, i) => (
                <View key={i} style={styles.mediaThumbWrap}>
                  <Image source={{ uri: asset.uri }} style={styles.mediaThumb} />
                  <TouchableOpacity style={styles.mediaRemoveBtn} onPress={() => handleRemoveMedia(i)}>
                    <X size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

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
          <TouchableOpacity
            style={styles.mediaPickerBtn}
            onPress={handlePickImage}
            disabled={mediaAssets.length >= MAX_MEDIA}
          >
            {uploadingMedia ? (
              <ActivityIndicator size="small" color={BRAND} />
            ) : (
              <>
                <ImagePlus size={20} color={mediaAssets.length >= MAX_MEDIA ? "#CCC" : BRAND} />
                {mediaAssets.length > 0 && (
                  <Text style={styles.mediaCount}>{mediaAssets.length}/4</Text>
                )}
              </>
            )}
          </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mediaPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 4,
  },
  mediaCount: {
    fontSize: 12,
    fontFamily: "PlusJakartaSansBold",
    color: colors.primary,
  },
  mediaPreviewRow: {
    marginBottom: 12,
  },
  mediaThumbWrap: {
    marginRight: 8,
    position: "relative",
  },
  mediaThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  mediaRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  charCount: {
    fontSize: 12,
    color: "#CCC",
    fontFamily: "PlusJakartaSans",
    textAlign: "right",
  },
});
