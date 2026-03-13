/**
 * app/(auth)/(onboarding)/verification/intro.jsx
 * Selfie verification intro screen
 */

import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Camera, ShieldCheck } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../../constant/colors";

const PRIMARY = colors.primary;

const IntroStep = ({ onStart, onSkip }) => (
  <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
    <View style={styles.iconWrap}>
      <ShieldCheck size={48} color={PRIMARY} strokeWidth={1.5} />
    </View>

    <Text style={styles.title}>Verify Your Identity</Text>
    <Text style={styles.body}>
      A quick selfie helps us confirm you're a real person and builds trust with your
      matches. Your selfie is only used for verification and is never shown on your profile.
    </Text>

    <View style={styles.steps}>
      {[
        { n: "1", t: "Take a clear selfie", d: "Face the camera in good lighting" },
        { n: "2", t: "We review it", d: "Usually takes a few minutes" },
        { n: "3", t: "Get your badge", d: "Verified badge appears on your profile" },
      ].map(({ n, t, d }) => (
        <View key={n} style={styles.stepRow}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{n}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{t}</Text>
            <Text style={styles.stepDesc}>{d}</Text>
          </View>
        </View>
      ))}
    </View>

    <TouchableOpacity style={styles.btn} onPress={onStart} activeOpacity={0.85}>
      <Camera size={18} color="#fff" strokeWidth={2} />
      <Text style={styles.btnText}>Open Camera</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
      <Text style={styles.skipText}>Skip for now</Text>
    </TouchableOpacity>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  iconWrap: { width: 88, height: 88, borderRadius: 99, backgroundColor: "#FEF3EC", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20 },
  title: { fontSize: 24, fontFamily: "PlusJakartaSansBold", color: "#111", textAlign: "center", marginBottom: 10 },
  body: { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#6B7280", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  steps: { gap: 16, marginBottom: 32 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  stepNum: { width: 32, height: 32, borderRadius: 99, backgroundColor: "#FEF3EC", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumText: { fontSize: 14, fontFamily: "PlusJakartaSansBold", color: PRIMARY },
  stepTitle: { fontSize: 15, fontFamily: "PlusJakartaSansSemiBold", color: "#111", marginBottom: 2 },
  stepDesc: { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#9CA3AF" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16, marginBottom: 12 },
  btnText: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipText: { fontSize: 14, fontFamily: "PlusJakartaSansMedium", color: "#9CA3AF" },
});

export default function VerificationIntroScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const handleStart = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        alert(
          "Camera Required - Please allow camera access to take your verification selfie."
        );
        return;
      }
    }
    router.push("/(onboarding)/verification/camera");
  };

  const handleSkip = () => {
    router.push("/(onboarding)/location-access");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        <IntroStep onSkip={handleSkip} />
        {/* Override button handler */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }} />
      </View>
    </SafeAreaView>
  );
}
