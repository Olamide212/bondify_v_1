import {
    AudioModule,
    RecordingPresets,
    createAudioPlayer,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { File, Paths } from "expo-file-system/next";
import { useRouter } from "expo-router";
import { Check, Info, Mic, Pause, Play, Square, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import BaseModal from "../../../../components/modals/BaseModal";
import Button from "../../../../components/ui/Button";
import { colors } from "../../../../constant/colors";
import { fonts } from "../../../../constant/fonts";
import { profileService } from "../../../../services/profileService";

// ─── Voice Bio Benefits Component ─────────────────────────────

const VoiceBioBenefits = () => {
  const benefits = [
    "Stand out from the crowd—most profiles are text-only!",
    "Show your real personality with tone, energy, and humor",
    "Make a stronger first impression and build instant connection",
    "Increase your match potential with 2-3x more engagement",
    "Express emotions and warmth that text can't capture",
    "Save time on messaging with faster, deeper conversations",
    "Boost confidence and have fun showcasing your best self"
  ];

  return (
    <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
      <Text style={{
        fontFamily: fonts.PlusJakartaSansBold,
        fontSize: 18,
        color: "#000",
        marginBottom: 12,
        textAlign: 'center'
      }}>
        Why record a voice bio?
      </Text>
      <View style={{ gap: 8 }}>
        {benefits.map((benefit, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={{ color: "#000", fontSize: 14, fontFamily: fonts.PlusJakartaSansBold }}>•</Text>
            <Text style={{
              fontFamily: fonts.PlusJakartaSansMedium,
              fontSize: 15,
              color: '#374151',
              flex: 1,
              lineHeight: 20
            }}>
              {benefit}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Voice Prompt Section ─────────────────────────────────────────────────────

const VoicePromptSection = ({ onUseVoice }) => {
  const [phase, setPhase] = useState("idle"); // idle | recording | recorded | playing
  const [playPos, setPlayPos] = useState(0);
  const [playDuration, setPlayDuration] = useState(0);
  const [recordUri, setRecordUri] = useState(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const recDurationS  = Math.floor((recorderState.durationMillis ?? 0) / 1000);

  const playerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.removeAllListeners("playbackStatusUpdate");
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  // Auto-stop recording at 60 s
  useEffect(() => {
    if (phase === "recording" && recDurationS >= 60) {
      stopRecording();
    }
  }, [recDurationS, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission needed", "Enable microphone access to record your bio.");
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setPhase("recording");
      setPlayPos(0);
      setPlayDuration(0);
    } catch (err) {
      console.error("Start recording error:", err);
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const tempUri = audioRecorder.uri;

      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

      if (!tempUri) return;

      const fileName = `voice_bio_${Date.now()}.m4a`;
      const destFile = new File(Paths.cache, fileName);
      const srcFile = new File(tempUri);
      await srcFile.copy(destFile);

      setRecordUri(destFile.uri);
      setPhase("recorded");
    } catch (err) {
      console.error("Stop recording error:", err);
      Alert.alert("Error", "Could not save recording. Please try again.");
    }
  };

  const startPlayback = async () => {
    if (!recordUri) return;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

      if (playerRef.current) {
        playerRef.current.removeAllListeners("playbackStatusUpdate");
        playerRef.current.remove();
        playerRef.current = null;
      }

      const player = createAudioPlayer({ uri: recordUri });
      playerRef.current = player;
      setPhase("playing");
      setPlayPos(0);

      player.addListener("playbackStatusUpdate", (status) => {
        if (!status.isLoaded) return;
        if (status.currentTime !== undefined) setPlayPos(Math.round(status.currentTime));
        if (status.duration !== undefined && !isNaN(status.duration)) setPlayDuration(Math.round(status.duration));
        if (status.didJustFinish) {
          setPhase("recorded");
          setPlayPos(0);
          player.removeAllListeners("playbackStatusUpdate");
          player.remove();
          playerRef.current = null;
        }
      });

      player.play();
    } catch (err) {
      console.error("Playback error:", err);
      Alert.alert("Error", "Could not play the recording.");
    }
  };

  const pausePlayback = () => {
    try {
      playerRef.current?.pause();
      setPhase("recorded");
    } catch (err) {
      console.error("Pause error:", err);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const handleDelete = () => {
    Alert.alert("Delete recording", "Remove this voice bio?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (playerRef.current) {
            playerRef.current.removeAllListeners("playbackStatusUpdate");
            playerRef.current.remove();
            playerRef.current = null;
          }
          setRecordUri(null);
          setPhase("idle");
          setPlayPos(0);
          setPlayDuration(0);
        },
      },
    ]);
  };

  const handleUseVoice = () => {
    if (recordUri) {
      onUseVoice(recordUri);
    }
  };

  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.primaryBorder,
        padding: 18,
        marginBottom: 24,
        gap: 14,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mic size={16} color="#fff" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.PlusJakartaSansBold, fontSize: 15, color: "#1a1a1a" }}>
            Voice Bio 🎤
          </Text>
          <Text style={{ fontFamily: fonts.PlusJakartaSans, fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
            Record yourself introducing yourself
          </Text>
        </View>
      </View>

      {/* Recording phase */}
      {phase === "idle" && !recordUri && (
        <TouchableOpacity
          onPress={startRecording}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 50,
            paddingVertical: 12,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Mic size={16} color="#fff" strokeWidth={2} />
          <Text style={{ color: "#fff", fontFamily: fonts.PlusJakartaSansBold, fontSize: 14 }}>
            Start recording
          </Text>
        </TouchableOpacity>
      )}

      {/* Recording active */}
      {phase === "recording" && (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: fonts.PlusJakartaSansMedium, fontSize: 14, color: "#1a1a1a" }}>
              Recording... {formatTime(recDurationS)}
            </Text>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#EF4444",
                shadowColor: "#EF4444",
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 3,
              }}
            />
          </View>
          <TouchableOpacity
            onPress={stopRecording}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#EF4444",
              borderRadius: 50,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Square size={16} color="#fff" strokeWidth={2} />
            <Text style={{ color: "#fff", fontFamily: fonts.PlusJakartaSansBold, fontSize: 14 }}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recorded/Playback phase */}
      {recordUri && (
        <View style={{ gap: 12 }}>
          {/* Progress bar */}
          <View style={{ gap: 4 }}>
            <View
              style={{
                height: 4,
                backgroundColor: colors.primaryLight,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  backgroundColor: colors.primary,
                  width: `${playDuration > 0 ? (playPos / playDuration) * 100 : 0}%`,
                }}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 }}>
              <Text style={{ fontFamily: fonts.PlusJakartaSans, fontSize: 11, color: "#9CA3AF" }}>
                {formatTime(playPos)}
              </Text>
              <Text style={{ fontFamily: fonts.PlusJakartaSans, fontSize: 11, color: "#9CA3AF" }}>
                {formatTime(playDuration)}
              </Text>
            </View>
          </View>

          {/* Controls */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={phase === "playing" ? pausePlayback : startPlayback}
              activeOpacity={0.85}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 50,
                paddingVertical: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {phase === "playing" ? (
                <>
                  <Pause size={15} color="#fff" strokeWidth={2.5} />
                  <Text style={{ color: "#fff", fontFamily: fonts.PlusJakartaSansBold, fontSize: 13 }}>
                    Pause
                  </Text>
                </>
              ) : (
                <>
                  <Play size={15} color="#fff" strokeWidth={2.5} />
                  <Text style={{ color: "#fff", fontFamily: fonts.PlusJakartaSansBold, fontSize: 13 }}>
                    Play
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 50,
                borderWidth: 1.5,
                borderColor: colors.primaryBorder,
              }}
            >
              <Trash2 size={14} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Use voice option */}
          <TouchableOpacity
            onPress={handleUseVoice}
            activeOpacity={0.85}
            style={{
              backgroundColor: colors.primaryLight,
              borderRadius: 50,
              paddingVertical: 10,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Check size={15} color={colors.primary} strokeWidth={2.5} />
            <Text style={{ color: colors.primary, fontFamily: fonts.PlusJakartaSansBold, fontSize: 13 }}>
              Use this voice bio
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const VoicePrompt = () => {
  const [voiceBioUri, setVoiceBioUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const router = useRouter();

  const handleUseVoice = (uri) => {
    setVoiceBioUri(uri);
    Alert.alert("✅ Voice bio added!", "Your recording is saved. Tap Continue to submit.");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-3">
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <View className="mt-8 mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-3xl font-PlusJakartaSansBold">
                    Add a voice bio
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowBenefitsModal(true)}
                    className="ml-2"
                  >
                    <Info size={20} color={"#000"} />
                  </TouchableOpacity>
                </View>
                <Text className="text-base font-PlusJakartaSansMedium">
                  Record yourself introducing yourself to make your profile stand out.
                </Text>
              </View>

              {/* Voice bio section */}
              <VoicePromptSection onUseVoice={handleUseVoice} />

            </ScrollView>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    if (voiceBioUri) {
                      await profileService.uploadVoicePrompt(voiceBioUri);
                      Alert.alert("✅ Voice bio submitted!", "Your recording has been saved successfully.");
                    }
                    router.push("/profile-prompts");
                  } catch (err) {
                    console.error("Voice upload error:", err);
                    const errorMsg = err?.response?.data?.message || "Could not save voice recording.";
                    Alert.alert("Voice upload failed", errorMsg);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Benefits Modal */}
      <BaseModal
        visible={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
      >
        <VoiceBioBenefits />
      </BaseModal>
    </SafeAreaView>
  );
};

export default VoicePrompt;