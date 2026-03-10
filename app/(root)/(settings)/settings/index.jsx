import Constants from 'expo-constants'
import { ArrowLeft } from "lucide-react-native"
import { StatusBar, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import GeneralHeader from "../../../../components/headers/GeneralHeader"
import AccountAction from '../../../../components/settings/AccountAction'
import AccountSection from '../../../../components/settings/AccountSection'
import LegalSection from '../../../../components/settings/LegalSection'
import PreferencesSection from '../../../../components/settings/PreferencesSection'
import PrivacySection from '../../../../components/settings/PrivacySection'
import SupportSection from '../../../../components/settings/SupportSection'
import { useTheme } from '../../../../context/ThemeContext'

const appVersion = Constants.expoConfig?.version ?? Constants.manifest?.version ?? '1.0.0'

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

        {/* ── App version ── */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary ?? '#9CA3AF' }]}>
            Bondies v{appVersion}
          </Text>
          <Text style={[styles.versionText, { color: colors.textSecondary ?? '#9CA3AF' }]}>
            © {new Date().getFullYear()} Oatchip Limited.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  versionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    letterSpacing: 0.3,
  },
})

export default SettingScreen