// /**
//  * app/(root)/(profile)/verification.jsx
//  *
//  * Selfie verification screen — Settings entry point.
//  *
//  * BUG FIX: endpoint was /verification/verify (no such route → server returned 400).
//  *          Correct route is /profile/verify (profileRoutes.js is mounted at /api/profile).
//  *
//  * Flow: INTRO → CAMERA → PREVIEW → DONE
//  * 
//  * Uses expo-face-detector for liveness detection and auto-capture.
//  */

// import { CameraView, useCameraPermissions } from "expo-camera";
// import * as FaceDetector from 'expo-face-detector';
// import { useRouter } from "expo-router";
// import {
//   Camera,
//   CheckCircle,
//   ChevronLeft,
//   RefreshCw,
//   Scan,
//   ShieldCheck,
// } from "lucide-react-native";
// import { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Image,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import * as Progress from 'react-native-progress';
// import { SafeAreaView } from "react-native-safe-area-context";
// import { colors } from "../../../constant/colors";
// import { useAlert } from "../../../context/AlertContext";
// import apiClient from "../../../utils/axiosInstance";
// import { tokenManager } from "../../../utils/tokenManager";

// const PRIMARY = colors.primary;

// // ─── Steps ────────────────────────────────────────────────────────────────────
// const STEP = { INTRO: "intro", CAMERA: "camera", PREVIEW: "preview", DONE: "done" };

// // ─── Intro ────────────────────────────────────────────────────────────────────
// const IntroStep = ({ onStart }) => (
//   <ScrollView contentContainerStyle={is.container} showsVerticalScrollIndicator={false}>
//     <View style={is.iconWrap}>
//       <ShieldCheck size={48} color={PRIMARY} strokeWidth={1.5} />
//     </View>

//     <Text style={is.title}>Verify Your Identity</Text>
//     <Text style={is.body}>
//       A quick selfie helps us confirm you&apos;re a real person and builds trust with your
//       matches. Your selfie is only used for verification and is never shown on your profile.
//     </Text>

//     <View style={is.steps}>
//       {[
//         { n: "1", t: "Take a clear selfie", d: "Face the camera in good lighting"      },
//         { n: "2", t: "We review it",        d: "Usually takes a few minutes"            },
//         { n: "3", t: "Get your badge",      d: "Verified badge appears on your profile" },
//       ].map(({ n, t, d }) => (
//         <View key={n} style={is.stepRow}>
//           <View style={is.stepNum}>
//             <Text style={is.stepNumText}>{n}</Text>
//           </View>
//           <View style={{ flex: 1 }}>
//             <Text style={is.stepTitle}>{t}</Text>
//             <Text style={is.stepDesc}>{d}</Text>
//           </View>
//         </View>
//       ))}
//     </View>

//     <TouchableOpacity style={is.btn} onPress={onStart} activeOpacity={0.85}>
//       <Camera size={18} color="#fff" strokeWidth={2} />
//       <Text style={is.btnText}>Open Camera</Text>
//     </TouchableOpacity>
//   </ScrollView>
// );

// const is = StyleSheet.create({
//   container:   { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
//   iconWrap:    { width: 88, height: 88, borderRadius: 99, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20 },
//   title:       { fontSize: 22, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5', textAlign: "center", marginBottom: 10 },
//   body:        { fontSize: 14, fontFamily: "PlusJakartaSans", color: '#9CA3AF', textAlign: "center", lineHeight: 22, marginBottom: 28 },
//   steps:       { gap: 16, marginBottom: 32 },
//   stepRow:     { flexDirection: "row", alignItems: "flex-start", gap: 14 },
//   stepNum:     { width: 32, height: 32, borderRadius: 99, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", flexShrink: 0 },
//   stepNumText: { fontSize: 14, fontFamily: "PlusJakartaSansBold", color: PRIMARY },
//   stepTitle:   { fontSize: 15, fontFamily: "PlusJakartaSansSemiBold", color: '#E5E5E5', marginBottom: 2 },
//   stepDesc:    { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#9CA3AF" },
//   btn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16 },
//   btnText:     { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
// });

