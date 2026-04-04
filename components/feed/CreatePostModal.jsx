import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { ChevronLeft, ImagePlus, Sparkles, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import feedService from "../../services/feedService";
import BaseModal from "../modals/BaseModal";

const BRAND = colors.primary;
const DEFAULT_FILENAME = "photo.jpg";
const DEFAULT_MIME_TYPE = "image/jpeg";
const MAX_MEDIA = 4;

const CreatePostModal = ({ visible, onClose, onCreated }) => {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
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
      // Play success sound
      let postSound;
      try {
        const result = await Audio.Sound.createAsync(
          require("../../assets/sounds/match.wav"),
          { volume: 0.6 }
        );
        postSound = result.sound;
        await postSound.playAsync();
        postSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) postSound.unloadAsync().catch(() => {});
        });
      } catch {
        if (postSound) postSound.unloadAsync().catch(() => {});
      }
      onCreated(res.data);
      setText("");
      setSuggestions([]);
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
      // Use current post text as the topic hint; backend falls back to profile context if empty
      const res = await feedService.suggestPost(text.trim());
      setSuggestions(res.data?.suggestions ?? []);
    } catch {
      setError("AI suggestion failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // Track keyboard height so the footer rides exactly above the keyboard
  // (more reliable than KeyboardAvoidingView inside a Modal)
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = (e) => setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);
    const sub1 = Keyboard.addListener(showEvent, onShow);
    const sub2 = Keyboard.addListener(hideEvent, onHide);
    return () => { sub1.remove(); sub2.remove(); };
  }, []);

  // Bottom offset: when keyboard is up use its height; when down use safe-area bottom
  const bottomOffset = keyboardHeight > 0 ? keyboardHeight : insets.bottom;

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <View style={[styles.container, { marginBottom: bottomOffset }]}>
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

        {/* Footer — icon toolbar sits just above the keyboard */}
        <View style={styles.footer}>
          <View style={styles.footerActions}>
            {/* Image picker */}
            <TouchableOpacity
              style={styles.footerAction}
              onPress={handlePickImage}
              disabled={mediaAssets.length >= MAX_MEDIA}
            >
              {uploadingMedia ? (
                <ActivityIndicator size="small" color={BRAND} />
              ) : (
                <>
                  <ImagePlus size={22} color={mediaAssets.length >= MAX_MEDIA ? "#CCC" : BRAND} />
                  {mediaAssets.length > 0 && (
                    <Text style={styles.mediaCount}>{mediaAssets.length}/4</Text>
                  )}
                </>
              )}
            </TouchableOpacity>

            {/* AI suggest icon */}
            <TouchableOpacity style={styles.footerAction} onPress={handleAI} disabled={aiLoading}>
              {aiLoading ? (
                <ActivityIndicator size="small" color={BRAND} />
              ) : (
                <Sparkles size={22} color={BRAND} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.charCount}>{text.length}/2000</Text>
        </View>
      </View>
    </BaseModal>
  );
};

export default CreatePostModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 17,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
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
    fontFamily: "OutfitBold",
  },
  body: {
    flex: 1,
    padding: 16,
  },
  input: {
    minHeight: 140,
    fontSize: 16,
    fontFamily: "Outfit",
    color: '#E5E5E5',
    textAlignVertical: "top",
    marginBottom: 16,
    lineHeight: 24,
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
    fontFamily: "Outfit",
    color: '#D1D5DB',
  },
  error: { color: "red", fontSize: 13, marginBottom: 8 },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
  },
  mediaCount: {
    fontSize: 12,
    fontFamily: "OutfitBold",
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
    fontFamily: "Outfit",
    textAlign: "right",
  },
});
