/**
 * components/verification/VerificationFlow.jsx
 *
 * Reusable selfie-verification component.
 * No face-detection library needed — uses a 3-second countdown UX instead.
 * The server handles real face comparison; the client just guides the user.
 *
 * Usage — onboarding:
 *   <VerificationFlow
 *     mode="onboarding"
 *     profilePhotoUrl={url}
 *     draftMedia={draftMedia}
 *     onboardingToken={token}
 *     onComplete={() => router.push('/location-access')}
 *     onBack={() => router.back()}
 *   />
 *
 * Usage — settings:
 *   <VerificationFlow
 *     mode="settings"
 *     authToken={token}
 *     onComplete={() => router.back()}
 *     onBack={() => router.back()}
 *   />
 */

import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Camera,
  CheckCircle,
  ChevronLeft,
  RefreshCw,
  ShieldCheck,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { useAlert } from "../../context/AlertContext";
import apiClient from "../../utils/axiosInstance";

const PRIMARY = colors.primary;
const STEP = { INTRO: "intro", CAMERA: "camera", PREVIEW: "preview", DONE: "done" };
const COUNTDOWN_SECS = 3;
const OVAL_W = 230;
const OVAL_H = 300;

// ─── Intro ────────────────────────────────────────────────────────────────────
function IntroStep({ onStart, profilePhotoUrl, mode }) {
  return (
    <ScrollView contentContainerStyle={is.container} showsVerticalScrollIndicator={false}>
      {profilePhotoUrl ? (
        <View style={is.photoWrap}>
          <Image source={{ uri: profilePhotoUrl }} style={is.profilePhoto} />
        </View>
      ) : (
        <View style={is.iconWrap}>
          <ShieldCheck size={48} color={PRIMARY} strokeWidth={1.5} />
        </View>
      )}

      <Text style={is.title}>
        {mode === "onboarding" ? "Let's verify it's you" : "Verify Your Identity"}
      </Text>
      <Text style={is.body}>
        A quick selfie helps us confirm you&apos;re a real person and builds trust with your
        matches. Your selfie is only used for verification and is never shown on your profile.
      </Text>

      <View style={is.steps}>
        {[
          { n: "1", t: "Position your face",  d: "Center yourself in the oval" },
          { n: "2", t: "Hold still",           d: "Auto-captures after 3 seconds" },
          { n: "3", t: "Get your badge",       d: "Verified badge appears on your profile" },
        ].map(({ n, t, d }) => (
          <View key={n} style={is.stepRow}>
            <View style={is.stepNum}>
              <Text style={is.stepNumText}>{n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={is.stepTitle}>{t}</Text>
              <Text style={is.stepDesc}>{d}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={is.btn} onPress={onStart} activeOpacity={0.85}>
        <Camera size={18} color="#fff" strokeWidth={2} />
        <Text style={is.btnText}>Open Camera</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const is = StyleSheet.create({
  container:    { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  iconWrap:     { width: 88, height: 88, borderRadius: 99, backgroundColor: "#1E1E1E", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20 },
  photoWrap:    { width: 130, height: 130, borderRadius: 65, alignSelf: "center", marginBottom: 20 },
  profilePhoto: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: PRIMARY },
  title:        { fontSize: 22, fontFamily: "PlusJakartaSansBold", color: "#E5E5E5", textAlign: "center", marginBottom: 10 },
  body:         { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#9CA3AF", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  steps:        { gap: 16, marginBottom: 32 },
  stepRow:      { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  stepNum:      { width: 32, height: 32, borderRadius: 99, backgroundColor: "#1E1E1E", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumText:  { fontSize: 14, fontFamily: "PlusJakartaSansBold", color: PRIMARY },
  stepTitle:    { fontSize: 15, fontFamily: "PlusJakartaSansSemiBold", color: "#E5E5E5", marginBottom: 2 },
  stepDesc:     { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#9CA3AF" },
  btn:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16 },
  btnText:      { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
});

// ─── Camera ───────────────────────────────────────────────────────────────────
function CameraStep({ onCapture, showAlert }) {
  const cameraRef   = useRef(null);
  const timerRef    = useRef(null);
  const capturedRef = useRef(false);

  const [ready,     setReady]     = useState(false);
  const [taking,    setTaking]    = useState(false);
  const [countdown, setCountdown] = useState(null);  // null | 3 | 2 | 1
  const [counting,  setCounting]  = useState(false);

  // Animated ring pulse during countdown
  const ringScale = useRef(new Animated.Value(1)).current;
  const loopRef   = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (counting) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(ringScale, { toValue: 1.06, duration: 500, useNativeDriver: true }),
          Animated.timing(ringScale, { toValue: 1,    duration: 500, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      ringScale.setValue(1);
    }
  }, [counting]);

  const startCountdown = () => {
    if (counting || capturedRef.current || !ready) return;
    setCounting(true);
    setCountdown(COUNTDOWN_SECS);

    let remaining = COUNTDOWN_SECS;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setCountdown(0);
        doCapture();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    clearInterval(timerRef.current);
    setCounting(false);
    setCountdown(null);
  };

  const doCapture = async () => {
    if (capturedRef.current || !cameraRef.current) return;
    capturedRef.current = true;
    setCounting(false);
    setCountdown(null);
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });
      onCapture(photo.uri);
    } catch {
      capturedRef.current = false;
      showAlert({
        icon: "camera",
        title: "Error",
        message: "Could not take photo. Please try again.",
        actions: [{ label: "OK", style: "primary" }],
      });
    } finally {
      setTaking(false);
    }
  };

  const ovalColor = taking || counting ? "#10B981" : "rgba(255,255,255,0.75)";

  const statusMsg = taking
    ? "Capturing…"
    : counting
    ? `Hold still… ${countdown}`
    : ready
    ? "Tap the oval or button to start"
    : "Starting camera…";

  return (
    <View style={cs.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        onCameraReady={() => setReady(true)}
        onMountError={() =>
          showAlert({
            icon: "camera",
            title: "Camera Error",
            message: "Could not start camera. Please try again.",
            actions: [{ label: "OK", style: "primary" }],
          })
        }
      />

      {/* Overlay — pointerEvents="none" so taps pass through to ovalTapArea */}
      <View style={cs.overlay} pointerEvents="none">
        <View style={cs.top} />
        <View style={cs.middle}>
          <View style={cs.side} />
          <Animated.View style={[cs.ovalHole, { transform: [{ scale: ringScale }] }]}>
            <View style={[cs.ovalBorder, { borderColor: ovalColor }]} />
            {/* Countdown number inside the oval */}
            {counting && countdown !== null && (
              <View style={cs.countdownOverlay}>
                <Text style={cs.countdownBig}>{countdown}</Text>
              </View>
            )}
          </Animated.View>
          <View style={cs.side} />
        </View>
        <View style={cs.hintRow}>
          <Text style={[cs.hint, counting && { color: "#10B981" }]}>{statusMsg}</Text>
        </View>
        <View style={cs.bottom} />
      </View>

      {/* Invisible touch area over the oval */}
      {ready && !taking && (
        <TouchableOpacity
          style={cs.ovalTap}
          onPress={counting ? cancelCountdown : startCountdown}
          activeOpacity={1}
        />
      )}

      {/* Shutter button */}
      <View style={cs.shutterRow}>
        <TouchableOpacity
          style={[cs.shutter, (!ready || taking) && { opacity: 0.4 }]}
          onPress={counting ? cancelCountdown : doCapture}
          disabled={!ready || taking}
          activeOpacity={0.85}
        >
          {taking
            ? <ActivityIndicator color={PRIMARY} />
            : counting
            ? <Text style={cs.shutterCountdown}>{countdown}</Text>
            : <View style={cs.shutterInner} />
          }
        </TouchableOpacity>
        <Text style={cs.tapHint}>
          {counting ? "tap to cancel" : "tap to capture now"}
        </Text>
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#000" },
  overlay:          { ...StyleSheet.absoluteFillObject },
  top:              { flex: 1 },
  middle:           { flexDirection: "row", height: OVAL_H },
  side:             { flex: 1 },
  ovalHole:         { width: OVAL_W, height: OVAL_H, alignItems: "center", justifyContent: "center", backgroundColor: "transparent", overflow: "hidden", borderRadius: OVAL_H / 2 },
  ovalBorder:       { ...StyleSheet.absoluteFillObject, borderRadius: OVAL_H / 2, borderWidth: 3 },
  countdownOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  countdownBig:     { fontSize: 72, fontFamily: "PlusJakartaSansBold", color: "rgba(255,255,255,0.9)" },
  hintRow:          { alignItems: "center", paddingVertical: 14 },
  hint:             { fontSize: 14, fontFamily: "PlusJakartaSansMedium", color: "rgba(255,255,255,0.85)", textAlign: "center" },
  bottom:           { flex: 1 },
  // Tap zone — centred, same size as the oval, sits above the overlay in z-order
  ovalTap:          { position: "absolute", alignSelf: "center", width: OVAL_W, height: OVAL_H, borderRadius: OVAL_H / 2, top: "20%" },
  shutterRow:       { position: "absolute", bottom: 48, width: "100%", alignItems: "center" },
  shutter:          { width: 72, height: 72, borderRadius: 99, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(255,255,255,0.4)" },
  shutterInner:     { width: 54, height: 54, borderRadius: 99, backgroundColor: PRIMARY },
  shutterCountdown: { fontSize: 26, fontFamily: "PlusJakartaSansBold", color: "#10B981" },
  tapHint:          { marginTop: 12, fontSize: 12, fontFamily: "PlusJakartaSans", color: "rgba(255,255,255,0.5)" },
});

// ─── Preview ──────────────────────────────────────────────────────────────────
function PreviewStep({ uri, onRetake, onSubmit, submitting }) {
  return (
    <View style={pv.container}>
      <Image source={{ uri }} style={pv.image} resizeMode="cover" />
      <View style={pv.actions}>
        <Text style={pv.label}>Does this selfie look good?</Text>
        <Text style={pv.sub}>Make sure your face is clear and well-lit</Text>
        <TouchableOpacity style={pv.submitBtn} onPress={onSubmit} disabled={submitting} activeOpacity={0.85}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <><CheckCircle size={18} color="#fff" strokeWidth={2} /><Text style={pv.submitText}>Submit for Verification</Text></>
          }
        </TouchableOpacity>
        <TouchableOpacity style={pv.retakeBtn} onPress={onRetake} disabled={submitting} activeOpacity={0.8}>
          <RefreshCw size={16} color={PRIMARY} strokeWidth={2} />
          <Text style={pv.retakeText}>Retake Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pv = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#000" },
  image:      { flex: 1 },
  actions:    { backgroundColor: "#121212", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36 },
  label:      { fontSize: 17, fontFamily: "PlusJakartaSansBold", color: "#E5E5E5", textAlign: "center", marginBottom: 4 },
  sub:        { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#9CA3AF", textAlign: "center", marginBottom: 20 },
  submitBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16, marginBottom: 12 },
  submitText: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  retakeBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  retakeText: { fontSize: 15, fontFamily: "PlusJakartaSansSemiBold", color: PRIMARY },
});

// ─── Done ─────────────────────────────────────────────────────────────────────
function DoneStep({ mode, onComplete }) {
  return (
    <View style={dn.container}>
      <View style={dn.iconWrap}>
        <CheckCircle size={52} color="#10B981" strokeWidth={1.5} />
      </View>
      <Text style={dn.title}>{mode === "onboarding" ? "Verified! 🎉" : "Verified!"}</Text>
      <Text style={dn.body}>
        Your identity has been confirmed. Your profile now shows a verified badge —
        others can trust it&apos;s really you.
      </Text>
      <TouchableOpacity style={dn.btn} onPress={onComplete} activeOpacity={0.85}>
        <Text style={dn.btnText}>
          {mode === "onboarding" ? "Continue →" : "Back to Profile"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const dn = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, backgroundColor: "#121212" },
  iconWrap:  { width: 96, height: 96, borderRadius: 99, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title:     { fontSize: 22, fontFamily: "PlusJakartaSansBold", color: "#E5E5E5", marginBottom: 10, textAlign: "center" },
  body:      { fontSize: 14, fontFamily: "PlusJakartaSans", color: "#9CA3AF", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  btn:       { backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16, paddingHorizontal: 48 },
  btnText:   { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
});

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function VerificationFlow({
  mode = "settings",
  profilePhotoUrl = null,
  draftMedia = [],
  authToken = null,
  onboardingToken = null,
  onComplete,
  onBack,
  onCameraVisible,
}) {
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [step,      setStep]      = useState(STEP.INTRO);
  const [photoUri,  setPhotoUri]  = useState(null);
  const [submitting, setSub]      = useState(false);

  useEffect(() => {
    onCameraVisible?.(step === STEP.CAMERA);
  }, [step]);

  const handleStart = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showAlert({
          icon: "camera",
          title: "Camera Required",
          message: "Please allow camera access to take your verification selfie.",
          actions: [{ label: "OK", style: "primary" }],
        });
        return;
      }
    }
    setStep(STEP.CAMERA);
  };

  const handleCapture = (uri) => {
    setPhotoUri(uri);
    setStep(STEP.PREVIEW);
  };

  const handleSubmit = async () => {
    if (!photoUri) return;
    setSub(true);
    try {
      const token = authToken ?? onboardingToken;
      const formData = new FormData();
      formData.append("selfie", { uri: photoUri, name: `selfie-${Date.now()}.jpg`, type: "image/jpeg" });

      if (mode === "onboarding") {
        draftMedia.forEach((item, i) => {
          if (!item?.uri) return;
          formData.append("profileMedia", {
            uri:  item.uri,
            name: item.fileName ?? `profile-media-${i}.${item.type === "video" ? "mp4" : "jpg"}`,
            type: item.mimeType ?? (item.type === "video" ? "video/mp4" : "image/jpeg"),
          });
        });
      }

      await apiClient.post("/verification/verify", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setStep(STEP.DONE);
    } catch (err) {
      const code    = err?.response?.data?.code;
      const message = err?.response?.data?.message ?? err?.message ?? "Could not submit your selfie. Please try again.";

      if (code === "FACE_MISMATCH" || code === "LOW_CONFIDENCE") {
        showAlert({
          icon: "error", title: "Verification Failed", message,
          actions: [
            { label: "Retake Selfie", style: "primary",   onPress: () => setStep(STEP.CAMERA) },
            ...(mode === "onboarding"
              ? [{ label: "Change Main Photo", style: "secondary", onPress: onBack }]
              : []),
          ],
        });
      } else if (code === "INVALID_PROFILE_PHOTO") {
        showAlert({
          icon: "error", title: "Profile Photo Rejected", message,
          actions: [{ label: mode === "onboarding" ? "Change My Photo" : "Update My Photos", style: "primary", onPress: onBack }],
        });
      } else if (code === "NO_PROFILE_PHOTO") {
        showAlert({
          icon: "error", title: "Profile Photo Required",
          message: "Please upload at least one profile photo before verifying.",
          actions: [{ label: "Go Back", style: "primary", onPress: onBack }],
        });
      } else {
        showAlert({ icon: "error", title: "Upload Failed", message, actions: [{ label: "OK", style: "primary" }] });
      }
    } finally {
      setSub(false);
    }
  };

  // Camera renders fullscreen, breaking out of the parent SafeAreaView
  if (step === STEP.CAMERA) {
    return (
      <View style={[fl.cameraFull, { marginTop: -insets.top, marginBottom: -insets.bottom }]}>
        <TouchableOpacity
          style={[fl.cameraBack, { top: insets.top + 20 }]}
          onPress={() => setStep(STEP.INTRO)}
        >
          <ChevronLeft size={26} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <CameraStep onCapture={handleCapture} showAlert={showAlert} />
      </View>
    );
  }

  return (
    <View style={fl.root}>
      {step !== STEP.DONE && (
        <View style={fl.header}>
          <TouchableOpacity
            onPress={step === STEP.PREVIEW ? () => setStep(STEP.CAMERA) : onBack}
            hitSlop={8}
          >
            <ChevronLeft size={26} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={fl.headerTitle}>
            {step === STEP.INTRO ? "Verification" : "Preview Selfie"}
          </Text>
          <View style={{ width: 26 }} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        {step === STEP.INTRO   && <IntroStep onStart={handleStart} profilePhotoUrl={profilePhotoUrl} mode={mode} />}
        {step === STEP.PREVIEW && <PreviewStep uri={photoUri} onRetake={() => setStep(STEP.CAMERA)} onSubmit={handleSubmit} submitting={submitting} />}
        {step === STEP.DONE    && <DoneStep mode={mode} onComplete={onComplete} />}
      </View>
    </View>
  );
}

const fl = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#121212" },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.08)" },
  headerTitle: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#E5E5E5" },
  cameraFull:  { flex: 1, backgroundColor: "#000" },
  cameraBack:  { position: "absolute", left: 16, zIndex: 10, padding: 8, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 99 },
});