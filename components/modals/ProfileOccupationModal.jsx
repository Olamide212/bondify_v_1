import { useEffect, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { useLookupOptions } from "../../hooks/useLookupOptions";
import BaseModal from "./BaseModal";

const OccupationModal = ({ visible, onClose, onSelect, initialSelected }) => {
  const [selectedOccupation, setSelectedOccupation] = useState(initialSelected);
  const { options: occupationOptions } = useLookupOptions("occupations");

  useEffect(() => {
    setSelectedOccupation(initialSelected);
  }, [initialSelected]);

  const handleSelect = (item) => {
    setSelectedOccupation(item.value);
    onSelect(item.value); // send to parent
    onClose(); // close after selection
  };

  return (
    <BaseModal
      onClose={onClose}
      visible={visible}

    >
      <SafeAreaView style={{flex: 1}} className="bg-white">
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{flex: 1}} className="px-4">
              {/* Header */}
              <View className="mt-6 mb-6">
                <Text className="text-3xl font-PlusJakartaSansBold">
                  What&apos;s your occupation?
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
                    key={item.value}
                    onPress={() => handleSelect(item)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedOccupation === item.value
                        ? "bg-primary border-primary"
                        : "bg-white border-[#D1D1D1]"
                    }`}
                  >
                    <Text
                      className={`${
                        selectedOccupation === item.value
                          ? "text-white"
                          : "text-gray-800"
                      } font-PlusJakartaSansMedium`}
                    >
                      {item.label}
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
