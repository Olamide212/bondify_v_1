import { ArrowLeft, School as SchoolIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Button from "../ui/Button";
import TextHeadingOne from "../ui/TextHeadingOne";
import BaseModal from "../modals/BaseModal";

const School = ({ profile, onUpdateField }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [schoolName, setSchoolName] = useState(profile?.school || "");

  useEffect(() => {
    setSchoolName(profile?.school || "");
  }, [profile?.school]);

  const handleSave = async () => {
    await onUpdateField?.("school", schoolName);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        className="px-6 py-4 bg-white border border-gray-100 mx-4 rounded-2xl"
        onPress={() => setModalVisible(true)}
      >
        <View className="mb-1">
        
          {!schoolName ? (
            <Text className="text-gray-400  font-PlusJakartaSansMediumItalic">
              No school added yet
            </Text>
          ) : (
            <Text className="text-black text-2xl font-PlusJakartaSansMedium">
              {schoolName.trim() || "No school added yet"}
            </Text>
          )}

          <Text className="flex-1 text-lg text-primary mt-2 font-PlusJakartaSansMedium">
            {schoolName ? "Change school" : "Add my school"}
          </Text>
        </View>
      </TouchableOpacity>

      <BaseModal visible={modalVisible} onClose={() => setModalVisible(false)} fullScreen={true}>

        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-white p-6">
            {/* Header */}
            <View className="flex-row  items-center mb-6">
              <Pressable onPress={() => setModalVisible(false)} className="mr-4">
                <ArrowLeft size={24} color="#000" />
              </Pressable>
              <Text className="text-2xl font-PlusJakartaSansMedium text-center">
                Add your school
              </Text>
            </View>

            {/* Input Field */}
            <TextInput
              className="border border-gray-300   rounded-lg p-4 mb-6 font-PlusJakartaSansMedium"
              placeholder="Enter school name"
              value={schoolName}
              onChangeText={setSchoolName}
              autoFocus={true}

            />

            {/* Save Button */}
            <Button title="Save" onPress={handleSave} disabled={!schoolName} />
          </SafeAreaView>
        </SafeAreaProvider>

      </BaseModal>
    </>
  );
};

export default School;
