import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { GraduationCap } from "lucide-react-native";
import ProfileEducationModal from "../modals/ProfileEducationModal";

const Education = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState(null);

  const handleSelectEducation = (value) => {
    setSelectedEducation(value);
  };

  const getEducationLabel = (value) => {
    const educationOptions = [
      { label: "High School", value: "high_school" },
      { label: "Associate Degree", value: "associate" },
      { label: "Bachelor's Degree", value: "bachelor" },
      { label: "Master's Degree", value: "master" },
      { label: "Doctorate / PhD", value: "phd" },
      { label: "Trade / Technical", value: "trade" },
      { label: "Other", value: "other" },
    ];

    const option = educationOptions.find((opt) => opt.value === value);
    return option ? option.label : "Add My Education";
  };

  return (
    <>
      <TouchableOpacity
        className="px-6 py-4 bg-white mx-4 rounded-2xl mt-4"
        onPress={() => setModalVisible(true)}
      >
        <Text className="mb-2 font-GeneralSansMedium text-lg text-black">
          Education Level
        </Text>
        <View className="mb-1">
          {selectedEducation ? (
            <Text className="text-black text-2xl font-SatoshiMedium">
              {getEducationLabel(selectedEducation)}
            </Text>
          ) : (
            <Text className="text-gray-400  font-SatoshiMediumItalic">
              No education added yet
            </Text>
          )}

          <Text className="flex-1 text-lg text-primary font-SatoshiMedium mt-2">
            {selectedEducation ? "Change Education" : "Add My Education"}
          </Text>
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
