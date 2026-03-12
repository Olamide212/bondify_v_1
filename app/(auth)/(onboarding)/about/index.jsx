import { Audio } from "expo-av";
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
import { fonts } from "../../../../constant/fonts";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import AIService, { BIO_TONES } from "../../../../services/aiService";

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
  const [duration, setDuration] = useState(0);
  const [playPos, setPlayPos] = useState(0);
  const [playDuration, setPlayDuration] = useState(0);
  const [recordUri, setRecordUri] = useState(null);

  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Enable microphone access to record your bio.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setPhase("recording");
      setDuration(0);
      setPlayPos(0);
      setPlayDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d + 1 >= 60) {
            stopRecording();
            return 60;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Start recording error:", err);
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    try {
      clearInterval(timerRef.current);

      const rec = recordingRef.current;
      if (!rec) return;

      await rec.stopAndUnloadAsync();
      const tempUri = rec.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

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
    try {
      if (!recordUri) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: recordUri },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 }
      );

      soundRef.current = sound;
      setPhase("playing");
      setPlayPos(0);

      if (status?.durationMillis) {
        setPlayDuration(Math.floor(status.durationMillis / 1000));
      }

      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;

        if (s.durationMillis && s.durationMillis > 0) {
          setPlayDuration(Math.floor(s.durationMillis / 1000));
        }

        setPlayPos(Math.floor((s.positionMillis ?? 0) / 1000));

        if (s.didJustFinish) {
          setPhase("recorded");
          setPlayPos(0);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (err) {
      console.error("Playback error:", err);
      Alert.alert("Error", "Could not play the recording.");
      setPhase("recorded");
    }
  };

  const pausePlayback = async () => {
    try {
      await soundRef.current?.pauseAsync();
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
        onPress: async () => {
          await soundRef.current?.unloadAsync().catch(() => {});
          soundRef.current = null;
          setRecordUri(null);
          setPhase("idle");
          setDuration(0);
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
        backgroundColor: "#F0F9FF",
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: "#BAE6FD",
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
            backgroundColor: "#0284C7",
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
            backgroundColor: "#0284C7",
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
              Recording... {formatTime(duration)}
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
                backgroundColor: "#E0F2FE",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  backgroundColor: "#0284C7",
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
                backgroundColor: "#0284C7",
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
                borderColor: "#BAE6FD",
              }}
            >
              <Trash2 size={14} color="#0284C7" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Use voice option */}
          <TouchableOpacity
            onPress={handleUseVoice}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#E0F2FE",
              borderRadius: 50,
              paddingVertical: 10,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Check size={15} color="#0284C7" strokeWidth={2.5} />
            <Text style={{ color: "#0284C7", fontFamily: fonts.PlusJakartaSansBold, fontSize: 13 }}>
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
  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  const handleUseVoice = (uri) => {
    setVoiceBioUri(uri);
    Alert.alert("Voice bio added!", "Your voice bio is ready to submit.");
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
              className="flex-1 mt-8"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-3xl font-PlusJakartaSansBold mb-4">
                Tell us a little about yourself
              </Text>

              <Text className="text-base font-PlusJakartaSans text-gray-600 mb-6">
                Choose one of three ways: type your bio, let AI write one, or record your voice.
              </Text>

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
                  marginBottom: 24,
                }}
              />

              {/* ── AI suggestion card ── */}
              <AISuggestionCard onUseSuggestion={(text) => setAboutText(text)} />

              {/* ── Voice bio section ── */}
              <VoicePromptSection onUseVoice={handleUseVoice} />
            </ScrollView>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  if (!aboutText && !voiceBioUri) {
                    Alert.alert("Bio required", "Please add a text bio or record a voice bio.");
                    return;
                  }

                  const bioData = {};
                  if (aboutText) bioData.bio = aboutText;
                  if (voiceBioUri) bioData.voiceBio = voiceBioUri;

                  await updateProfileStep(bioData);
                  router.push("/profile-answers");
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default About;