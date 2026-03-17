import { ArrowLeft, School as SchoolIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Pressable, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import BaseModal from "../modals/BaseModal";
import Button from "../ui/Button";
import { colors } from "../../constant/colors";

const School = ({ profile, onUpdateField }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [schoolName, setSchoolName]     = useState(profile?.school || "");

  useEffect(() => { setSchoolName(profile?.school || ""); }, [profile?.school]);

  const handleSave = async () => {
    await onUpdateField?.("school", schoolName);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={s.card} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <View style={s.cardLeft}>
          <View style={s.iconCircle}>
            <SchoolIcon size={18} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardValue} numberOfLines={1}>
              {schoolName.trim() || "Not set"}
            </Text>
            <Text style={s.cardCta}>
              {schoolName.trim() ? "Change school" : "Add your school"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <BaseModal visible={modalVisible} onClose={() => setModalVisible(false)} fullScreen>
        <SafeAreaProvider>
          <SafeAreaView style={s.modal}>
            <View style={s.modalHeader}>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <ArrowLeft size={22} color="#111" />
              </Pressable>
              <Text style={s.modalTitle}>School</Text>
              <View style={{ width: 22 }} />
            </View>
            <TextInput
              style={s.input}
              placeholder="Enter school name"
              placeholderTextColor="#9CA3AF"
              value={schoolName}
              onChangeText={setSchoolName}
              autoFocus
            />
            <View style={s.footer}>
              <Button title="Save" onPress={handleSave} disabled={!schoolName.trim()} />
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </BaseModal>
    </>
  );
};

export default School;

const s = StyleSheet.create({
  card: {
    backgroundColor:  "#fff",
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      "#F3F4F6",
    marginHorizontal: 16,
    padding:          16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           12,
  },
  iconCircle: {
    width:           40,
    height:          40,
    borderRadius:    99,
    backgroundColor: colors.background,
    alignItems:      "center",
    justifyContent:  "center",
  },
  cardValue: {
    fontSize:     16,
    fontFamily:   "PlusJakartaSansSemiBold",
    color:        "#111",
    marginBottom: 2,
  },
  cardCta: {
    fontSize:   13,
    fontFamily: "PlusJakartaSansMedium",
    color:      colors.primary,
  },
  modal: {
    flex:              1,
    backgroundColor:   "#fff",
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
    color:      "#111",
  },
  input: {
    borderWidth:       1,
    borderColor:       "#E5E7EB",
    borderRadius:      12,
    paddingHorizontal: 16,
    paddingVertical:   14,
    fontSize:          15,
    fontFamily:        "PlusJakartaSansMedium",
    color:             "#111",
    backgroundColor:   "#FAFAFA",
    marginBottom:      20,
  },
  footer: {
    marginTop:     "auto",
    paddingBottom: 12,
  },
});