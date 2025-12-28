import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, Image } from "react-native";
import {
  ChevronRight,
  Flag,
  Globe,
  Ruler,
  Baby,
  Wine,
  Cigarette,
  PawPrint,
  Dumbbell,
  Sparkles,
  Heart,
  HeartHandshake,
  Users,
  BookOpen,
  Wallet,
  MessageCircleHeart,
  X
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NationalityModal from "../../components/modals/NationalityModal";
import ProfileDisplayZodiacModal from "../modals/ProfileZodiacDisplayModal";
import ProfileEthnicityModal from "../modals/ProfileEthnicityModal";
import ProfileReligionModal from "../modals/ProfileReligionModal";
import { Icons } from "../../constant/icons";
import { colors } from "../../constant/colors";






const MyInfo = ({ profile }) => {
  const router = useRouter();

  // local state copy
  const [profileData, setProfileData] = useState(profile || {});
  const [activeModal, setActiveModal] = useState(null);
  const [nationalityVisible, setNationalityVisible] = useState(false);
  const [zodiacVisible, setZodiacVisible] = useState(false)
  const [ethnicityVisible, setEthnicityVisible] = useState(false)
  const [religionVisible, setReligionVisible] = useState(false)

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
      icon: Flag,
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
        "I want children",
        "I don't want children",
        "I have children and want more",
        "I have children and don't want more",
      ],
    },
    {
      key: "drink",
      title: "Do you drink?",
      icon: Wine,
      type: "modal",
      options: ["Yes", "No", "Occasionally"],
    },
    {
      key: "smoke",
      title: "Do you smoke?",
      icon: Cigarette,
      type: "modal",
      options: ["Yes", "No", "Occasionally"],
    },
    {
      key: "pets",
      title: "Do you like pets?",
      icon: PawPrint,
      type: "modal",
      options: ["Yes", "No", "Love them!"],
    },
    {
      key: "workout",
      title: "Do you workout?",
      icon: Dumbbell,
      type: "modal",
      options: ["Yes, i often work out", "No, I don't work out", "Sometimes"],
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
        "never-married",
        "divorced",
        "widowed",
        "separated",
        "complicated",
      ],
    },
    {
      key: "interestedIn",
      title: "I'm interested in...",
      icon: Users,
      type: "modal",
      options: [
        "a-committed-relationship",
        "something-casual",
        "marriage",
        "finding-a-date",
        "meet-business-oriented-people",
        "i-am-not-sure",
      ],
    },
    {
      key: "financialStyle",
      title: "Financial Style",
      icon: Wallet,
      type: "modal",
      options: [
        "Frugal",
        "Moderate spender",
        "Generous",
        "Luxury lifestyle",
        "Prefer not to say",
      ],
    },
    {
      key: "loveStyle",
      title: "Love style",
      icon: Heart,
      type: "modal",
      options: [
        "Words of Affirmation",
        "Acts of Service",
        "Receiving Gifts",
        "Quality Time",
        "Physical Touch",
      ],
    },
    {
      key: "communicationStyle",
      title: "Communication style",
      icon: MessageCircleHeart,
      type: "modal",
      options: [
        "Direct and straightforward",
        "Thoughtful and reflective",
        "Deep and meaningful",
        "Humorous and lighthearted",
        "Prefer not to say",
      ],
    },
    {
      key: "sameBeliefs",
      title: "Dating someone with the same beliefs...",
      icon: HeartHandshake,
      type: "modal",
      options: ["is-very-important", "is-quite-important", "not-important"],
    },
  ];

  const handleSaveModal = (key, value) => {
    setProfileData((prev) => ({ ...prev, [key]: value }));
    setActiveModal(null);
  };

  return (
    <View className="bg-white mt-3 mx-4 p-5 rounded-2xl">
      {items.map(({ key, title, icon: Icon, screen, type, options }, index) => {
        const isLast = index === items.length - 1;
        const value = profileData?.[key];

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
              {key === "zodiac" ? (
                <Image
                  source={Icons.zodiacSign}
                  style={{ width: 22, height: 22 }}
                />
              ) : (
                <Icon size={22} color={colors.primary} />
              )}

              <View className="flex-1">
                <Text className="text-xl text-gray-900 font-GeneralSansMedium">
                  {title}
                </Text>
                {!value && (
                  <Text className="text-lg text-red-500 font-SatoshiMedium">
                    Tap to Answer
                  </Text>
                )}
                {value && (
                  <Text className="text-lg text-gray-700 font-SatoshiMedium capitalize">
                    {value}
                  </Text>
                )}
              </View>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        );
      })}

      {/* 🔹 Multiple-choice modal */}
      <Modal visible={!!activeModal} animationType="slide" transparent>
        <SafeAreaView className="flex-1 bg-white p-6">
          <View className="flex-row justify-between">
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X />
            </TouchableOpacity>

            <Text className="text-xl text-center font-SatoshiBold mb-6 ">
              {activeModal?.title}
            </Text>
            <View />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {activeModal?.options?.map((option, idx) => {
              const selected = profileData?.[activeModal.key] === option;
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
                    className={`text-xl text-center font-SatoshiMedium ${
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
      </Modal>

      {/* 🔹 Nationality Modal */}
      <NationalityModal
        visible={nationalityVisible}
        onClose={() => setNationalityVisible(false)}
        onSelect={(item) => {
          setProfileData((prev) => ({
            ...prev,
            nationality: item.key, // store key (recommended)
          }));
          setNationalityVisible(false);
        }}
      />

      <ProfileDisplayZodiacModal
        visible={zodiacVisible}
        onClose={() => setZodiacVisible(false)}
        initialSelected={profileData.zodiac}
        onSelect={(value) => {
          setProfileData((prev) => ({ ...prev, zodiac: value }));
          setZodiacVisible(false);
        }}
      />

      <ProfileEthnicityModal
        visible={ethnicityVisible}
        onClose={() => setEthnicityVisible(false)}
        initialSelected={profileData.ethnicity}
        onSelect={(value) => {
          setProfileData((prev) => ({ ...prev, ethnicity: value }));
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
          setReligionVisible(false);
        }}
      />
    </View>
  );
};

export default MyInfo;
