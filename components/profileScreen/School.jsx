import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { ArrowLeft, GraduationCap } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../ui/Button";

const School = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [schoolName, setSchoolName] = useState("");

  const handleSave = () => {
    // Handle save logic here
    console.log("Saving school:", schoolName);
    setModalVisible(false);
    setSchoolName("");
  };

  return (
    <>
      <TouchableOpacity
        className="px-6 py-4 bg-white mx-4 rounded-2xl mt-4"
        onPress={() => setModalVisible(true)}
      >
        <View className="mb-1">
          <Text className="text-xl text-gray-900 font-GeneralSansMedium">
          School
          </Text>
          {!schoolName ? (
            <Text className="text-gray-400  font-SatoshiMediumItalic">
              No school added yet
            </Text>
          ) : (
            <Text className="text-black text-2xl font-SatoshiMedium">
              {schoolName}
            </Text>
          )}

          <Text className="flex-1 text-lg text-primary mt-2 font-SatoshiMedium">
            {schoolName ? "Change school" : "Add my school"}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white p-6">
          {/* Header */}
          <View className="flex-row  items-center mb-6">
            <Pressable onPress={() => setModalVisible(false)} className="mr-4">
              <ArrowLeft size={24} color="#000" />
            </Pressable>
            <Text className="text-2xl font-SatoshiMedium text-center">
              Add your school
            </Text>
          </View>

          {/* Input Field */}
          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-6 font-SatoshiMedium"
            placeholder="Enter school name"
            value={schoolName}
            onChangeText={setSchoolName}
            autoFocus={true}
          />

          {/* Save Button */}
          <Button title="Save" onPress={handleSave} disabled={!schoolName} />
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default School;
