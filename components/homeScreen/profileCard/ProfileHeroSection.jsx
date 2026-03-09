import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { Briefcase, MapPin, Pause, Play } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { colors } from "../../../constant/colors";
import VerifiedIcon from "../../ui/VerifiedIcon";

// ─── Pulsing waveform bars shown while audio is playing ──────────────────────

const MiniWaveform = ({ isActive }) => {
  const bars = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.35))
  ).current;

  useEffect(() => {
    let anims;
    if (isActive) {
      anims = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 180 + i * 50,
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: 0.25,
              duration: 180 + i * 50,
              useNativeDriver: true,
            }),
          ])
        )
      );
      anims.forEach((a) => a.start());
    } else {
      bars.forEach((bar) =>
        Animated.timing(bar, { toValue: 0.35, duration: 180, useNativeDriver: true }).start()
      );
    }
    return () => anims?.forEach((a) => a.stop());
  }, [isActive]);

  return (
    <View style={wv.row}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[wv.bar, { transform: [{ scaleY: bar }] }]}
        />
      ))}
    </View>
  );
};

const wv = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 3, height: 22 },
  bar: { width: 3, height: 18, borderRadius: 2, backgroundColor: "#fff" },
});

// ─── Voice Prompt pill ────────────────────────────────────────────────────────

const VoicePromptButton = ({ uri }) => {
  const [phase, setPhase] = useState("idle"); // idle | loading | playing | paused
  const soundRef = useRef(null);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const handlePress = async () => {
    if (phase === "playing") {
      await soundRef.current?.pauseAsync();
      setPhase("paused");
      return;
    }

    if (phase === "paused") {
      await soundRef.current?.playAsync();
      setPhase("playing");
      return;
    }

    // idle → load + play
    setPhase("loading");
    try {
      // unload any previous instance
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPhase("playing");

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPhase("idle");
        }
      });
    } catch (err) {
      console.error("VoicePrompt playback error:", err);
      setPhase("idle");
    }
  };

  const isPlaying = phase === "playing";
  const isLoading = phase === "loading";

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.82}
      style={vp.pill}
    >
      {/* mic icon background circle */}
      <View style={vp.iconCircle}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#E8651A" />
        ) : isPlaying ? (
          <Pause size={14} color="#E8651A" strokeWidth={2.5} />
        ) : (
          <Play size={14} color="#E8651A" strokeWidth={2.5} />
        )}
      </View>

      {/* waveform + label */}
      <MiniWaveform isActive={isPlaying} />

      <Text style={vp.label}>
        {isPlaying ? "Playing…" : phase === "paused" ? "Paused" : "Voice prompt"}
      </Text>
    </TouchableOpacity>
  );
};

const vp = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const ProfileHeroSection = ({
  profile,
  currentImageIndex,
  getImageUri,
  openImageModal,
  handleImageLayout,
  isImageCacheHydrated,
  isUriCached,
  onMarkUriLoaded,
}) => {
  const [mainImageLoading, setMainImageLoading] = useState(false);

  const locationLabel = [profile?.distance, profile?.location]
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    const uri = getImageUri(currentImageIndex);
    setMainImageLoading(
      Boolean(uri) && isImageCacheHydrated && !isUriCached(uri)
    );
  }, [currentImageIndex, getImageUri, isImageCacheHydrated, isUriCached]);

  const formatDisplayName = (fullName) => {
    const parts = String(fullName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return "Unknown";
    if (parts.length === 1) return parts[0];
    return `${parts[0]} `;
  };

  const displayName = formatDisplayName(profile?.name);

  return (
    <Pressable onPress={() => openImageModal(currentImageIndex)}>
      <View
        onLayout={(event) => handleImageLayout(0, event)}
        className="shadow-lg overflow-hidden bg-white"
        style={{ width: "100%", height: 820 }}
      >
        <TouchableWithoutFeedback
          onPress={() => openImageModal(currentImageIndex)}
        >
          <View className="relative w-full">
            <Image
              source={{ uri: getImageUri(currentImageIndex) }}
              className="w-full h-full"
              contentFit="cover"
              cachePolicy="memory-disk"
              style={{ width: "100%", height: 950 }}
              onLoadStart={() => {
                const uri = getImageUri(currentImageIndex);
                if (isImageCacheHydrated && !isUriCached(uri)) {
                  setMainImageLoading(true);
                }
              }}
              onLoad={async () => {
                await onMarkUriLoaded(getImageUri(currentImageIndex));
                setMainImageLoading(false);
              }}
              onError={() => setMainImageLoading(false)}
            />

            {mainImageLoading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

            {/* ── Info overlay ── */}
            <View className="absolute bottom-64 left-6 right-6">
              {/* Name + age row */}
              <View className="flex-row items-center mb-3">
                <Text
                  className="text-white text-4xl font-PlusJakartaSansBold mr-2 capitalize"
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-4xl font-PlusJakartaSans">
                    {profile.age}
                  </Text>
                  {profile.verified && <VerifiedIcon />}
                </View>
              </View>

              {/* Voice prompt — shown only when the profile has one */}
              {!!profile?.voicePrompt && (
                <View style={{ marginBottom: 14 }}>
                  <VoicePromptButton uri={profile.voicePrompt} />
                </View>
              )}

              {/* Chips row */}
              <View className="flex-row items-center flex-wrap gap-x-4 gap-y-4">
                {profile.occupation && (
                  <View className="flex-row items-center bg-white px-4 py-2 rounded-full">
                    <Briefcase size={18} color={"#000"} />
                    <Text className="text-black font-PlusJakartaSansSemiBold ml-2 capitalize">
                      {profile.occupation}
                    </Text>
                  </View>
                )}
                {profile.religion && (
                  <View className="flex-row items-center bg-secondary px-4 py-2 rounded-full">
                    <MaterialCommunityIcons
                      name="hands-pray"
                      size={20}
                      color={"#000"}
                    />
                    <Text className="text-black font-PlusJakartaSansSemiBold ml-2 capitalize">
                      {profile.religion}
                    </Text>
                  </View>
                )}
                {locationLabel && (
                  <View className="flex-row items-center bg-white px-4 py-2 rounded-full">
                    <MapPin size={18} color={"#000"} />
                    <Text className="text-black font-PlusJakartaSansSemiBold ml-2">
                      {locationLabel}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Pressable>
  );
};

export default ProfileHeroSection;