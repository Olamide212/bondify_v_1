import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { INTEREST_CATEGORIES } from "../../data/interestData";
import ModalHeader from "../headers/ModalHeader";
import BaseModal from "./BaseModal";

const InterestsModal = ({
  visible,
  onClose,
  initialSelected = [],
  highlightedInterests = [],
  onApply,
}) => {
  const [selectedInterests, setSelectedInterests] = useState(initialSelected);

  const normalizedHighlights = new Set(
    (Array.isArray(highlightedInterests) ? highlightedInterests : []).map((interest) =>
      String(interest).toLowerCase()
    )
  );

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  return (
    <BaseModal onClose={onClose} visible={visible} fullScreen>
      <View>
        <ModalHeader
          onClose={onClose}
          centerText="Interests"
          rightText="Apply"
          onRightPress={() => {
            onApply(selectedInterests);
            onClose();
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 90,
            paddingTop: 10,
            paddingHorizontal: 20,
          }}
        >
          {INTEREST_CATEGORIES.map((category) => (
            <View key={category.title} className="mb-6">
              <Text className="text-black font-PlusJakartaSansBold text-lg mb-3">
                {category.title}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {category.items.map((interest) => {
                  const selected = selectedInterests.includes(interest);
                  const isHighlighted = normalizedHighlights.has(
                    String(interest).toLowerCase()
                  );

                  const chipClassName = selected
                    ? "bg-secondary border-secondary"
                    : isHighlighted
                      ? "bg-secondary border-secondary"
                      : "bg-white border-[#D1D1D1]";

                  const textClassName = selected
                    ? "text-primary"
                    : isHighlighted
                      ? "text-primary"
                      : "text-black";

                  return (
                    <TouchableOpacity
                      key={interest}
                      onPress={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full border ${chipClassName}`}
                    >
                      <Text className={`font-PlusJakartaSansMedium text-lg ${textClassName}`}>
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </BaseModal>
  );
};

export default InterestsModal;
