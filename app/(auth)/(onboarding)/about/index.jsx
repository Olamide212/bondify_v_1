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
import { Check, Mic, Pause, Play, RefreshCw, Sparkles, Square, Trash2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import Button from "../../../../components/ui/Button";
import { colors } from "../../../../constant/colors";
import { fonts } from "../../../../constant/fonts";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import AIService, { BIO_TONES } from "../../../../services/aiService";
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
    <View style={{ marginBottom: 20 }}>
      <Text style={{
        fontFamily: fonts.PlusJakartaSansBold,
        fontSize: 16,
        color: colors.primary,
        marginBottom: 12,
        textAlign: 'center'
      }}>
        Why record a voice bio?
      </Text>
      <View style={{ gap: 8 }}>
        {benefits.map((benefit, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={{ color: colors.primary, fontSize: 14, fontFamily: fonts.PlusJakartaSansBold }}>•</Text>
            <Text style={{
              fontFamily: fonts.PlusJakartaSans,
              fontSize: 14,
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

// ─── AI Suggestion Card (using backend AI service) ─────────────────────────────

const AISuggestionCard = ({ onUseSuggestion, onVoicePermissionRequest }) => {
  const [selectedTone, setSelectedTone] = useState("sincere");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [used, setUsed] = useState(false);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.92, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const generateBio = async (retry = false) => {
    setError("");
    setLoading(true);
    setSuggestion("");
    setUsed(false);
    startPulse();

    try {
      const response = await AIService.generateBio({ tone: selectedTone });
      setSuggestion(response.bio || "");
    } catch (err) {
      console.error("AI bio error:", err);
      setError("Couldn't generate a suggestion. Try again.");
    } finally {
      setLoading(false);
      stopPulse();
    }
  };

  const handleUse = () => {
    onUseSuggestion(suggestion);
    setUsed(true);
  };

  return (
    <View
      style={{
        backgroundColor: "#FFF8F3",
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: "#FDD9C0",
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
            backgroundColor: "#E8651A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={16} color="#fff" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.PlusJakartaSansBold, fontSize: 15, color: "#1a1a1a" }}>
            Write with AI ✨
          </Text>
          <Text style={{ fontFamily: fonts.PlusJakartaSans, fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
            Pick a vibe, we&apos;ll craft your bio
          </Text>
        </View>
      </View>

      {/* Tone selector */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontFamily: fonts.PlusJakartaSansMedium, fontSize: 12, color: "#6B7280" }}>Select tone:</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {BIO_TONES.map((tone) => (
            <TouchableOpacity
              key={tone.key}
              onPress={() => setSelectedTone(tone.key)}
              activeOpacity={0.7}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 50,
                backgroundColor: selectedTone === tone.key ? "#E8651A" : "#fff",
                borderWidth: 1,
                borderColor: selectedTone === tone.key ? "#E8651A" : "#FDD9C0",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.PlusJakartaSansMedium,
                  fontSize: 12,
                  color: selectedTone === tone.key ? "#fff" : "#1a1a1a",
                }}
              >
                {tone.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generate button */}
      <TouchableOpacity
        onPress={() => generateBio()}
        disabled={loading}
        activeOpacity={0.85}
        style={{
          backgroundColor: loading ? "#F5A878" : "#E8651A",
          borderRadius: 50,
          paddingVertical: 12,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Sparkles size={16} color="#fff" strokeWidth={2} />
        )}
        <Text style={{ color: "#fff", fontFamily: fonts.PlusJakartaSansBold, fontSize: 14 }}>
          {loading ? "Crafting bio…" : "Generate bio"}
        </Text>
      </TouchableOpacity>

      {!!error && (
        <Text style={{ fontFamily: fonts.PlusJakartaSans, fontSize: 12, color: "#EF4444", marginTop: -8 }}>
          {error}
        </Text>
      )}

      {/* Suggestion result */}
      {!!suggestion && (
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            backgroundColor: "#fff",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#FDD9C0",
            padding: 14,
            gap: 12,
          }}
        >
          <Text style={{ fontFamily: fonts.PlusJakartaSansMedium, fontSize: 14, color: "#1a1a1a", lineHeight: 22 }}>
            {suggestion}
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* Use this */}
            <TouchableOpacity
              onPress={handleUse}
              activeOpacity={0.85}
              style={{
                flex: 1,
                backgroundColor: used ? "#22C55E" : "#E8651A",
                borderRadius: 50,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {used ? <Check size={15} color="#fff" strokeWidth={2.5} /> : null}
              <Text style={{ color: "#fff", fontFamily: fonts.PlusJakartaSansBold, fontSize: 13 }}>
                {used ? "Added to bio" : "Use this"}
              </Text>
            </TouchableOpacity>

            {/* Regenerate */}
            <TouchableOpacity
              onPress={() => generateBio(true)}
              disabled={loading}
              activeOpacity={0.82}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 50,
                borderWidth: 1.5,
                borderColor: "#FDD9C0",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} color="#E8651A" strokeWidth={2.5} />
              <Text style={{ fontFamily: fonts.PlusJakartaSansBold, fontSize: 13, color: "#E8651A" }}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
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
      setPhase("recorded");
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

const About = () => {
  const [aboutText, setAboutText] = useState("");
  const [voiceBioUri, setVoiceBioUri] = useState(null);
  const [activeTab, setActiveTab] = useState("write"); // "write" or "record"
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

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
              <Text className="text-3xl font-PlusJakartaSansBold mb-2">
                Tell us about yourself
              </Text>
              <Text className="text-base font-PlusJakartaSans text-gray-600">
                You can write, use AI, or record — or combine all three!
              </Text>
            </View>
                 {/* Tab selector */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={() => setActiveTab("write")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: activeTab === "write" ? "#E8651A" : "#f1f1f1",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{
                  fontFamily: fonts.PlusJakartaSansBold,
                  fontSize: 15,
                  color: activeTab === "write" ? "#fff" : "#666",
                }}
                >
                  📝 Write Bio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("record")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: activeTab === "record" ? colors.primary : "#f1f1f1",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{
                  fontFamily: fonts.PlusJakartaSansBold,
                  fontSize: 15,
                  color: activeTab === "record" ? "#fff" : "#666",
                }}
                >
                  🎤 Record
                </Text>
              </TouchableOpacity>
            </View>
              {/* Write Tab */}
              {activeTab === "write" && (
                <View>
                  {/* Manual bio input */}
                  <TextInput
                    placeholder="Write your bio here..."
                    placeholderTextColor="#999"
                    value={aboutText}
                    onChangeText={setAboutText}
                    multiline
                    numberOfLines={6}
                    style={{
                      backgroundColor: "#f1f1f1",
                      color: "#000",
                      height: 120,
                      padding: 16,
                      borderRadius: 12,
                      textAlignVertical: "top",
                      fontSize: 16,
                      fontFamily: fonts.PlusJakartaSansMedium,
                      marginBottom: 20,
                    }}
                  />

                  {/* ── AI suggestion card ── */}
                  <AISuggestionCard onUseSuggestion={(text) => setAboutText(text)} />
                </View>
              )}

              {/* Record Tab */}
              {activeTab === "record" && (
                <View>
                        {/* ── Voice bio section ── */}
                  <VoicePromptSection onUseVoice={handleUseVoice} />
                  {/* ── Voice bio benefits ── */}
                  <VoiceBioBenefits />

            
                </View>
              )}
            </ScrollView>

            {/* Summary of selections
            <View className="mt-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              {aboutText && (
                <Text className="text-sm font-PlusJakartaSansMedium text-blue-900 mb-2">Text bio added</Text>
              )}
              {voiceBioUri && (
                <Text className="text-sm font-PlusJakartaSansMedium text-blue-900">Voice bio recorded</Text>
              )}
              {!aboutText && !voiceBioUri && (
                <Text className="text-sm font-PlusJakartaSansMedium text-gray-600">Add text or voice bio to continue</Text>
              )}
            </View> */}

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  if (!aboutText && !voiceBioUri) {
                    Alert.alert("Bio required", "Please add a text bio, use AI, or record your voice.");
                    return;
                  }

                  setSubmitting(true);
                  try {
                    const bioData = {};
                    if (aboutText) {
                      // Ensure bio isn't too long (backend limit is 500 chars)
                      bioData.bio = aboutText.substring(0, 500);
                    }
                    
                    if (voiceBioUri) {
                      try {
                        await profileService.uploadVoicePrompt(voiceBioUri);
                        Alert.alert("✅ Voice bio submitted!", "Your recording has been saved successfully.");
                      } catch (voiceErr) {
                        console.error("Voice upload error:", voiceErr);
                        const voiceErrorMsg = voiceErr?.response?.data?.message || "Could not save voice recording. Try text bio instead.";
                        Alert.alert("Voice upload failed", voiceErrorMsg);
                      }
                    }

                    // Only update profile with text bio - voice prompt has its own endpoint
                    if (bioData.bio) {
                      await updateProfileStep(bioData);
                    } else if (!voiceBioUri) {
                      // If no text bio and no voice, show error
                      Alert.alert("Bio required", "Please add a text bio or record your voice.");
                      setSubmitting(false);
                      return;
                    }
                    
                    router.push("/profile-answers");
                  } catch (err) {
                    console.error("Bio submission error:", err);
                    const errorMsg = err?.response?.data?.errors?.[0]?.msg || err?.response?.data?.message || err?.message || "Failed to submit bio.";
                    Alert.alert("Error", errorMsg);
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
    </SafeAreaView>
  );
};

export default About;