// // ─── Face Detection Constants ─────────────────────────────────────────────────
// const FACE_STABLE_THRESHOLD = 2000; // ms face must be stable before auto-capture
// const FACE_CHECK_INTERVAL = 100; // ms between face stability checks
// const OVAL_WIDTH = 230;
// const OVAL_HEIGHT = 290;

// // ─── Camera Step with Face Detection ──────────────────────────────────────────
// const CameraStep = ({ onCapture, showAlert }) => {
//   const cameraRef = useRef(null);
//   const [ready, setReady] = useState(false);
//   const [taking, setTaking] = useState(false);
  
//   // Face detection state
//   const [faceDetected, setFaceDetected] = useState(false);
//   const [faceInPosition, setFaceInPosition] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [statusMessage, setStatusMessage] = useState('Position your face in the oval');
  
//   // Refs for tracking face stability
//   const faceStableStartRef = useRef(null);
//   const progressIntervalRef = useRef(null);
//   const hasCapuredRef = useRef(false);

//   // Clean up interval on unmount
//   useEffect(() => {
//     return () => {
//       if (progressIntervalRef.current) {
//         clearInterval(progressIntervalRef.current);
//       }
//     };
//   }, []);

//   const handleFacesDetected = ({ faces }) => {
//     if (hasCapuredRef.current || taking) return;
    
//     if (faces.length === 0) {
//       setFaceDetected(false);
//       setFaceInPosition(false);
//       setProgress(0);
//       setStatusMessage('Position your face in the oval');
//       faceStableStartRef.current = null;
//       if (progressIntervalRef.current) {
//         clearInterval(progressIntervalRef.current);
//         progressIntervalRef.current = null;
//       }
//       return;
//     }

//     const face = faces[0];
//     setFaceDetected(true);
    
//     // Check if face is properly positioned (centered and appropriately sized)
//     const { bounds, yawAngle, rollAngle } = face;
//     const faceWidth = bounds.size.width;
//     const faceCenterX = bounds.origin.x + faceWidth / 2;
//     const faceCenterY = bounds.origin.y + bounds.size.height / 2;
    
//     // Screen dimensions (approximate center)
//     const screenCenterX = 200; // Approximate center for front camera
//     const screenCenterY = 350;
    
//     // Check positioning criteria:
//     // 1. Face is roughly centered
//     // 2. Face is facing forward (not turned too much)
//     // 3. Face is appropriately sized (not too far/close)
//     const isCentered = Math.abs(faceCenterX - screenCenterX) < 80 && 
//                        Math.abs(faceCenterY - screenCenterY) < 100;
//     const isFacingForward = Math.abs(yawAngle || 0) < 15 && Math.abs(rollAngle || 0) < 15;
//     const isProperSize = faceWidth > 100 && faceWidth < 300;
    
//     const isInPosition = isCentered && isFacingForward && isProperSize;
//     setFaceInPosition(isInPosition);

//     if (!isInPosition) {
//       // Provide guidance
//       if (!isCentered) {
//         setStatusMessage('Move your face to the center');
//       } else if (!isFacingForward) {
//         setStatusMessage('Look straight at the camera');
//       } else if (faceWidth <= 100) {
//         setStatusMessage('Move closer to the camera');
//       } else if (faceWidth >= 300) {
//         setStatusMessage('Move back a little');
//       }
//       setProgress(0);
//       faceStableStartRef.current = null;
//       if (progressIntervalRef.current) {
//         clearInterval(progressIntervalRef.current);
//         progressIntervalRef.current = null;
//       }
//       return;
//     }

//     // Face is in position - start/continue stability timer
//     setStatusMessage('Hold still...');
    
//     if (!faceStableStartRef.current) {
//       faceStableStartRef.current = Date.now();
      
//       // Start progress animation
//       progressIntervalRef.current = setInterval(() => {
//         if (!faceStableStartRef.current) return;
        
