import { useRouter } from "expo-router";
import {
  Baby,
  BookOpen,
  ChevronRight,
  Cigarette,
  Dumbbell,
  Flag,
  Globe,
  Heart,
  HeartHandshake,
  MessageCircleHeart,
  PawPrint,
  Ruler,
  Sparkles,
  Users,
  Wallet,
  Wine,
  X
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import NationalityModal from "../../components/modals/NationalityModal";
import { useLookupOptions } from "../../hooks/useLookupOptions";
import BaseModal from "../modals/BaseModal";
import ProfileEthnicityModal from "../modals/ProfileEthnicityModal";
import ProfileReligionModal from "../modals/ProfileReligionModal";
import ProfileDisplayZodiacModal from "../modals/ProfileZodiacDisplayModal";
import TextHeadingOne from "../ui/TextHeadingOne";






const MyInfo = ({ profile, onUpdateField }) => {
  const router = useRouter();

  // local state copy
  const [profileData, setProfileData] = useState(profile || {});
  const [activeModal, setActiveModal] = useState(null);
  const [nationalityVisible, setNationalityVisible] = useState(false);
  const [zodiacVisible, setZodiacVisible] = useState(false)
  const [ethnicityVisible, setEthnicityVisible] = useState(false)
  const [religionVisible, setReligionVisible] = useState(false)
  const { options: sameBeliefsOptions } = useLookupOptions("same-beliefs");

  useEffect(() => {
    setProfileData(profile || {});
  }, [profile]);

  const fieldMap = {
    zodiac: "zodiacSign",
    kids: "children",
    drink: "drinking",
    smoke: "smoking",
    workout: "exercise",
    relationshipStatus: "relationshipType",
    interestedIn: "lookingFor",
    loveStyle: "loveLanguage",
    sameBeliefs: "religionImportance",
  };

  const items = [
    {
      key: "nationality",
      title: "Nationality",
      icon: Flag,
      type: "modal",
    },
    {
      key: "zodiac",
      title: "Zodiac Sign",
      icon: Sparkles,
      type: "modal",
    },
    {
      key: "ethnicity",
      title: "Ethnicity",
      icon: Globe,
      type: "modal",
    },
    {
      key: "height",
      title: "Height",
      icon: Ruler,
      type: "modal",
      options: ["4'5 - 5'0", "5'1 - 5'5", "5'6 - 6'0", "6'1 and above"],
    },
    {
      key: "kids",
      title: "Kids",
      icon: Baby,
      type: "modal",
      options: [
        "I want kids",
        "I don't want kids",
        "I am open to kids",
        "I have kids",
        "I prefer not to say",
      ],
    },
    {
      key: "drink",
      title: "Do you drink?",
      icon: Wine,
      type: "modal",
      options: ["No, I don't drink", "Rarely", "Socially", "Regularly", "Prefer not to say"],
    },
    {
      key: "smoke",
      title: "Do you smoke?",
      icon: Cigarette,
      type: "modal",
      options: ["No, I don't smoke", "Socially", "Occasionally", "Regularly", "Prefer not to say"],
    },
    {
      key: "pets",
      title: "Do you like pets?",
      icon: PawPrint,
      type: "modal",
      options: [
        "have-pets",
        "want-pets",
        "dont-want-pets",
        "allergic",
        "prefer-not-to-say",
      ],
    },
    {
      key: "workout",
      title: "Do you workout?",
      icon: Dumbbell,
      type: "modal",
      options: ["never", "rarely", "sometimes", "often", "daily"],
    },
    {
      key: "interests",
      title: "Interests",
      icon: Sparkles,
      screen: "InterestsScreen",
      type: "screen",
    },
    {
      key: "religion",
      title: "Religion",
      icon: BookOpen,
      type: "modal",
    },
    {
      key: "relationshipStatus",
      title: "Relationship Status",
      icon: Heart,
      type: "modal",
      options: [
        "Never married",
        "Divorced",
        "Widowed",
        "Separated",
        "Annulled",
      ],
    },
    {
      key: "interestedIn",
      title: "I'm interested in...",
      icon: Users,
      type: "modal",
      options: [
        "Long term",
        "Something Casual",
        "Short term",
        "Meet business oriented people",
        "I am not sure",
        "A Committed relationship",
      ],
    },
    {
      key: "financialStyle",
      title: "Financial Style",
      icon: Wallet,
      type: "modal",
      options: [
        "spender",
        "saver",
        "investor",
        "balanced",
        "prefer-not-to-say",
      ],
    },
    {
      key: "loveStyle",
      title: "Love style",
      icon: Heart,
      type: "modal",
      options: [
        "words-of-affirmation",
        "acts-of-service",
        "receiving-gifts",
        "quality-time",
        "physical-touch",
      ],
    },
    {
      key: "communicationStyle",
      title: "Communication style",
      icon: MessageCircleHeart,
      type: "modal",
      options: [
        "direct",
        "thoughtful",
        "emotional",
        "logical",
        "balanced",
      ],
    },
    {
      key: "sameBeliefs",
      title: "Dating someone with the same beliefs...",
      icon: HeartHandshake,
      type: "modal",
      options: sameBeliefsOptions.map((option) => option.value),
    },
  ];

  const handleSaveModal = (key, value) => {
    const targetField = fieldMap[key] || key;
    setProfileData((prev) => ({ ...prev, [targetField]: value }));
    onUpdateField?.(targetField, value);
    setActiveModal(null);
  };

  return (
    <View className="bg-white border border-gray-100  mx-4 p-5 rounded-2xl">
      {items.map(({ key, title, icon: Icon, screen, type, options }, index) => {
        const isLast = index === items.length - 1;
        const targetField = fieldMap[key] || key;
        const value = profileData?.[targetField];
        const displayValue = Array.isArray(value) ? value.join(", ") : value;

        return (
          <TouchableOpacity
            key={index}
            className={`flex-row items-center justify-between py-4 ${
              !isLast ? "border-b border-gray-200" : ""
            }`}
            onPress={() => {
              if (key === "nationality") {
                // 👇 open modal instead of pushing a new screen
                setNationalityVisible(true);
              } else if (type === "screen") {
                router.push({
                  pathname: screen,
                  params: { fieldKey: key, currentValue: value },
                });
              } else if (key === "zodiac") {
                setZodiacVisible(true);
              } else if (key === "ethnicity") {
                setEthnicityVisible(true);
              } else if (key === "religion") {
                setReligionVisible(true);
              } else {
                setActiveModal({ key, title, options });
              }
            }}
          >
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                <Icon size={20} color="#fff" />
              </View>

              <View className="flex-1">
                <Text className="text-xl text-gray-900 font-PlusJakartaSansMedium">
                  {title}
                </Text>
                {!value && (
                  <Text className="text-lg text-red-500 font-PlusJakartaSansMedium">
                    Tap to Answer
                  </Text>
                )}
                {value && (
                  <Text className="text-lg text-gray-700 font-PlusJakartaSansMedium capitalize">
                    {displayValue}
                  </Text>
                )}
              </View>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        );
      })}

      {/* 🔹 Multiple-choice modal */}
      <BaseModal visible={!!activeModal} onClose={() => setActiveModal(null)} fullScreen>
    
        <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white p-6">
          <View className="flex-row justify-between">
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X />
            </TouchableOpacity>

            <Text className="text-xl text-center font-PlusJakartaSansBold mb-6 ">
              {activeModal?.title}
            </Text>
            <View />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {activeModal?.options?.map((option, idx) => {
              const modalField = fieldMap[activeModal?.key] || activeModal?.key;
              const selected = profileData?.[modalField] === option;
              return (
                <TouchableOpacity
                  key={idx}
                  className={`py-4 px-6 rounded-full mb-3 border text-center ${
                    selected
                      ? "bg-primary border-primary"
                      : "bg-gray-100 border-gray-200"
                  }`}
                  onPress={() => handleSaveModal(activeModal.key, option)}
                >
                  <Text
                    className={`text-xl text-center font-PlusJakartaSansMedium ${
                      selected ? "text-white" : "text-black"
                    }`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
        </SafeAreaProvider>
  
      </BaseModal>

      {/* 🔹 Nationality Modal */}
      <NationalityModal
        visible={nationalityVisible}
        onClose={() => setNationalityVisible(false)}
        onSelect={(item) => {
          setProfileData((prev) => ({
            ...prev,
            nationality: item.key,
          }));
          onUpdateField?.("nationality", item.key);
          setNationalityVisible(false);
        }}
      />

      <ProfileDisplayZodiacModal
        visible={zodiacVisible}
        onClose={() => setZodiacVisible(false)}
        initialSelected={profileData.zodiacSign}
        onSelect={(value) => {
          setProfileData((prev) => ({ ...prev, zodiacSign: value }));
          onUpdateField?.("zodiacSign", value);
          setZodiacVisible(false);
        }}
      />

      <ProfileEthnicityModal
        visible={ethnicityVisible}
        onClose={() => setEthnicityVisible(false)}
        initialSelected={profileData.ethnicity}
        onSelect={(value) => {
          setProfileData((prev) => ({ ...prev, ethnicity: value }));
          onUpdateField?.("ethnicity", value);
          setEthnicityVisible(false);
        }}
      />

      <ProfileReligionModal
        visible={religionVisible}
        onClose={() => setReligionVisible(false)}
        initialSelected={profileData.religion}
        onSelect={(value) => {
          setProfileData((prev) => ({
            ...prev,
            religion: value,
          }));
          onUpdateField?.("religion", value);
          setReligionVisible(false);
        }}
      />
    </View>
  );
};

export default MyInfo;
