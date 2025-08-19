import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import BaseModal from "./BaseModal";
import { INTEREST_CATEGORIES } from "../../data/interestData";
import ModalHeader from "../headers/ModalHeader";

const InterestsModal = ({
  visible,
  onClose,
  initialSelected = [],
  onApply,
}) => {
  const [selectedInterests, setSelectedInterests] = useState(initialSelected);

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  return (
    <BaseModal onClose={onClose} visible={visible}>
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
              <Text className="text-app font-SatoshiBold text-lg mb-3">
                {category.title}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {category.items.map((interest) => {
                  const selected = selectedInterests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={interest}
                      onPress={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full border ${
                        selected
                          ? "bg-[#FF0066] border-[#FF0066]"
                          : "bg-white border-[#D1D1D1]"
                      }`}
                    >
                      <Text
                        className={`font-SatoshiMedium ${
                          selected ? "text-white" : "text-app"
                        }`}
                      >
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