//         const elapsed = Date.now() - faceStableStartRef.current;
//         const newProgress = Math.min(elapsed / FACE_STABLE_THRESHOLD, 1);
//         setProgress(newProgress);
        
//         if (newProgress >= 1 && !hasCapuredRef.current) {
//           // Auto-capture!
//           hasCapuredRef.current = true;
//           clearInterval(progressIntervalRef.current);
//           progressIntervalRef.current = null;
//           setStatusMessage('Capturing...');
//           handleAutoCapture();
//         }
//       }, FACE_CHECK_INTERVAL);
//     }
//   };

//   const handleAutoCapture = async () => {
//     if (!ready || !cameraRef.current) return;
//     setTaking(true);
//     try {
//       const photo = await cameraRef.current.takePictureAsync({
//         quality: 0.8,
//         base64: false,
//         exif: false,
//       });
//       onCapture(photo.uri);
//     } catch {
//       hasCapuredRef.current = false;
//       showAlert({
//         icon: 'camera',
//         title: 'Error',
//         message: 'Could not take photo. Please try again.',
//         actions: [{ label: 'OK', style: 'primary' }],
//       });
//     } finally {
//       setTaking(false);
//     }
//   };

//   // Manual capture fallback
//   const handleManualCapture = async () => {
//     if (!ready || taking || !cameraRef.current) return;
//     hasCapuredRef.current = true;
//     setTaking(true);
//     try {
//       const photo = await cameraRef.current.takePictureAsync({
//         quality: 0.8,
//         base64: false,
//         exif: false,
//       });
//       onCapture(photo.uri);
//     } catch {
//       hasCapuredRef.current = false;
//       showAlert({
//         icon: 'camera',
//         title: 'Error',
//         message: 'Could not take photo. Please try again.',
//         actions: [{ label: 'OK', style: 'primary' }],
//       });
//     } finally {
//       setTaking(false);
//     }
//   };

//   // Determine oval border color based on state
//   const getOvalBorderColor = () => {
//     if (taking) return '#10B981'; // Green when capturing
//     if (faceInPosition) return '#10B981'; // Green when in position
//     if (faceDetected) return '#F59E0B'; // Yellow when face detected but not positioned
//     return 'rgba(255,255,255,0.75)'; // White default
//   };

//   return (
//     <View style={cs.container}>
//       <CameraView
//         ref={cameraRef}
//         style={StyleSheet.absoluteFill}
//         facing="front"
//         onCameraReady={() => setReady(true)}
//         onFacesDetected={handleFacesDetected}
//         faceDetectorSettings={{
//           mode: FaceDetector.FaceDetectorMode.fast,
//           detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
//           runClassifications: FaceDetector.FaceDetectorClassifications.none,
//           minDetectionInterval: 100,
//           tracking: true,
//         }}
//       />

//       {/* Dark overlay with oval cutout */}
//       <View style={cs.overlayWrap} pointerEvents="none">
//         <View style={cs.overlayTop} />
//         <View style={cs.overlayMiddle}>
//           <View style={cs.overlaySide} />
//           <View style={cs.ovalHole}>
//             <View style={[cs.ovalBorder, { borderColor: getOvalBorderColor() }]} />
//           </View>
//           <View style={cs.overlaySide} />
//         </View>
//         {/* Hint text row with status */}
//         <View style={cs.hintRow}>
//           <View style={cs.statusContainer}>
//             {faceInPosition && !taking && (
//               <View style={cs.progressContainer}>
//                 <Progress.Circle
//                   size={24}
//                   progress={progress}
//                   color="#10B981"
//                   unfilledColor="rgba(255,255,255,0.2)"
//                   borderWidth={0}
//                   thickness={3}
//                 />
//               </View>
//             )}
//             {faceDetected && !faceInPosition && (
//               <Scan size={20} color="#F59E0B" style={{ marginRight: 8 }} />
//             )}
//             <Text style={[
//               cs.hint, 
//               faceInPosition && { color: '#10B981' },
//               faceDetected && !faceInPosition && { color: '#F59E0B' }
//             ]}>
//               {statusMessage}
//             </Text>
//           </View>
//         </View>
//         <View style={cs.overlayBottom} />
//       </View>

