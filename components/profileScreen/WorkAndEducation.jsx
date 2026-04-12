import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";
import { useLookupOptions } from "../../hooks/useLookupOptions";
import ProfileEducationModal from "../modals/ProfileEducationModal";

const Education = ({ profile, onUpdateField }) => {
  const [modalVisible, setModalVisible]         = useState(false);
  const [selectedEducation, setSelectedEducation] = useState(profile?.education || null);
  const { options: educationOptions }            = useLookupOptions("education");

  useEffect(() => {
    setSelectedEducation(profile?.education || null);
  }, [profile?.education]);

  const handleSelectEducation = async (value) => {
    setSelectedEducation(value);
    await onUpdateField?.("education", value);
  };

  const educationLabel = useMemo(() => {
    if (!selectedEducation) return null;
    const option = educationOptions.find((o) => o.value === selectedEducation);
    if (option?.label) return option.label;
    return selectedEducation
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, [educationOptions, selectedEducation]);

  return (
    <>
      <TouchableOpacity style={s.card} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <View style={s.cardLeft}>
          {/* <View style={s.iconCircle}>
            <GraduationCap size={18} color={colors.primary} strokeWidth={2} />
          </View> */}
          <View style={{ flex: 1 }}>
            <Text style={s.cardValue} numberOfLines={1}>
              {educationLabel || "Not set"}
            </Text>
            <Text style={s.cardCta}>
              {educationLabel ? "Change education" : "Add your education"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <ProfileEducationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialSelected={selectedEducation}
        onSelect={handleSelectEducation}
      />
    </>
  );
};

export default Education;

const s = StyleSheet.create({
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
    color: '#E5E5E5',
    marginBottom: 2,
  },
  cardCta: {
    fontSize:   13,
    fontFamily: "PlusJakartaSansMedium",
    color:      colors.primary,
  },
});