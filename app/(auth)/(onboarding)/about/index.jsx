import React, { useState } from "react";
import {
  ActivityIndicator,
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
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Sparkles, RefreshCw, Check } from "lucide-react-native";
import Button from "../../../../components/ui/Button";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import { fonts } from "../../../../constant/fonts";

const PREDEFINED_BIOS = [
  "Looking for something real and meaningful 💛",
  "Adventure lover seeking a partner in crime 🌍",
  "Coffee addict & dog lover. Let's chat! ☕🐶",
  "Hopeless romantic with a great sense of humor 😄",
  "Living life one adventure at a time ✈️",
  "Foodie who loves trying new restaurants 🍕",
  "Gym enthusiast & Netflix binger 💪📺",
  "Music lover looking for my duet partner 🎵",
  "Simple soul with big dreams ✨",
  "Work hard, love harder ❤️",
  "Just here to meet genuine people 🤝",
  "Swipe right if you love spontaneous road trips 🚗",
];

// ─── AI suggestion card ───────────────────────────────────────────────────────

const AISuggestionCard = ({ onUseSuggestion }) => {
  const [keywords, setKeywords]     = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [used, setUsed]             = useState(false);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.92, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const generateBio = async (retry = false) => {
    if (!keywords.trim() && !retry) {
      setError("Add a few words about yourself first.");
      return;
    }
    setError("");
    setLoading(true);
    setSuggestion("");
    setUsed(false);
    startPulse();

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are helping someone write a dating profile bio. 
Based on these keywords/traits about them: "${keywords || "fun, adventurous, genuine"}"
Write ONE short, warm, and engaging dating profile bio.
Rules:
- Maximum 2 sentences
- Sound natural and human, not corporate
- Include 1-2 relevant emojis
- Make them sound attractive and approachable
- Do NOT use clichés like "love to laugh" or "sapiosexual"
- Return ONLY the bio text, nothing else`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data?.content?.[0]?.text?.trim();

      if (!text) throw new Error("Empty response");
      setSuggestion(text);
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
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: "#E8651A",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Sparkles size={16} color="#fff" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.PlusJakartaSansBold, fontSize: 15, color: "#1a1a1a" }}>
            Write with AI ✨
          </Text>
          <Text style={{ fontFamily: fonts.PlusJakartaSans, fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
            Describe yourself in a few words — we&apos;ll do the rest
          </Text>
        </View>
      </View>

      {/* Keyword input */}
      <TextInput
        placeholder="e.g. outdoorsy, funny, dog dad, architect..."
        placeholderTextColor="#C4A89A"
        value={keywords}
        onChangeText={(t) => { setKeywords(t); setError(""); }}
        style={{
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: error ? "#EF4444" : "#FDD9C0",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 14,
          fontFamily: fonts.PlusJakartaSansMedium,
          color: "#1a1a1a",
        }}
        returnKeyType="done"
        onSubmitEditing={() => generateBio()}
      />

      {!!error && (
        <Text style={{ fontFamily: fonts.PlusJakartaSans, fontSize: 12, color: "#EF4444", marginTop: -8 }}>
          {error}
        </Text>
      )}

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
          {loading ? "Writing your bio…" : "Generate bio"}
        </Text>
      </TouchableOpacity>

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
              {used
                ? <Check size={15} color="#fff" strokeWidth={2.5} />
                : null
              }
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

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const About = () => {
  const [aboutText, setAboutText] = useState("");
  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

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

              {/* Manual bio input */}
              <TextInput
                placeholder="Write your cool intro here..."
                placeholderTextColor="#999"
                value={aboutText}
                onChangeText={setAboutText}
                multiline
                numberOfLines={10}
                style={{
                  backgroundColor: "#f1f1f1",
                  color: "#000",
                  height: 100,
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

              {/* Predefined bios */}
              <Text className="text-lg font-PlusJakartaSansMedium mb-3 text-gray-600">
                Or pick one of these:
              </Text>

              <View className="flex-row flex-wrap gap-2 mb-8">
                {PREDEFINED_BIOS.map((bio, index) => {
                  const isSelected = aboutText === bio;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setAboutText(bio)}
                      className={`px-4 py-3 rounded-full border ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-gray-100 border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-base font-PlusJakartaSansMedium ${
                          isSelected ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {bio}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  await updateProfileStep({ bio: aboutText });
                  router.push("/interests");
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