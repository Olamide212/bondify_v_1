/**
 * EditSocialProfileModal.jsx
 *
 * Modal to edit the user's social / feed profile:
 *  • Display Name
 *  • Username
 *  • Bio
 */

import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import { useAlert } from "../../context/AlertContext";
import bondupService from "../../services/bondupService";
import BaseModal from "../modals/BaseModal";

const BRAND = colors.primary;

export default function EditSocialProfileModal({ visible, onClose, initialData, onSaved }) {
  const { showAlert } = useAlert();
  const [displayName, setDisplayName] = useState("");
  const [userName, setUserName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync when modal opens
  useEffect(() => {
    if (visible && initialData) {
      setDisplayName(initialData.displayName || "");
      setUserName(initialData.userName || "");
      setBio(initialData.bio || "");
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      showAlert({
        icon: 'warning',
        title: 'Name required',
        message: 'Please enter your display name.',
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        displayName: displayName.trim(),
        userName: userName.trim(),
        bio: bio.trim(),
      };
      await bondupService.updateSocialProfile(payload);
      onSaved?.(payload);
      onClose();
    } catch (e) {
      showAlert({
        icon: 'error',
        title: 'Error',
        message: e?.response?.data?.message ?? 'Could not save profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ width: "100%" }}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Edit Social Profile</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <X size={22} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={s.body}>
          {/* Display Name */}
          <Text style={s.label}>Display Name</Text>
          <TextInput
            style={s.input}
            placeholder="Your display name"
            placeholderTextColor="#BBB"
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={50}
            autoCapitalize="words"
          />

          {/* Username */}
          <Text style={s.label}>Username</Text>
          <TextInput
            style={s.input}
            placeholder="@username"
            placeholderTextColor="#BBB"
            value={userName}
            onChangeText={setUserName}
            maxLength={30}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Bio */}
          <Text style={s.label}>Bio</Text>
          <TextInput
            style={[s.input, s.bioInput]}
            placeholder="Tell people a little about yourself…"
            placeholderTextColor="#BBB"
            value={bio}
            onChangeText={setBio}
            maxLength={200}
            multiline
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{bio.length}/200</Text>

          {/* Save button */}
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </BaseModal>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  body: {
    padding: 16,
    paddingBottom: 30,
  },
  label: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
    color: "#555",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    color: "#111",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bioInput: {
    minHeight: 90,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans",
    color: "#BBB",
    textAlign: "right",
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
  },
});
