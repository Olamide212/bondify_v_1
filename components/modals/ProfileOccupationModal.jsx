import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import BaseModal from "./BaseModal";

const occupationOptions = [
  "Software Developer",
  "Graphic Designer",
  "Teacher",
  "Doctor",
  "Engineer",
  "Lawyer",
  "Nurse",
  "Writer",
  "Entrepreneur",
  "Photographer",
  "Musician",
  "Student",
  "Fashion designer",
  "Model",
  "Makeup Artist",
  "Hair Stylist",
  "Content creator",
  "Streamer",
  "Engineers",
  "Architech",
  "Scientist",
  "Artist",
  "Chef",
  "Dancer",
  "Actor",
  "Music producer",
  "DJ",
  "Event planner",
  "Interior designer",
  "Others",
];

const OccupationModal = ({ visible, onClose, onSelect, initialSelected }) => {
  const [selectedOccupation, setSelectedOccupation] = useState(initialSelected);

  useEffect(() => {
    setSelectedOccupation(initialSelected);
  }, [initialSelected]);

  const handleSelect = (item) => {
    setSelectedOccupation(item);
    onSelect(item); // send to parent
    onClose(); // close after selection
  };

  return (
    <BaseModal
      onClose={onClose}
      visible={visible}
    fullScreen
    >
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 px-4">
              {/* Header */}
              <View className="mt-6 mb-6">
                <Text className="text-3xl font-SatoshiBold">
                  What's your occupation?
                </Text>
              </View>

              {/* Options */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  paddingBottom: 50,
                }}
              >
                {occupationOptions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleSelect(item)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedOccupation === item
                        ? "bg-primary border-primary"
                        : "bg-white border-[#D1D1D1]"
                    }`}
                  >
                    <Text
                      className={`${
                        selectedOccupation === item
                          ? "text-white"
                          : "text-gray-800"
                      } font-SatoshiMedium`}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BaseModal>
  );
};

export default OccupationModal;
