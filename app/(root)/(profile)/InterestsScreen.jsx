import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
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
import { useLookupOptions } from "../../../hooks/useLookupOptions";
import { profileService } from "../../../services/profileService";

const InterestsScreen = () => {
  const router = useRouter();
  const { options: interestOptions } = useLookupOptions("interests");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async ({ force = false, showLoading = true } = {}) => {
    try {
      if (showLoading) setLoading(true);
      const userProfile = await profileService.getMyProfile({ force });
      setSelectedInterests(Array.isArray(userProfile?.interests) ? userProfile.interests : []);
    } catch (error) {
      console.error("Failed to load interests:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile({ force: false, showLoading: selectedInterests.length === 0 });
    }, [loadProfile, selectedInterests.length])
  );

  const allOptions = useMemo(() => {
    const fromLookup = Array.isArray(interestOptions) ? interestOptions : [];
    const existing = selectedInterests
      .filter((value) => !fromLookup.some((option) => option.value === value))
      .map((value) => ({
        label: value
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        value,
      }));

    return [...fromLookup, ...existing];
  }, [interestOptions, selectedInterests]);

  const toggleInterest = (value) => {
    setSelectedInterests((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
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
        leftIcon={<ArrowLeft />}
        className="bg-white"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#5A56D0" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-xl font-SatoshiBold mb-3">Select your interests</Text>
          <View className="flex-row flex-wrap gap-2">
            {allOptions.map((option) => {
              const selected = selectedInterests.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => toggleInterest(option.value)}
                  className={`px-4 py-2 rounded-full border ${
                    selected
                      ? "bg-secondary border-secondary"
                      : "bg-white border-[#D1D1D1]"
                  }`}
                >
                  <Text
                    className={`font-SatoshiMedium ${
                      selected ? "text-black" : "text-black"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      <View className="px-4 py-3 bg-white">
        <Button
          title={saving ? "Saving..." : "Save"}
          variant="gradient"
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </SafeAreaView>
  );
};

export default InterestsScreen;
