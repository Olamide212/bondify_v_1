import { FileText } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Button from "../ui/Button";
import TextHeadingOne from "../ui/TextHeadingOne";

const AboutMe = ({ profile, onUpdateField }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [bio, setBio] = useState(profile?.bio || "");
  const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      setBio(profile?.bio || "");
    }, [profile?.bio]);

    const handleSave = async () => {
      if (isSaving) return;

      try {
        setIsSaving(true);
        await onUpdateField?.("bio", bio.trim());
        setModalVisible(false);
      } catch (error) {
        console.error("Failed to save about me:", error);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <>
      <TouchableOpacity
        className="px-6 py-4 bg-white border border-gray-100 mx-4 rounded-2xl"
        onPress={() => !isSaving && setModalVisible(true)}
      >
       
        <View className=" mb-1">
          <Text className="text-black text-xl font-PlusJakartaSansMedium">
            {profile?.bio || "Tell people about yourself"}
          </Text>
          <Text className="flex-1 text-lg text-primary font-PlusJakartaSansMedium mt-2">
            {profile?.bio ? "Edit About" : "Add About"}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-gray-50 border border-gray-100 p-6">
            <Text className="text-2xl font-PlusJakartaSansMedium mb-6">About Me</Text>

            <TextInput
              className="border-b rounded-lg p-4 font-PlusJakartaSansMedium text-lg min-h-[120px]"
              placeholder="Write something about yourself"
              value={bio}
              onChangeText={setBio}
              editable={!isSaving}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text className='text-right text-gray-400 mt-4'>Maximum of 500 words</Text>

            <View className="mt-auto">
              <Button title="Save" onPress={handleSave} loading={isSaving} disabled={isSaving} />
              <Button
                className="mt-3 bg-white border border-primary"
                title="Cancel"
                variant="secondary"
                disabled={isSaving}
                onPress={() => !isSaving && setModalVisible(false)}
              />
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
      </>
    );
};

export default AboutMe;
