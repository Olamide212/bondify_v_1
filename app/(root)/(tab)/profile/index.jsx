import { View, Text } from 'react-native'
import React from 'react'
import BasicInfo from '../../../../components/profileScreen/BasicInfo'
import ProfileSection from '../../../../components/profileScreen/ProfileSection'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import GeneralHeader from '../../../../components/headers/GeneralHeader'
import { profiles } from '../../../../data/profileData'
import { Bolt, Bell } from 'lucide-react-native';
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
          icon=<Bell color="#000" />
          className="text-black"
          onPress={() => router.push("/settings")}
        />
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 80,
            backgroundColor: "#fff",
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