//       {/* Manual Shutter (fallback) */}
//       <View style={cs.shutterRow}>
//         <TouchableOpacity
//           style={[cs.shutter, (!ready || taking) && { opacity: 0.5 }]}
//           onPress={handleManualCapture}
//           disabled={!ready || taking}
//           activeOpacity={0.85}
//         >
//           {taking
//             ? <ActivityIndicator color={PRIMARY} />
//             : <View style={cs.shutterInner} />
//           }
//         </TouchableOpacity>
//         <Text style={cs.tapHint}>or tap to capture manually</Text>
//       </View>
//     </View>
//   );
// };

// const cs = StyleSheet.create({
//   container:    { flex: 1, backgroundColor: "#000" },
//   overlayWrap:  { ...StyleSheet.absoluteFillObject },
//   overlayTop:   { flex: 1 },
//   overlayMiddle: { flexDirection: "row", height: OVAL_HEIGHT },
//   overlaySide:  { flex: 1 },
//   ovalHole:     { width: OVAL_WIDTH, height: OVAL_HEIGHT, alignItems: "center", justifyContent: "center", backgroundColor: "transparent", overflow: "hidden", borderRadius: OVAL_HEIGHT / 2 },
//   ovalBorder:   { width: OVAL_WIDTH, height: OVAL_HEIGHT, borderRadius: OVAL_HEIGHT / 2, borderWidth: 3, borderStyle: "solid" },
//   hintRow:      { alignItems: "center", paddingVertical: 12 },
//   hint:         { fontSize: 14, fontFamily: "PlusJakartaSansMedium", color: "rgba(255,255,255,0.85)" },
//   statusContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
//   progressContainer: { marginRight: 10 },
//   overlayBottom: { flex: 1 },
//   shutterRow:   { position: "absolute", bottom: 48, width: "100%", alignItems: "center" },
//   shutter:      { width: 72, height: 72, borderRadius: 99, backgroundColor: "#121212", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "rgba(255,255,255,0.4)" },
//   shutterInner: { width: 54, height: 54, borderRadius: 99, backgroundColor: PRIMARY },
//   tapHint:      { marginTop: 12, fontSize: 12, fontFamily: "PlusJakartaSans", color: "rgba(255,255,255,0.5)" },
// });

// // ─── Preview Step ─────────────────────────────────────────────────────────────
// const PreviewStep = ({ uri, onRetake, onSubmit, submitting }) => (
//   <View style={ps.container}>
//     <Image source={{ uri }} style={ps.image} resizeMode="cover" />

//     <View style={ps.actions}>
//       <Text style={ps.label}>Does this selfie look good?</Text>
//       <Text style={ps.sublabel}>Make sure your face is clear and well-lit</Text>

//       <TouchableOpacity
//         style={ps.submitBtn}
//         onPress={onSubmit}
//         disabled={submitting}
//         activeOpacity={0.85}
//       >
//         {submitting
//           ? <ActivityIndicator color="#fff" />
//           : <>
//               <CheckCircle size={18} color="#fff" strokeWidth={2} />
//               <Text style={ps.submitText}>Submit for Verification</Text>
//             </>
//         }
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={ps.retakeBtn}
//         onPress={onRetake}
//         disabled={submitting}
//         activeOpacity={0.8}
//       >
//         <RefreshCw size={16} color={PRIMARY} strokeWidth={2} />
//         <Text style={ps.retakeText}>Retake Photo</Text>
//       </TouchableOpacity>
//     </View>
//   </View>
// );

