import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import OccupationModal from "../modals/ProfileOccupationModal"; // adjust path

const Occupation = () => {
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <TouchableOpacity
        className="px-6 py-4 bg-white mx-4 rounded-2xl mt-4"
        onPress={() => setShowModal(true)}
      >
        
        <View className="mb-1">
          {selectedOccupation ? (
            <Text className="text-black text-2xl font-SatoshiMedium">
              {selectedOccupation}
            </Text>
          ) : (
            <Text className="text-gray-400  font-SatoshiMediumItalic">
              No occupation added yet
            </Text>
          )}

          <Text className="flex-1 text-lg text-primary font-SatoshiMedium mt-2">
            {selectedOccupation ? "Change occupation" : "Add My Occupation"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Fullscreen modal for selecting occupation */}
      <OccupationModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSelect={(occupation) => {
          setSelectedOccupation(occupation);
          setShowModal(false);
        }}
        initialSelected={selectedOccupation}
      />
    </>
  );
};

export default Occupation;
