/**
 * app/(auth)/(onboarding)/verification/done.jsx
 * Success screen after submitting selfie for verification
 */

import { useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../../../constant/colors";

const PRIMARY = colors.primary;

export default function DoneScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/(onboarding)/location-access");
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <CheckCircle size={52} color="#10B981" strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>Selfie Submitted! 🎉</Text>
      <Text style={styles.body}>
        We're reviewing your photo now. You'll receive your verified badge shortly
        — usually within a few minutes.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={handleContinue} activeOpacity={0.85}>
        <Text style={styles.btnText}>Continue →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, backgroundColor: "#121212" },
  iconWrap: { width: 96, height: 96, borderRadius: 99, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 24, fontFamily: "OutfitBold", color: '#E5E5E5', marginBottom: 10, textAlign: "center" },
  body: { fontSize: 16, fontFamily: "Outfit", color: '#9CA3AF', textAlign: "center", lineHeight: 22, marginBottom: 36 },
  btn: { backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16, paddingHorizontal: 48 },
  btnText: { fontSize: 16, fontFamily: "OutfitBold", color: "#fff" },
});