// const ps = StyleSheet.create({
//   container:  { flex: 1, backgroundColor: "#000" },
//   image:      { flex: 1 },
//   actions:    { backgroundColor: "#121212", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36 },
//   label:      { fontSize: 17, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5', textAlign: "center", marginBottom: 4 },
//   sublabel:   { fontSize: 13, fontFamily: "PlusJakartaSans", color: "#9CA3AF", textAlign: "center", marginBottom: 20 },
//   submitBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PRIMARY, borderRadius: 99, paddingVertical: 16, marginBottom: 12 },
//   submitText: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
//   retakeBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
//   retakeText: { fontSize: 15, fontFamily: "PlusJakartaSansSemiBold", color: PRIMARY },
// });

// // ─── Done Step ────────────────────────────────────────────────────────────────
// const DoneStep = ({ onBack }) => (
//   <View style={ds.container}>
//     <View style={ds.iconWrap}>
//       <CheckCircle size={52} color="#10B981" strokeWidth={1.5} />
//     </View>
//     <Text style={ds.title}>Verified!</Text>
//     <Text style={ds.body}>
//       Your identity has been confirmed. Your profile now shows a verified badge
//       — others can trust it&apos;s really you.
//     </Text>
//     <TouchableOpacity style={ds.btn} onPress={onBack} activeOpacity={0.85}>
//       <Text style={ds.btnText}>Back to Profile</Text>
//     </TouchableOpacity>
//   </View>
// );

// const ds = StyleSheet.create({
//   container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, backgroundColor: "#121212" },
//   iconWrap:  { width: 96, height: 96, borderRadius: 99, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center", marginBottom: 24 },
//   title:     { fontSize: 22, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5', marginBottom: 10, textAlign: "center" },
//   body:      { fontSize: 14, fontFamily: "PlusJakartaSans", color: '#9CA3AF', textAlign: "center", lineHeight: 22, marginBottom: 32 },
//   btn:       { backgroundColor: "#111", borderRadius: 99, paddingVertical: 16, paddingHorizontal: 40 },
//   btnText:   { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: "#fff" },
// });

// // ─── Main Screen ──────────────────────────────────────────────────────────────
// export default function VerificationScreen() {
//   const router = useRouter();
//   const { showAlert } = useAlert();
//   const [token, setToken] = useState(null);

//   const [permission, requestPermission] = useCameraPermissions();
//   const [step,       setStep]           = useState(STEP.INTRO);
//   const [photoUri,   setPhotoUri]       = useState(null);
//   const [submitting, setSubmitting]     = useState(false);

//   // Load token from tokenManager on mount
//   useEffect(() => {
//     (async () => {
//       const retrievedToken = await tokenManager.getToken();
//       setToken(retrievedToken);
//     })();
//   }, []);

//   // ── Start: request camera permission ─────────────────────────────────────
//   const handleStart = async () => {
//     if (!permission?.granted) {
//       const result = await requestPermission();
//       if (!result.granted) {
//         showAlert({
//           icon: 'camera',
//           title: 'Camera Required',
//           message: 'Please allow camera access to take your verification selfie.',
//           actions: [{ label: 'OK', style: 'primary' }],
//         });
//         return;
//       }
//     }
//     setStep(STEP.CAMERA);
//   };

//   const handleCapture = (uri) => {
//     setPhotoUri(uri);
//     setStep(STEP.PREVIEW);
//   };

//   // ── Submit selfie ─────────────────────────────────────────────────────────
//   const handleSubmit = async () => {
//     if (!photoUri) return;
//     setSubmitting(true);
//     try {
//       const formData = new FormData();
//       formData.append("selfie", {
//         uri:  photoUri,
//         name: `selfie-${Date.now()}.jpg`,
//         type: "image/jpeg",
//       });

//       // Correct endpoint: verificationRoutes mounted at /api/verification
//       const response = await apiClient.post("/verification/verify", formData, {
//         headers: {
//           // force multipart; our instance previously defaulted to application/json
//           "Content-Type": "multipart/form-data",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//       });

//       // If backend approved, go to Done step
//       if (response.data?.status === 'approved') {
//         setStep(STEP.DONE);
//       } else {
//         setStep(STEP.DONE);
//       }
//     } catch (err) {
//       const code = err?.response?.data?.code;
//       const message =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Could not submit your selfie. Please try again.";

