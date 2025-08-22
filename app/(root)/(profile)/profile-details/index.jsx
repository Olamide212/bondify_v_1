import React, { useState } from "react";
import { ScrollView } from "react-native";
import ProfilePhotoGrid from "../../../../components/profileScreen/ProfilePhotoGrid";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import { ArrowLeft } from "lucide-react-native";
import BasicInfo from "../../../../components/profileScreen/BasicInfo";
import { profiles } from "../../../../data/profileData";
import Verification from "../../../../components/profileScreen/Verification";
import Location from "../../../../components/profileScreen/Location";
import Education from "../../../../components/profileScreen/WorkAndEducation";
import Occupation from "../../../../components/profileScreen/Occupation";
import School from "../../../../components/profileScreen/School";
import AboutMe from "../../../../components/profileScreen/About";
import ProfileAnswers from "../../../../components/profileScreen/ProfileAnswers";
import MyInfo from "../../../../components/profileScreen/MyInfo";
import { useFocusEffect, useLocalSearchParams } from "expo-router";

const ProfileDetails = () => {
  const [profile, setProfile] = useState({});
  const params = useLocalSearchParams();


  useFocusEffect(
    React.useCallback(() => {
      if (params.updatedField && params.updatedValue) {
        setProfile((prev) => ({
          ...prev,
          [params.updatedField]: params.updatedValue,
        }));

        // Clear the params after updating
        router.setParams({
          updatedField: undefined,
          updatedValue: undefined,
        });
      }
    }, [params])
  );


  const handleUpdateField = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };



  const user = {
    progress: 0.98,
    photos: [
      "https://randomuser.me/api/portraits/women/44.jpg",
      "https://picsum.photos/id/1011/300/300",
      "https://picsum.photos/id/1012/300/300",
      "https://picsum.photos/id/1013/300/300",
      "https://picsum.photos/id/1014/300/300",
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
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 pb-0 bg-white">
        <GeneralHeader
          title="Edit Profile"
          leftIcon=<ArrowLeft />
          className="bg-white"
        />
        <ScrollView className="flex-1 pb-0 bg-gray-100">
          <ProfilePhotoGrid photos={user.photos} />
          <Verification profile={profiles[0]} />
          <BasicInfo profile={profiles[0]} />
          <AboutMe profile={profiles[0]} />

          <Location profile={profiles[0]} />
          <Education profile={profiles[0]} />
          <School profile={profiles[0]} />
          <Occupation profile={profiles[0]} />

          <ProfileAnswers profile={profiles[0]} />
          <MyInfo profile={profile} onUpdateField={handleUpdateField} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ProfileDetails;
