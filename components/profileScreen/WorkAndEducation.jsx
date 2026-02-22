import { GraduationCap } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useLookupOptions } from "../../hooks/useLookupOptions";
import ProfileEducationModal from "../modals/ProfileEducationModal";
import TextHeadingOne from "../ui/TextHeadingOne";

const Education = ({ profile, onUpdateField }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState(
    profile?.education || null
  );
  const { options: educationOptions } = useLookupOptions("education");

  useEffect(() => {
    setSelectedEducation(profile?.education || null);
  }, [profile?.education]);

  const handleSelectEducation = async (value) => {
    setSelectedEducation(value);
    await onUpdateField?.("education", value);
  };

  const educationLabel = useMemo(() => {
    if (!selectedEducation) return "Add My Education";

    const option = educationOptions.find((opt) => opt.value === selectedEducation);
    if (option?.label) return option.label;

    return selectedEducation
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [educationOptions, selectedEducation]);

  return (
    <>
      <TouchableOpacity
        className="px-6 py-4 bg-gray-50 border border-gray-100 mx-4 rounded-2xl"
        onPress={() => setModalVisible(true)}
      >
       <TextHeadingOne name="Education Level" icon={GraduationCap} />
        <View className="mb-1">
          {selectedEducation ? (
            <Text className="text-black text-2xl font-SatoshiMedium">
              {educationLabel}
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
