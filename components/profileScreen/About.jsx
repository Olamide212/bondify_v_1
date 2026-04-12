import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Modal, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import Button from "../ui/Button";

const MAX_CHARS = 500;

const AboutMe = ({ profile, onUpdateField }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [bio, setBio]                   = useState(profile?.bio || "");
  const [isSaving, setIsSaving]         = useState(false);

  useEffect(() => { setBio(profile?.bio || ""); }, [profile?.bio]);

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      await onUpdateField?.("bio", bio.trim());
      setModalVisible(false);
    } catch (e) {
      console.error("Failed to save bio:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const charsLeft = MAX_CHARS - bio.length;

  return (
    <>
      {/* ── Trigger card ── */}
      <TouchableOpacity
        style={s.card}
        onPress={() => !isSaving && setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={s.cardLeft}>
          {/* <View style={s.iconCircle}>
            <FileText size={18} color={colors.primary} strokeWidth={2} />
          </View> */}
          <View style={{ flex: 1 }}>
            <Text style={s.cardValue} numberOfLines={2}>
              {profile?.bio?.trim() || "Not set"}
            </Text>
            <Text style={s.cardCta}>
              {profile?.bio ? "Edit bio" : "Add your bio"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Modal ── */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaProvider>
          <SafeAreaView style={s.modal}>

            {/* Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>About Me</Text>
              <TouchableOpacity
                onPress={() => !isSaving && setModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={22} color="#111" />
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                placeholder="Write something about yourself…"
                placeholderTextColor="#9CA3AF"
                value={bio}
                onChangeText={(t) => t.length <= MAX_CHARS && setBio(t)}
                editable={!isSaving}
                multiline
                textAlignVertical="top"
                maxLength={MAX_CHARS}
                autoFocus
              />
              {/* Character count */}
              <Text style={[s.charCount, charsLeft < 50 && s.charCountWarn]}>
                {charsLeft} characters remaining
              </Text>
            </View>

            {/* Save */}
            <View style={s.footer}>
              <Button
                title="Save"
                onPress={handleSave}
                loading={isSaving}
                disabled={isSaving || !bio.trim()}
              />
            </View>

          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
};

export default AboutMe;

const s = StyleSheet.create({
  // ── Card ──
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius:     12,
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    padding:          16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems:    "flex-start",   // top-align so multi-line bio looks right
    gap:           12,
  },
  iconCircle: {
    width:           40,
    height:          40,
    borderRadius:    99,
    backgroundColor: colors.background,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },
  cardValue: {
    fontSize:     15,
    fontFamily:   "PlusJakartaSansMedium",
    color: '#D1D5DB',
    lineHeight:   22,
    marginBottom: 4,
  },
  cardCta: {
    fontSize:   13,
    fontFamily: "PlusJakartaSansMedium",
    color:      colors.primary,
  },

  // ── Modal ──
  modal: {
    flex:              1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop:        12,
  },
  modalHeader: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    marginBottom:   24,
  },
  modalTitle: {
    fontSize:   18,
    fontFamily: "PlusJakartaSansBold",
    color: '#E5E5E5',
  },
  inputWrap: {
    borderWidth:     1,
    borderColor: '#374151',
    borderRadius:    14,
    backgroundColor: '#1E1E1E',
    padding:         16,
  },
  input: {
    fontSize:   15,
    fontFamily: "PlusJakartaSansMedium",
    color: '#E5E5E5',
    minHeight:  140,
    lineHeight: 24,
  },
  charCount: {
    fontSize:   12,
    fontFamily: "PlusJakartaSans",
    color:      "#9CA3AF",
    textAlign:  "right",
    marginTop:  8,
  },
  charCountWarn: {
    color: "#EF4444",
  },
  footer: {
    marginTop:     "auto",
    paddingBottom: 12,
  },
});