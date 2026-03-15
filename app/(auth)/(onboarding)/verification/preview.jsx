/**
 * app/(auth)/(onboarding)/verification/preview.jsx
 * Preview and submit selfie screen
 */

import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../../../constant/colors";
import apiClient from "../../../../utils/axiosInstance";
import { tokenManager } from "../../../../utils/tokenManager";

const PRIMARY = colors.primary;

export default function PreviewScreen() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!photoUri) return;

    setSubmitting(true);
    try {
      const token = (await tokenManager.getToken()) || 
                   (await tokenManager.getOnboardingToken());

      const formData = new FormData();
      formData.append("selfie", {
        uri: photoUri,
        name: "selfie.jpg",
        type: "image/jpeg",
      });

      const headers = {
        "Content-Type": "multipart/form-data",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      await apiClient.post("/profile/verify-selfie", formData, { headers });
      router.push("/(onboarding)/verification/done");
    } catch (error) {
      alert("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />

      <View style={styles.actions}>
        <Text style={styles.label}>Does this selfie look good?</Text>
        <Text style={styles.sublabel}>Make sure your face is clear and well-lit</Text>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CheckCircle size={18} color="#fff" strokeWidth={2} />
              <Text style={styles.submitText}>Submit for Verification</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={() => router.back()}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <RefreshCw size={16} color={PRIMARY} strokeWidth={2} />
          <Text style={styles.retakeText}>Retake Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  image: { flex: 1 },
  actions: { backgroundColor: "#fff", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36 },
  label: { fontSize: 17, fontFamily: "PlusJakartaSansBold", color: "#111", textAlign: "center", marginBottom: 4 },
  sublabel: { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#9CA3AF", textAlign: "center", marginBottom: 20 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16, marginBottom: 12 },
  submitText: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  retakeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  retakeText: { fontSize: 15, fontFamily: "PlusJakartaSansSemiBold", color: PRIMARY },
});
