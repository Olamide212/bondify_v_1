import { Quote } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";

const MAX_LENGTH = 100;

const Tagline = ({ profile, onUpdateField }) => {
  const [tagline, setTagline] = useState(profile?.tagline || "");
  const [isEditing, setIsEditing] = useState(false);

  // Sync local state when profile prop changes
  useEffect(() => {
    if (!isEditing) {
      setTagline(profile?.tagline || "");
    }
  }, [profile?.tagline, isEditing]);

  const handleSave = async () => {
    const trimmed = tagline.trim();
    await onUpdateField?.("tagline", trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTagline(profile?.tagline || "");
    setIsEditing(false);
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        <View style={s.header}>
          {/* <View style={s.iconWrap}>
            <Quote size={18} color={colors.primary} strokeWidth={2} />
          </View> */}
          <View style={s.headerText}>
            <Text style={s.title}>Tagline</Text>
            <Text style={s.subtitle}>A short catchy phrase about you</Text>
          </View>
        </View>

        {isEditing ? (
          <View style={s.editContainer}>
            <TextInput
              style={s.input}
              value={tagline}
              onChangeText={setTagline}
              placeholder="e.g., 'Adventure seeker & coffee lover'"
              placeholderTextColor="#9CA3AF"
              maxLength={MAX_LENGTH}
              multiline={false}
              autoFocus
            />
            <Text style={s.charCount}>{tagline.length}/{MAX_LENGTH}</Text>
            
            <View style={s.actions}>
              <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                <Text style={s.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} activeOpacity={0.7}>
            {tagline ? (
              <Text style={s.taglineText}>&quot;{tagline}&quot;</Text>
            ) : (
              <Text style={s.placeholder}>Tap to add a tagline...</Text>
            )}
            <Text style={s.editHint}>Tap to edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Tagline;

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 99,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
    marginTop: 2,
  },
  taglineText: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansSemiBold",
    color: "#111",
    fontStyle: "italic",
    lineHeight: 26,
  },
  placeholder: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansMedium",
    color: "#9CA3AF",
  },
  editHint: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#D1D5DB",
    marginTop: 4,
  },
  editContainer: {
    marginTop: 4,
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.primary,
    fontSize: 16,
    fontFamily: "PlusJakartaSansMedium",
    color: "#111",
    paddingVertical: 10,
  },
  charCount: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansSemiBold",
    color: "#6B7280",
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansSemiBold",
    color: "#fff",
  },
});
