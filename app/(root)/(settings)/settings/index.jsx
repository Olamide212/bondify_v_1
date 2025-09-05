import { View, Text } from 'react-native'
import React from 'react'
import AccountSection from '../../../../components/settings/AccountSection'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView } from 'react-native-gesture-handler'
import GeneralHeader from "../../../../components/headers/GeneralHeader"
import { ArrowLeft } from "lucide-react-native";
import PrivacySection from '../../../../components/settings/PrivacySection'
import PreferencesSection from '../../../../components/settings/PreferencesSection'
import SupportSection from '../../../../components/settings/SupportSection'
import LegalSection from '../../../../components/settings/LegalSection'
import AccountAction from '../../../../components/settings/AccountAction'
import TextHeadingOne from '../../../../components/ui/TextHeadingOne'

const SettingScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <GeneralHeader title="Profile settings" leftIcon={<ArrowLeft />} />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 80,
          backgroundColor: "#f1f1f1",
        }}
      >
        <View>
          <TextHeadingOne name="Account" />
          <AccountSection />
        </View>
        <View>
          <TextHeadingOne name="Privacy Policy" />

          <PrivacySection />
        </View>
        <View>
          <TextHeadingOne name="App Preferences" />

          <PreferencesSection />
        </View>
        <View>
          <TextHeadingOne name="Support" />

          <SupportSection />
        </View>
        <View>
          <TextHeadingOne name="Legal" />
          <LegalSection />
        </View>
        <View>
          <TextHeadingOne name="Account Action" />
          <AccountAction />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default SettingScreen