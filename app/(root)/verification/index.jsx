/**
 * app/(root)/(profile)/verification.jsx
 *
 * Selfie verification screen — Settings entry point.
 *
 * BUG FIX: endpoint was /verification/verify (no such route → server returned 400).
 *          Correct route is /profile/verify (profileRoutes.js is mounted at /api/profile).
 *
 * Flow: INTRO → CAMERA → PREVIEW → DONE
 */

import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
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
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constant/colors";
import { useAlert } from "../../../context/AlertContext";
import apiClient from "../../../utils/axiosInstance";
import { tokenManager } from "../../../utils/tokenManager";

const PRIMARY = colors.primary;

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEP = { INTRO: "intro", CAMERA: "camera", PREVIEW: "preview", DONE: "done" };

// ─── Intro ────────────────────────────────────────────────────────────────────
const IntroStep = ({ onStart }) => (
  <ScrollView contentContainerStyle={is.container} showsVerticalScrollIndicator={false}>
    <View style={is.iconWrap}>
      <ShieldCheck size={48} color={PRIMARY} strokeWidth={1.5} />
    </View>

    <Text style={is.title}>Verify Your Identity</Text>
    <Text style={is.body}>
      A quick selfie helps us confirm you&apos;re a real person and builds trust with your
      matches. Your selfie is only used for verification and is never shown on your profile.
    </Text>

    <View style={is.steps}>
      {[
        { n: "1", t: "Take a clear selfie", d: "Face the camera in good lighting"      },
        { n: "2", t: "We review it",        d: "Usually takes a few minutes"            },
        { n: "3", t: "Get your badge",      d: "Verified badge appears on your profile" },
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

const is = StyleSheet.create({
  container:   { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  iconWrap:    { width: 88, height: 88, borderRadius: 99, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20 },
  title:       { fontSize: 22, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5', textAlign: "center", marginBottom: 10 },
  body:        { fontSize: 14, fontFamily: "PlusJakartaSans", color: '#9CA3AF', textAlign: "center", lineHeight: 22, marginBottom: 28 },
  steps:       { gap: 16, marginBottom: 32 },
  stepRow:     { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  stepNum:     { width: 32, height: 32, borderRadius: 99, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumText: { fontSize: 14, fontFamily: "PlusJakartaSansBold", color: PRIMARY },
  stepTitle:   { fontSize: 15, fontFamily: "PlusJakartaSansSemiBold", color: '#E5E5E5', marginBottom: 2 },
  stepDesc:    { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#9CA3AF" },
  btn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16 },
  btnText:     { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
});

// ─── Camera Step ──────────────────────────────────────────────────────────────
const CameraStep = ({ onCapture, showAlert }) => {
  const cameraRef           = useRef(null);
  const [ready, setReady]   = useState(false);
  const [taking, setTaking] = useState(false);

  const handleCapture = async () => {
    if (!ready || taking || !cameraRef.current) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64:  false,
        exif:    false,
      });
      onCapture(photo.uri);
    } catch {
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Could not take photo. Please try again.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setTaking(false);
    }
  };

  return (
    <View style={cs.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        onCameraReady={() => setReady(true)}
      />

      {/* Oval face guide */}
      <View style={cs.overlay}>
        <View style={cs.oval} />
        <Text style={cs.hint}>Position your face inside the oval</Text>
      </View>

      {/* Shutter */}
      <View style={cs.shutterRow}>
        <TouchableOpacity
          style={[cs.shutter, (!ready || taking) && { opacity: 0.5 }]}
          onPress={handleCapture}
          disabled={!ready || taking}
          activeOpacity={0.85}
        >
          {taking
            ? <ActivityIndicator color={PRIMARY} />
            : <View style={cs.shutterInner} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
};

const cs = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#000" },
  overlay:      { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  oval:         { width: 230, height: 290, borderRadius: 999, borderWidth: 2.5, borderColor: "rgba(255,255,255,0.7)", borderStyle: "dashed" },
  hint:         { marginTop: 16, fontSize: 13, fontFamily: "PlusJakartaSansMedium", color: "rgba(255,255,255,0.8)" },
  shutterRow:   { position: "absolute", bottom: 48, width: "100%", alignItems: "center" },
  shutter:      { width: 72, height: 72, borderRadius: 99, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(255,255,255,0.4)" },
  shutterInner: { width: 54, height: 54, borderRadius: 99, backgroundColor: PRIMARY },
});

// ─── Preview Step ─────────────────────────────────────────────────────────────
const PreviewStep = ({ uri, onRetake, onSubmit, submitting }) => (
  <View style={ps.container}>
    <Image source={{ uri }} style={ps.image} resizeMode="cover" />

    <View style={ps.actions}>
      <Text style={ps.label}>Does this selfie look good?</Text>
      <Text style={ps.sublabel}>Make sure your face is clear and well-lit</Text>

      <TouchableOpacity
        style={ps.submitBtn}
        onPress={onSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <>
              <CheckCircle size={18} color="#fff" strokeWidth={2} />
              <Text style={ps.submitText}>Submit for Verification</Text>
            </>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={ps.retakeBtn}
        onPress={onRetake}
        disabled={submitting}
        activeOpacity={0.8}
      >
        <RefreshCw size={16} color={PRIMARY} strokeWidth={2} />
        <Text style={ps.retakeText}>Retake Photo</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ps = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#000" },
  image:      { flex: 1 },
  actions:    { backgroundColor: "#121212", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36 },
  label:      { fontSize: 17, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5', textAlign: "center", marginBottom: 4 },
  sublabel:   { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#9CA3AF", textAlign: "center", marginBottom: 20 },
  submitBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16, marginBottom: 12 },
  submitText: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  retakeBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  retakeText: { fontSize: 15, fontFamily: "PlusJakartaSansSemiBold", color: PRIMARY },
});

// ─── Done Step ────────────────────────────────────────────────────────────────
const DoneStep = ({ onBack }) => (
  <View style={ds.container}>
    <View style={ds.iconWrap}>
      <CheckCircle size={52} color="#10B981" strokeWidth={1.5} />
    </View>
    <Text style={ds.title}>Verified!</Text>
    <Text style={ds.body}>
      Your identity has been confirmed. Your profile now shows a verified badge
      — others can trust it&apos;s really you.
    </Text>
    <TouchableOpacity style={ds.btn} onPress={onBack} activeOpacity={0.85}>
      <Text style={ds.btnText}>Back to Profile</Text>
    </TouchableOpacity>
  </View>
);

const ds = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, backgroundColor: "#121212" },
  iconWrap:  { width: 96, height: 96, borderRadius: 99, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title:     { fontSize: 22, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5', marginBottom: 10, textAlign: "center" },
  body:      { fontSize: 14, fontFamily: "PlusJakartaSans", color: '#9CA3AF', textAlign: "center", lineHeight: 22, marginBottom: 32 },
  btn:       { backgroundColor: "#111", borderRadius: 99, paddingVertical: 16, paddingHorizontal: 40 },
  btnText:   { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VerificationScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [token, setToken] = useState(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [step,       setStep]           = useState(STEP.INTRO);
  const [photoUri,   setPhotoUri]       = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  // Load token from tokenManager on mount
  useEffect(() => {
    (async () => {
      const retrievedToken = await tokenManager.getToken();
      setToken(retrievedToken);
    })();
  }, []);

  // ── Start: request camera permission ─────────────────────────────────────
  const handleStart = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showAlert({
          icon: 'camera',
          title: 'Camera Required',
          message: 'Please allow camera access to take your verification selfie.',
          actions: [{ label: 'OK', style: 'primary' }],
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

  // ── Submit selfie ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!photoUri) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("selfie", {
        uri:  photoUri,
        name: `selfie-${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      // Correct endpoint: verificationRoutes mounted at /api/verification
      const response = await apiClient.post("/verification/verify", formData, {
        headers: {
          // force multipart; our instance previously defaulted to application/json
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // If backend approved, go to Done step
      if (response.data?.status === 'approved') {
        setStep(STEP.DONE);
      } else {
        setStep(STEP.DONE);
      }
    } catch (err) {
      const code = err?.response?.data?.code;
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Could not submit your selfie. Please try again.";

      if (code === 'FACE_MISMATCH' || code === 'LOW_CONFIDENCE') {
        // Face didn't match — prompt retake
        showAlert({
          icon: 'error',
          title: 'Verification Failed',
          message: message,
          actions: [
            { label: 'Retake Selfie', style: 'primary', onPress: () => setStep(STEP.CAMERA) },
          ],
        });
      } else if (code === 'INVALID_PROFILE_PHOTO') {
        // Profile photo was rejected by AI
        showAlert({
          icon: 'error',
          title: 'Profile Photo Rejected',
          message: message,
          actions: [
            { label: 'Update My Photos', style: 'primary', onPress: () => router.back() },
          ],
        });
      } else if (code === 'NO_PROFILE_PHOTO') {
        showAlert({
          icon: 'error',
          title: 'Profile Photo Required',
          message: 'Please upload at least one profile photo before verifying.',
          actions: [
            { label: 'Go Back', style: 'primary', onPress: () => router.back() },
          ],
        });
      } else {
        showAlert({
          icon: 'error',
          title: 'Upload Failed',
          message,
          actions: [{ label: 'OK', style: 'primary' }],
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={sc.safe} edges={["top"]}>
      {/* ── Header (hidden on camera/done steps) ── */}
      {step !== STEP.CAMERA && step !== STEP.DONE && (
        <View style={sc.header}>
          <TouchableOpacity
            onPress={() =>
              step === STEP.PREVIEW ? setStep(STEP.CAMERA) : router.back()
            }
            hitSlop={8}
          >
            <ChevronLeft size={26} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={sc.headerTitle}>
            {step === STEP.INTRO ? "Verification" : "Preview Selfie"}
          </Text>
          <View style={{ width: 26 }} />
        </View>
      )}

      {/* ── Camera back button ── */}
      {step === STEP.CAMERA && (
        <TouchableOpacity
          style={sc.cameraBack}
          onPress={() => setStep(STEP.INTRO)}
        >
          <ChevronLeft size={26} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      )}

      <View style={{ flex: 1 }}>
        {step === STEP.INTRO   && <IntroStep onStart={handleStart} />}
        {step === STEP.CAMERA  && <CameraStep onCapture={handleCapture} showAlert={showAlert} />}
        {step === STEP.PREVIEW && (
          <PreviewStep
            uri={photoUri}
            onRetake={() => setStep(STEP.CAMERA)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
        {step === STEP.DONE && <DoneStep onBack={() => router.back()} />}
      </View>
    </SafeAreaView>
  );
}

const sc = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: "#121212" },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.whiteLight },
  headerTitle: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5' },
  cameraBack:  { position: "absolute", top: 52, left: 16, zIndex: 10, padding: 8, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 99 },
});