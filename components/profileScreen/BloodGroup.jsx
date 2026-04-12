import { Droplet } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";
import BloodGroupModal from "../modals/BloodGroupModal";

const BloodGroup = ({ profile, onUpdateField }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const bloodGroup = profile?.bloodGroup || null;

  const handleSelect = async (selected) => {
    setLoading(true);
    try {
      await onUpdateField?.("bloodGroup", selected);
      setShowModal(false);
    } catch (error) {
      console.error('Failed to update blood group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={s.card} onPress={() => setShowModal(true)} activeOpacity={0.8} disabled={loading}>
        <View style={s.cardLeft}>
     
            <Droplet size={18} color={"#fff"} strokeWidth={2} />
       
          <View style={{ flex: 1 }}>
            <Text style={s.cardValue} numberOfLines={1}>
              {bloodGroup || "Not set"}
            </Text>
            <Text style={s.cardCta}>
              {bloodGroup ? "Change blood group" : "Add your blood group"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <BloodGroupModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        initialSelected={bloodGroup}
        onSelect={handleSelect}
      />
    </>
  );
};

export default BloodGroup;

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
