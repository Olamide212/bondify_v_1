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

  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 pb-0 bg-white">
        <GeneralHeader
          title="Edit Profile"
          leftIcon=<ArrowLeft />
          className="bg-white"
        />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: 40,
            backgroundColor: "#f1f1f1",
          }}
        >
          <ProfilePhotoGrid photos={user.photos} />
          <Verification profile={profiles[0]} />
          <BasicInfo profile={profiles[0]} />
          <AboutMe profile={profiles[0]} />

          <Location profile={profiles[0]} />
          <Education profile={profiles[0]} />
          <School onUpdateSchool={profile} />
          <Occupation profile={profiles[0]} />

          <ProfileAnswers profile={profiles[0]} />
          <MyInfo profile={profile} onUpdateField={handleUpdateField} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ProfileDetails;
