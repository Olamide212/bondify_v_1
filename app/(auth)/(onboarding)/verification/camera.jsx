/**
 * app/(auth)/(onboarding)/verification/camera.jsx
 * Camera capture screen for selfie verification
 */

import { useIsFocused } from "@react-navigation/core";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../../../constant/colors";

const PRIMARY = colors.primary;

export default function CameraScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const cameraRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [permission] = useCameraPermissions();

  // Delay camera mount slightly so the native view initialises after navigation completes
  useEffect(() => {
    if (!isFocused) {
      setMounted(false);
      setReady(false);
      return;
    }
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, [isFocused]);

  const handleCapture = async () => {
    if (!ready || taking || !cameraRef.current) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });
      router.push({
        pathname: "/(onboarding)/verification/preview",
        params: { photoUri: photo.uri },
      });
    } catch (error) {
      Alert.alert("Error", "Could not take photo. Please try again.");
      setTaking(false);
    }
  };

  // If permission was somehow revoked, go back
  if (!permission?.granted) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: "#fff", fontFamily: "PlusJakartaSansMedium", fontSize: 15, textAlign: "center", paddingHorizontal: 32 }}>
          Camera permission is required. Please allow camera access in your device settings.
        </Text>
        <TouchableOpacity style={[styles.shutter, { marginTop: 24, width: 48, height: 48 }]} onPress={() => router.back()}>
          <Text style={{ fontFamily: "PlusJakartaSansBold", color: PRIMARY }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mounted && isFocused ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
          onCameraReady={() => setReady(true)}
          onMountError={(e) => {
            console.warn("Camera mount error:", e);
            Alert.alert("Camera Error", "Could not start camera. Please try again.", [
              { text: "Go Back", onPress: () => router.back() },
            ]);
          }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Oval face guide */}
      <View style={styles.overlay}>
        <View style={styles.oval} />
        <Text style={styles.hint}>Position your face inside the oval</Text>
      </View>

      {/* Shutter */}
      <View style={styles.shutterRow}>
        <TouchableOpacity
          style={[styles.shutter, (!ready || taking) && { opacity: 0.5 }]}
          onPress={handleCapture}
          disabled={!ready || taking}
          activeOpacity={0.85}
        >
          {taking ? (
            <ActivityIndicator color={PRIMARY} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  oval: { width: 230, height: 290, borderRadius: 999, borderWidth: 2.5, borderColor: "rgba(255,255,255,0.75)", borderStyle: "dashed" },
  hint: { marginTop: 16, fontSize: 13, fontFamily: "PlusJakartaSansMedium", color: "rgba(255,255,255,0.85)" },
  shutterRow: { position: "absolute", bottom: 48, width: "100%", alignItems: "center" },
  shutter: { width: 72, height: 72, borderRadius: 99, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(255,255,255,0.4)" },
  shutterInner: { width: 54, height: 54, borderRadius: 99, backgroundColor: PRIMARY },
});