//       if (code === 'FACE_MISMATCH' || code === 'LOW_CONFIDENCE') {
//         // Face didn't match — prompt retake
//         showAlert({
//           icon: 'error',
//           title: 'Verification Failed',
//           message: message,
//           actions: [
//             { label: 'Retake Selfie', style: 'primary', onPress: () => setStep(STEP.CAMERA) },
//           ],
//         });
//       } else if (code === 'INVALID_PROFILE_PHOTO') {
//         // Profile photo was rejected by AI
//         showAlert({
//           icon: 'error',
//           title: 'Profile Photo Rejected',
//           message: message,
//           actions: [
//             { label: 'Update My Photos', style: 'primary', onPress: () => router.back() },
//           ],
//         });
//       } else if (code === 'NO_PROFILE_PHOTO') {
//         showAlert({
//           icon: 'error',
//           title: 'Profile Photo Required',
//           message: 'Please upload at least one profile photo before verifying.',
//           actions: [
//             { label: 'Go Back', style: 'primary', onPress: () => router.back() },
//           ],
//         });
//       } else {
//         showAlert({
//           icon: 'error',
//           title: 'Upload Failed',
//           message,
//           actions: [{ label: 'OK', style: 'primary' }],
//         });
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <SafeAreaView style={sc.safe} edges={["top"]}>
//       {/* ── Header (hidden on camera/done steps) ── */}
//       {step !== STEP.CAMERA && step !== STEP.DONE && (
//         <View style={sc.header}>
//           <TouchableOpacity
//             onPress={() =>
//               step === STEP.PREVIEW ? setStep(STEP.CAMERA) : router.back()
//             }
//             hitSlop={8}
//           >
//             <ChevronLeft size={26} color="#fff" strokeWidth={2} />
//           </TouchableOpacity>
//           <Text style={sc.headerTitle}>
//             {step === STEP.INTRO ? "Verification" : "Preview Selfie"}
//           </Text>
//           <View style={{ width: 26 }} />
//         </View>
//       )}

//       {/* ── Camera back button ── */}
//       {step === STEP.CAMERA && (
//         <TouchableOpacity
//           style={sc.cameraBack}
//           onPress={() => setStep(STEP.INTRO)}
//         >
//           <ChevronLeft size={26} color="#fff" strokeWidth={2} />
//         </TouchableOpacity>
//       )}

//       <View style={{ flex: 1 }}>
//         {step === STEP.INTRO   && <IntroStep onStart={handleStart} />}
//         {step === STEP.CAMERA  && <CameraStep onCapture={handleCapture} showAlert={showAlert} />}
//         {step === STEP.PREVIEW && (
//           <PreviewStep
//             uri={photoUri}
//             onRetake={() => setStep(STEP.CAMERA)}
//             onSubmit={handleSubmit}
//             submitting={submitting}
//           />
//         )}
//         {step === STEP.DONE && <DoneStep onBack={() => router.back()} />}
//       </View>
//     </SafeAreaView>
//   );
// }

// const sc = StyleSheet.create({
//   safe:        { flex: 1, backgroundColor: "#121212" },
//   header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.whiteLight },
//   headerTitle: { fontSize: 16, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5' },
//   cameraBack:  { position: "absolute", top: 52, left: 16, zIndex: 10, padding: 8, backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 99 },
// });



/**
 * app/(root)/(profile)/verification.jsx
 *
 * Settings entry-point for selfie verification.
 * All UI logic lives in VerificationFlow.
 */

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import VerificationFlow from "../../../components/common/VerificationFlow";
import { tokenManager } from "../../../utils/tokenManager";
import { useEffect, useState } from "react";

export default function VerificationScreen() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    (async () => {
      const t = await tokenManager.getToken();
      setAuthToken(t);
    })();
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <VerificationFlow
        mode="settings"
        authToken={authToken}
        onComplete={() => router.back()}
        onBack={() => router.back()}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#121212" },
});