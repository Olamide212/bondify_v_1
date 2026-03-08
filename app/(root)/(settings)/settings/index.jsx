import React from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView } from 'react-native-gesture-handler'
import { ArrowLeft } from "lucide-react-native"
import { useTheme } from '../../../../context/ThemeContext'
import GeneralHeader from "../../../../components/headers/GeneralHeader"
import AccountSection from '../../../../components/settings/AccountSection'
import PrivacySection from '../../../../components/settings/PrivacySection'
import PreferencesSection from '../../../../components/settings/PreferencesSection'
import SupportSection from '../../../../components/settings/SupportSection'
import LegalSection from '../../../../components/settings/LegalSection'
import AccountAction from '../../../../components/settings/AccountAction'

const SettingScreen = () => {
  const { colors } = useTheme()

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.surface} />

      <GeneralHeader title="Profile settings" leftIcon={<ArrowLeft color={colors.textPrimary} />} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        <AccountSection />
        <PrivacySection />
        <PreferencesSection />
        <SupportSection />
        <LegalSection />
        <AccountAction />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
})

export default SettingScreen