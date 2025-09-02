import { View, Text } from 'react-native'
import React from 'react'
import BasicInfo from '../../../../components/profileScreen/BasicInfo'
import ProfileSection from '../../../../components/profileScreen/ProfileSection'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import GeneralHeader from '../../../../components/headers/GeneralHeader'
import { profiles } from '../../../../data/profileData'
import { Bolt } from 'lucide-react-native';
import SubscriptionBannerSlider from '../../../../components/profileScreen/SubscriptionBannerSlider'
import InfoSection from '../../../../components/profileScreen/InfoSection'
import Perks from '../../../../components/profileScreen/BoostAndChat'
import { ScrollView } from 'react-native-gesture-handler'
import { useRouter } from 'expo-router'


const ProfileScreen = () => {
const router = useRouter()


  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-[#fff] ">
        <GeneralHeader
          title="Profile"
          icon=<Bolt color="#4B164C" />
          className="text-black"
          onPress={() => router.push("/profile-details")}
        />
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 80,
            backgroundColor: "#f1f1f1",
          }}
        >
          <ProfileSection profile={profiles[0]} />

          <InfoSection />
          <Perks />
          <SubscriptionBannerSlider />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default ProfileScreen