import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../components/headers/GeneralHeader";
import Button from "../../../components/ui/Button";
import { colors } from "../../../constant/colors";
import { profileService } from "../../../services/profileService";

// ─── Grouped categories — mirrors the onboarding Interests screen ─────────────
const INTEREST_CATEGORIES = [
  {
    title: "🧠 Traits",
    items: ["Empathy", "Humor", "Confidence", "Kindness"],
  },
  {
    title: "🎮 Entertainment",
    items: ["Gaming", "Streaming", "Board Games", "Karaoke"],
  },
  {
    title: "⚽ Sports",
    items: ["Football", "Basketball", "Tennis", "Hiking", "Running"],
  },
  {
    title: "🎨 Art",
    items: ["Drawing", "Painting", "Photography", "Sculpting"],
  },
  {
    title: "📚 Reading",
    items: ["Fiction", "Non-fiction", "Manga", "Comics"],
  },
  {
    title: "🎬 Films and TV",
    items: ["Movies", "TV Shows", "Documentaries", "Anime"],
  },
  {
    title: "💡 Creativity",
    items: ["Writing", "Design", "DIY Projects", "Coding"],
  },
  {
    title: "🍔 Food and Drinks",
    items: ["Cooking", "Baking", "Wine Tasting", "Coffee Brewing"],
  },
  {
    title: "🐶 Pets",
    items: ["Dogs", "Cats", "Birds", "Aquariums"],
  },
  {
    title: "🎉 Hanging out",
    items: ["Travel", "Partying", "Picnics", "Volunteering"],
  },
];

// Flat list of every known interest value for quick lookup
const ALL_KNOWN_INTERESTS = INTEREST_CATEGORIES.flatMap((c) => c.items);

const InterestsScreen = () => {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [extraInterests, setExtraInterests] = useState([]); // interests from API not in categories
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing profile interests on focus
  const loadProfile = useCallback(
    async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) setLoading(true);
        const userProfile = await profileService.getMyProfile({ force: false });
        const saved = Array.isArray(userProfile?.interests) ? userProfile.interests : [];
        setSelectedInterests(saved);

        // Any saved interest not in our categories gets shown as an "Other" chip
        const extras = saved.filter((v) => !ALL_KNOWN_INTERESTS.includes(v));
        setExtraInterests(extras);
      } catch (error) {
        console.error("Failed to load interests:", error);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    []
  );

  const hasFetchedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Only fetch once per mount — never re-fetch when selections change,
      // otherwise every toggle overwrites local state with the API response
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        loadProfile({ showLoading: true });
      }
    }, [loadProfile])
  );

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await profileService.updateProfile({ interests: selectedInterests });
      router.back();
    } catch (error) {
      console.error("Failed to save interests:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <GeneralHeader
        title="Interests"
        leftIcon={<ArrowLeft color={colors.textPrimary ?? "#111827"} />}
        className="bg-white"
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-2xl font-PlusJakartaSansBold mb-6">
            What are your interests?
          </Text>

          {/* ── Grouped categories ── */}
          {INTEREST_CATEGORIES.map((category) => (
            <View key={category.title} className="mb-6">
              <Text className="font-PlusJakartaSansBold text-lg mb-3" style={{ color: colors.primary }}>
                {category.title}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {category.items.map((interest) => {
                  const selected = selectedInterests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={interest}
                      onPress={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full border ${
                        selected
                          ? "bg-primary border-primary"
                          : "bg-white border-[#D1D1D1]"
                      }`}
                    >
                      <Text
                        className={`font-PlusJakartaSansMedium ${
                          selected ? "text-white" : "text-black"
                        }`}
                      >
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* ── Extra interests saved from API that don't appear in categories ── */}
          {extraInterests.length > 0 && (
            <View className="mb-6">
              <Text className="font-PlusJakartaSansBold text-lg mb-3" style={{ color: colors.primary }}>
                ✨ Other
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {extraInterests.map((interest) => {
                  const selected = selectedInterests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={interest}
                      onPress={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full border ${
                        selected
                          ? "bg-primary border-primary"
                          : "bg-white border-[#D1D1D1]"
                      }`}
                    >
                      <Text
                        className={`font-PlusJakartaSansMedium ${
                          selected ? "text-white" : "text-black"
                        }`}
                      >
                        {interest
                          .split("-")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Selection count */}
          {selectedInterests.length > 0 && (
            <Text className="text-center font-PlusJakartaSans text-sm mt-2" style={{ color: colors.primary }}>
              {selectedInterests.length} selected
            </Text>
          )}
        </ScrollView>
      )}

      {/* Save button */}
      <View className="px-4 py-3 bg-white border-t border-gray-100">
        <Button
          title={saving ? "Saving..." : "Save"}
          variant="gradient"
          onPress={handleSave}
          disabled={saving || selectedInterests.length === 0}
        />
      </View>
    </SafeAreaView>
  );
};

export default InterestsScreen;