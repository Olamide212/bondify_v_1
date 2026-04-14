/**
 * app/(auth)/(onboarding)/verification/index.jsx
 *
 * Selfie verification screen for onboarding.
 * Uses a step-based approach (INTRO → CAMERA → PREVIEW → DONE) within a single
 * component to avoid navigation-triggered camera initialization crashes.
 *
 * Flow: INTRO → CAMERA → PREVIEW → DONE → location-access
 * 
 * Uses expo-face-detector for liveness detection and auto-capture.
 */

import { CameraView, useCameraPermissions } from "expo-camera";
import * as FaceDetector from 'expo-face-detector';
import { useRouter } from "expo-router";
import {
    Camera,
    CheckCircle,
    ChevronLeft,
    RefreshCw,
    Scan,
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
import * as Progress from 'react-native-progress';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VerifiedIcon from "../../../../components/ui/VerifiedIcon";
import { colors } from "../../../../constant/colors";
import { useAlert } from "../../../../context/AlertContext";
import { useVerificationStep } from "../../../../context/VerificationStepContext";
import { profileService } from "../../../../services/profileService";
import apiClient from "../../../../utils/axiosInstance";
import {
    clearOnboardingProfileMediaDraft,
    getOnboardingDraftMainPhotoUrl,
    getOnboardingProfileMediaDraft,
} from "../../../../utils/onboardingProfileMediaDraft";
import { tokenManager } from "../../../../utils/tokenManager";

const PRIMARY = colors.primary;

// ─── Steps ─────────────────────────────────────────────────────────────────��──
const STEP = { INTRO: "intro", CAMERA: "camera", PREVIEW: "preview", DONE: "done" };

// ─── Intro Step ───────────────────────────────────────────────────────────────
const IntroStep = ({ onStart, onSkip, profilePhotoUrl }) => (
  <ScrollView contentContainerStyle={is.container} showsVerticalScrollIndicator={false}>
    {profilePhotoUrl ? (
      <View style={is.photoWrap}>
        <Image source={{ uri: profilePhotoUrl }} style={is.profilePhoto} />
        <View style={is.photoBadge}>
          <VerifiedIcon />
        
        </View>
      </View>
    ) : (
      <View style={is.iconWrap}>
        <ShieldCheck size={48} color={PRIMARY} strokeWidth={1.5} />
      </View>
    )}

    <Text style={is.title}>Let&apos;s verify its you</Text>
    <Text style={is.body}>
      A quick selfie helps us confirm you&apos;re a real person and builds trust with your
      matches. Your selfie is only used for verification and is never shown on your profile.
    </Text>

    <View style={is.steps}>
      {[
        { n: "1", t: "Take a clear selfie", d: "Face the camera in good lighting" },
        { n: "2", t: "We review it",        d: "Usually takes a few minutes" },
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

    {/* <TouchableOpacity style={is.skipBtn} onPress={onSkip} activeOpacity={0.7}>
      <Text style={is.skipText}>Skip for now</Text>
    </TouchableOpacity> */}
  </ScrollView>
);

const is = StyleSheet.create({
  container:   { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, marginTop: 30 },
  iconWrap:    { width: 88, height: 88, borderRadius: 99, backgroundColor: "#EDE8F5", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20 },
  title:       { fontSize: 24, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5', textAlign: "center", marginBottom: 10 },
  body:        { fontSize: 14, fontFamily: "PlusJakartaSans", color: '#9CA3AF', textAlign: "center", lineHeight: 22, marginBottom: 28 },
  photoWrap:   { width: 150, height: 150, borderRadius: 75, alignSelf: "center", marginBottom: 20, position: "relative" },
  profilePhoto:{ width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: PRIMARY },
  photoBadge:  { position: "absolute", bottom: 5, right: 15, width: 28, height: 28,   alignItems: "center", justifyContent: "center",  },
  steps:       { gap: 20, marginBottom: 32 },
  stepRow:     { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  stepNum:     { width: 32, height: 32, borderRadius: 99, backgroundColor: "#EDE8F5", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumText: { fontSize: 15, fontFamily: "PlusJakartaSansBold", color: PRIMARY },
  stepTitle:   { fontSize: 15, fontFamily: "PlusJakartaSansSemiBold", color: '#E5E5E5', marginBottom: 2 },
  stepDesc:    { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#9CA3AF" },
  btn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16, marginBottom: 12 },
  btnText:     { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
  skipBtn:     { alignItems: "center", paddingVertical: 12 },
  skipText:    { fontSize: 14, fontFamily: "PlusJakartaSansMedium", color: "#9CA3AF" },
});

// ─── Face Detection Constants ─────────────────────────────────────────────────
const FACE_STABLE_THRESHOLD = 2000; // ms face must be stable before auto-capture
const FACE_CHECK_INTERVAL = 100; // ms between face stability checks

// ─── Camera Step with Face Detection ──────────────────────────────────────────
const CameraStep = ({ onCapture, showAlert }) => {
  const cameraRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  
  // Face detection state
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInPosition, setFaceInPosition] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Position your face in the oval');
  
  // Refs for tracking face stability
  const faceStableStartRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const hasCapuredRef = useRef(false);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleFacesDetected = ({ faces }) => {
    if (hasCapuredRef.current || taking) return;
    
    if (faces.length === 0) {
      setFaceDetected(false);
      setFaceInPosition(false);
      setProgress(0);
      setStatusMessage('Position your face in the oval');
      faceStableStartRef.current = null;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    const face = faces[0];
    setFaceDetected(true);
    
    // Check if face is properly positioned (centered and appropriately sized)
    const { bounds, yawAngle, rollAngle } = face;
    const faceWidth = bounds.size.width;
    const faceCenterX = bounds.origin.x + faceWidth / 2;
    const faceCenterY = bounds.origin.y + bounds.size.height / 2;
    
    // Screen dimensions (approximate center)
    const screenCenterX = 200; // Approximate center for front camera
    const screenCenterY = 350;
    
    // Check positioning criteria:
    // 1. Face is roughly centered
    // 2. Face is facing forward (not turned too much)
    // 3. Face is appropriately sized (not too far/close)
    const isCentered = Math.abs(faceCenterX - screenCenterX) < 80 && 
                       Math.abs(faceCenterY - screenCenterY) < 100;
    const isFacingForward = Math.abs(yawAngle || 0) < 15 && Math.abs(rollAngle || 0) < 15;
    const isProperSize = faceWidth > 100 && faceWidth < 300;
    
    const isInPosition = isCentered && isFacingForward && isProperSize;
    setFaceInPosition(isInPosition);

    if (!isInPosition) {
      // Provide guidance
      if (!isCentered) {
        setStatusMessage('Move your face to the center');
      } else if (!isFacingForward) {
        setStatusMessage('Look straight at the camera');
      } else if (faceWidth <= 100) {
        setStatusMessage('Move closer to the camera');
      } else if (faceWidth >= 300) {
        setStatusMessage('Move back a little');
      }
      setProgress(0);
      faceStableStartRef.current = null;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Face is in position - start/continue stability timer
    setStatusMessage('Hold still...');
    
    if (!faceStableStartRef.current) {
      faceStableStartRef.current = Date.now();
      
      // Start progress animation
      progressIntervalRef.current = setInterval(() => {
        if (!faceStableStartRef.current) return;
        
        const elapsed = Date.now() - faceStableStartRef.current;
        const newProgress = Math.min(elapsed / FACE_STABLE_THRESHOLD, 1);
        setProgress(newProgress);
        
        if (newProgress >= 1 && !hasCapuredRef.current) {
          // Auto-capture!
          hasCapuredRef.current = true;
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
          setStatusMessage('Capturing...');
          handleAutoCapture();
        }
      }, FACE_CHECK_INTERVAL);
    }
  };

  const handleAutoCapture = async () => {
    if (!ready || !cameraRef.current) return;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });
      onCapture(photo.uri);
    } catch {
      hasCapuredRef.current = false;
      showAlert({
        icon: 'camera',
        title: 'Error',
        message: 'Could not take photo. Please try again.',
      });
    } finally {
      setTaking(false);
    }
  };

  // Manual capture fallback
  const handleManualCapture = async () => {
    if (!ready || taking || !cameraRef.current) return;
    hasCapuredRef.current = true;
    setTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });
      onCapture(photo.uri);
    } catch {
      hasCapuredRef.current = false;
      showAlert({
        icon: 'camera',
        title: 'Error',
        message: 'Could not take photo. Please try again.',
      });
    } finally {
      setTaking(false);
    }
  };

  // Determine oval border color based on state
  const getOvalBorderColor = () => {
    if (taking) return '#10B981'; // Green when capturing
    if (faceInPosition) return '#10B981'; // Green when in position
    if (faceDetected) return '#F59E0B'; // Yellow when face detected but not positioned
    return 'rgba(255,255,255,0.75)'; // White default
  };

  return (
    <View style={cs.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        onCameraReady={() => setReady(true)}
        onMountError={(e) => {
          console.warn("Camera mount error:", e);
          showAlert({
            icon: 'camera',
            title: 'Camera Error',
            message: 'Could not start camera. Please try again.',
          });
        }}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
          minDetectionInterval: 100,
          tracking: true,
        }}
      />

      {/* Dark overlay with transparent oval cutout */}
      <View style={cs.overlayWrap} pointerEvents="none">
        {/* Top dark region */}
        <View style={cs.overlayTop} />
        {/* Middle row: left dark | oval hole | right dark */}
        <View style={cs.overlayMiddle}>
          <View style={cs.overlaySide} />
          <View style={cs.ovalHole}>
            <View style={[cs.ovalBorder, { borderColor: getOvalBorderColor() }]} />
          </View>
          <View style={cs.overlaySide} />
        </View>
        {/* Hint text row with status */}
        <View style={cs.hintRow}>
          <View style={cs.statusContainer}>
            {faceInPosition && !taking && (
              <View style={cs.progressContainer}>
                <Progress.Circle
                  size={24}
                  progress={progress}
                  color="#10B981"
                  unfilledColor="rgba(255,255,255,0.2)"
                  borderWidth={0}
                  thickness={3}
                />
              </View>
            )}
            {faceDetected && !faceInPosition && (
              <Scan size={20} color="#F59E0B" style={{ marginRight: 8 }} />
            )}
            <Text style={[
              cs.hint, 
              faceInPosition && { color: '#10B981' },
              faceDetected && !faceInPosition && { color: '#F59E0B' }
            ]}>
              {statusMessage}
            </Text>
          </View>
        </View>
        {/* Bottom dark region */}
        <View style={cs.overlayBottom} />
      </View>

      {/* Manual Shutter (fallback) */}
      <View style={cs.shutterRow}>
        <TouchableOpacity
          style={[cs.shutter, (!ready || taking) && { opacity: 0.5 }]}
          onPress={handleManualCapture}
          disabled={!ready || taking}
          activeOpacity={0.85}
        >
          {taking
            ? <ActivityIndicator color={PRIMARY} />
            : <View style={cs.shutterInner} />
          }
        </TouchableOpacity>
        <Text style={cs.tapHint}>or tap to capture manually</Text>
      </View>
    </View>
  );
};

const OVAL_WIDTH = 230;
const OVAL_HEIGHT = 300;

const cs = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#000", padding: 0, marginTop: 10 },
  overlayWrap:  { ...StyleSheet.absoluteFillObject },
  overlayTop:   { flex: 1,  },
  overlayMiddle:{ flexDirection: "row", height: OVAL_HEIGHT },
  overlaySide:  { flex: 1,  },
  ovalHole:     { width: OVAL_WIDTH, height: OVAL_HEIGHT, alignItems: "center", justifyContent: "center", backgroundColor: "transparent", overflow: "hidden", borderRadius: OVAL_HEIGHT / 2 },
  ovalBorder:   { width: OVAL_WIDTH, height: OVAL_HEIGHT, borderRadius: OVAL_HEIGHT / 2, borderWidth: 3, borderStyle: "solid" },
  hintRow:      { alignItems: "center", paddingVertical: 12 },
  hint:         { fontSize: 14, fontFamily: "PlusJakartaSansMedium", color: "rgba(255,255,255,0.85)" },
  statusContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  progressContainer: { marginRight: 10 },
  overlayBottom:{ flex: 1,  },
  shutterRow:   { position: "absolute", bottom: 48, width: "100%", alignItems: "center" },
  shutter:      { width: 72, height: 72, borderRadius: 99, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(255,255,255,0.4)" },
  shutterInner: { width: 54, height: 54, borderRadius: 99, backgroundColor: PRIMARY },
  tapHint:      { marginTop: 12, fontSize: 12, fontFamily: "PlusJakartaSans", color: "rgba(255,255,255,0.5)" },
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
const DoneStep = ({ onContinue }) => (
  <View style={ds.container}>
    <View style={ds.iconWrap}>
      <CheckCircle size={52} color="#10B981" strokeWidth={1.5} />
    </View>
    <Text style={ds.title}>Verified! 🎉</Text>
    <Text style={ds.body}>
      Your identity has been confirmed. You now have a verified badge on your profile
      — matches can trust it&apos;s really you.
    </Text>
    <TouchableOpacity style={ds.btn} onPress={onContinue} activeOpacity={0.85}>
      <Text style={ds.btnText}>Continue →</Text>
    </TouchableOpacity>
  </View>
);

const ds = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, backgroundColor: "#121212" },
  iconWrap:  { width: 96, height: 96, borderRadius: 99, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title:     { fontSize: 24, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5', marginBottom: 10, textAlign: "center" },
  body:      { fontSize: 16, fontFamily: "PlusJakartaSans", color: '#9CA3AF', textAlign: "center", lineHeight: 22, marginBottom: 36 },
  btn:       { backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16, paddingHorizontal: 48 },
  btnText:   { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VerificationScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [permission, requestPermission] = useCameraPermissions();
  const [step,       setStep]           = useState(STEP.INTRO);
  const { setVerificationStep } = useVerificationStep();

  // Broadcast step changes to the layout so it can hide the header on camera
  useEffect(() => {
    setVerificationStep(step);
  }, [step, setVerificationStep]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [draftMedia, setDraftMedia] = useState([]);

  // Prefer staged onboarding media so verification compares against the latest main photo.
  useEffect(() => {
    (async () => {
      try {
        const [draft, draftMainPhotoUrl] = await Promise.all([
          getOnboardingProfileMediaDraft(),
          getOnboardingDraftMainPhotoUrl(),
        ]);
        if (Array.isArray(draft)) {
          setDraftMedia(draft);
        }

        if (draftMainPhotoUrl) {
          setProfilePhotoUrl(draftMainPhotoUrl);
          return;
        }

        const profile = await profileService.getMyProfile({ force: true });
        const firstImage = Array.isArray(profile?.images) && profile.images.length > 0
          ? profile.images.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]
          : null;
        if (firstImage?.url) setProfilePhotoUrl(firstImage.url);
      } catch {
        // Silently fail — the shield icon will show as fallback
      }
    })();
  }, []);
  const [photoUri,   setPhotoUri]       = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  const handleStart = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showAlert({
          icon: 'camera',
          title: 'Camera Required',
          message: 'Please allow camera access to take your verification selfie.',
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
    setSubmitting(true);
    try {
      const token =
        (await tokenManager.getToken()) ||
        (await tokenManager.getOnboardingToken());

      const formData = new FormData();
      formData.append("selfie", {
        uri:  photoUri,
        name: `selfie-${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      draftMedia.forEach((item, index) => {
        if (!item?.uri) return;
        formData.append("profileMedia", {
          uri: item.uri,
          name: item.fileName || `profile-media-${index}.${item.type === 'video' ? 'mp4' : 'jpg'}`,
          type: item.mimeType || (item.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        });
      });

      const response = await apiClient.post("/verification/verify", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // If backend approved, go to Done step
      if (response.data?.status === 'approved') {
        await clearOnboardingProfileMediaDraft();
        setStep(STEP.DONE);
      } else {
        // Shouldn't happen with strict mode, but handle gracefully
        await clearOnboardingProfileMediaDraft();
        setStep(STEP.DONE);
      }
    } catch (err) {
      const code = err?.response?.data?.code;
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Could not submit your selfie. Please try again.";

      if (code === 'FACE_MISMATCH' || code === 'LOW_CONFIDENCE') {
        // Face didn't match or low confidence — prompt retake
        showAlert({
          icon: 'error',
          title: 'Verification Failed',
          message: message,
          actions: [
            { label: 'Retake Selfie', style: 'primary', onPress: () => setStep(STEP.CAMERA) },
            { label: 'Change Main Photo', style: 'secondary', onPress: () => router.push('/upload-photo') },
          ],
        });
      } else if (code === 'INVALID_PROFILE_PHOTO') {
        // Profile photo was rejected by AI
        showAlert({
          icon: 'error',
          title: 'Profile Photo Rejected',
          message: message,
          actions: [
            { label: 'Change My Photo', style: 'primary', onPress: () => router.push('/upload-photo') },
          ],
        });
      } else if (code === 'NO_PROFILE_PHOTO') {
        showAlert({
          icon: 'error',
          title: 'Profile Photo Required',
          message: 'Please upload at least one profile photo before verifying.',
          actions: [
            { label: 'Go to Photos', style: 'primary', onPress: () => router.push('/upload-photo') },
          ],
        });
      } else {
        showAlert({
          icon: 'error',
          title: 'Upload Failed',
          message: message,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push("/(onboarding)/location-access");
  };

  // Navigate to location-access (the final onboarding step that calls finalizeOnboarding)
  const handleDoneContinue = () => {
    router.push("/(onboarding)/location-access");
  };

  const insets = useSafeAreaInsets();
  const isCamera = step === STEP.CAMERA;

  // Camera step renders fullscreen, breaking out of parent SafeAreaView
  if (isCamera) {
    return (
      <View
        style={[
          sc.cameraFullscreen,
          {
            marginTop: -insets.top,
            marginBottom: -insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={[sc.cameraBack, { top: insets.top + 20 }]}
          onPress={() => setStep(STEP.INTRO)}
        >
          <ChevronLeft size={26} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <CameraStep onCapture={handleCapture} showAlert={showAlert} />
      </View>
    );
  }

  return (
    <View style={sc.safe}>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
        {step === STEP.INTRO   && <IntroStep onStart={handleStart} onSkip={handleSkip} profilePhotoUrl={profilePhotoUrl} />}
        {step === STEP.PREVIEW && (
          <PreviewStep
            uri={photoUri}
            onRetake={() => setStep(STEP.CAMERA)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
        {step === STEP.DONE && <DoneStep onContinue={handleDoneContinue} />}
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: "#121212" },
  cameraFullscreen:  { flex: 1, backgroundColor: "#000" },
  cameraBack:        { position: "absolute", left: 16, zIndex: 10, padding: 8, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 99 },
});