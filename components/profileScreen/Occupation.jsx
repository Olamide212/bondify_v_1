import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";
import OccupationModal from "../modals/ProfileOccupationModal";

const Occupation = ({ profile, onUpdateField }) => {
  const [selectedOccupation, setSelectedOccupation] = useState(profile?.occupation || null);
  const [showModal, setShowModal]                   = useState(false);

  useEffect(() => {
    setSelectedOccupation(profile?.occupation || null);
  }, [profile?.occupation]);

  return (
    <>
      <TouchableOpacity style={s.card} onPress={() => setShowModal(true)} activeOpacity={0.8}>
        <View style={s.cardLeft}>
          {/* <View style={s.iconCircle}>
            <Briefcase size={18} color={colors.primary} strokeWidth={2} />
          </View> */}
          <View style={{ flex: 1 }}>
            <Text style={s.cardValue} numberOfLines={1}>
              {selectedOccupation || "Not set"}
            </Text>
            <Text style={s.cardCta}>
              {selectedOccupation ? "Change occupation" : "Add your occupation"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <OccupationModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        initialSelected={selectedOccupation}
        onSelect={async (occupation) => {
          setSelectedOccupation(occupation);
          await onUpdateField?.("occupation", occupation);
          setShowModal(false);
        }}
      />
    </>
  );
};

export default Occupation;

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