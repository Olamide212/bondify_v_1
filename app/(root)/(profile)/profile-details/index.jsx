import React from "react";
import { ScrollView } from "react-native";
import ProfileCompletionHeader from "../../../../components/headers/UserProfileHeader";
import ProfilePhotoGrid from "../../../../components/profileScreen/ProfilePhotoGrid";
import ProfileSection from "../../../../components/profileScreen/ProfileSection";
import AnswersSection from "../../../../components/profileScreen/AnswersSection";
import InfoSection from "../../../../components/profileScreen/InfoSection";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileDetails = () => {
  const user = {
    progress: 0.98,
    photos: [
      "https://randomuser.me/api/portraits/women/44.jpg",
      "https://picsum.photos/id/1011/300/300",
      "https://picsum.photos/id/1012/300/300",
      "https://picsum.photos/id/1013/300/300",
      "https://picsum.photos/id/1014/300/300",
      "https://picsum.photos/id/1015/300/300",
    ],
    name: "Samantha, 24",
    location: "New York",
    verification: "Gold Verified",
    work: "Art Director",
    about: "👼 Hi. When a user passes on a match...",
    answers: [
      {
        prompt: "A pro and a con of dating me...",
        answer: "I’m funny but stubborn",
      },
      { prompt: "Perfect first date...", answer: "On the beach" },
    ],
    info: [
      { label: "Ethnicity", value: "Black/African Descent" },
      { label: "Height", value: "172 cm" },
      { label: "Kids", value: "Don’t have kids, Don’t want kids" },
      { label: "Education level", value: "" },
      { label: "Drinking", value: "Sometimes" },
      { label: "Smoking", value: "Non-smoker" },
      { label: "Religion", value: "" },
      { label: "Covid-19 Vaccination", value: "" },
    ],
  };

  return (
    <SafeAreaView className="flex-1 pb-0">
      <ScrollView className="flex-1 bg-gray-100 pb-0">
        <ProfileCompletionHeader progress={user.progress} />
        <ProfilePhotoGrid photos={user.photos} />
        <ProfileSection title={user.name} value={user.location} editable />
        <ProfileSection
          title="Verification"
          value={user.verification}
          editable
        />
        <ProfileSection title="Work and Education" value={user.work} editable />
        <ProfileSection title="About" value={user.about} editable />
        <AnswersSection answers={user.answers} />
        <InfoSection info={user.info} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileDetails;
