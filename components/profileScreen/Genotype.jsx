import { Dna } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";
import GenotypeModal from "../modals/GenotypeModal";

const Genotype = ({ profile, onUpdateField }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const genotype = profile?.genotype || null;

  const handleSelect = async (selected) => {
    setLoading(true);
    try {
      await onUpdateField?.("genotype", selected);
      setShowModal(false);
    } catch (error) {
      console.error('Failed to update genotype:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={s.card} onPress={() => setShowModal(true)} activeOpacity={0.8} disabled={loading}>
        <View style={s.cardLeft}>
  
            <Dna size={18} color={'#fff'} strokeWidth={2} />

          <View style={{ flex: 1 }}>
            <Text style={s.cardValue} numberOfLines={1}>
              {genotype || "Not set"}
            </Text>
            <Text style={s.cardCta}>
              {genotype ? "Change genotype" : "Add your genotype"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <GenotypeModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        initialSelected={genotype}
        onSelect={handleSelect}
      />
    </>
  );
};

export default Genotype;

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
