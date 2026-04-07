/**
 * FilterModal.jsx
 *
 * Changes vs previous version:
 *   1. Location input — text field to filter by city / country
 *   2. LogoLoader overlay — shows while the modal's own async work is in flight
 *      (loading the user's interests from the API on open)
 *   3. All distance values in km (was miles)
 */

import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors, styles } from "../../constant/colors";
import { profileService } from "../../services/profileService";
import ModalHeader from "../headers/ModalHeader";
import BaseModal from "./BaseModal";
import InterestsModal from "./InterestsModal";

const DEFAULT_FILTERS = {
  maxDistance:          100,   // km
  ageRange:             [18, 100],
  showMe:               "everyone",
  interests:            [],
  verifiedOnly:         false,
  activeToday:          false,
  location:             "",
  allowExtendedDistance: false,
};

// ─────────────────────────────────────────────────────────────────────────────

const FilterModal = ({ visible, onClose, initialFilters, onApply }) => {
  const { width } = useWindowDimensions();

  const [maxDistance,           setMaxDistance]           = useState(DEFAULT_FILTERS.maxDistance);
  const [ageRange,              setAgeRange]              = useState(DEFAULT_FILTERS.ageRange);
  const [showMe,                setShowMe]                = useState(DEFAULT_FILTERS.showMe);
  const [selectedInterests,     setSelectedInterests]     = useState([]);
  const [verifiedOnly,          setVerifiedOnly]          = useState(false);
  const [activeToday,           setActiveToday]           = useState(false);
  const [location,              setLocation]              = useState("");
  const [allowExtendedDistance, setAllowExtendedDistance] = useState(false);
  const [myInterests,           setMyInterests]           = useState([]);
  const [interestsLoading,      setInterestsLoading]      = useState(false);
  const [visibleModal,          setVisibleModal]          = useState(null);

  const hydratedFilters = useMemo(
    () => ({ ...DEFAULT_FILTERS, ...(initialFilters || {}) }),
    [initialFilters]
  );

  // Sync state when modal opens or initialFilters changes
  useEffect(() => {
    if (!visible) return;
    setMaxDistance(Number(hydratedFilters.maxDistance || DEFAULT_FILTERS.maxDistance));
    setAgeRange(
      Array.isArray(hydratedFilters.ageRange) ? hydratedFilters.ageRange : DEFAULT_FILTERS.ageRange
    );
    setShowMe(String(hydratedFilters.showMe || DEFAULT_FILTERS.showMe));
    setSelectedInterests(
      Array.isArray(hydratedFilters.interests) ? hydratedFilters.interests : []
    );
    setVerifiedOnly(Boolean(hydratedFilters.verifiedOnly));
    setActiveToday(Boolean(hydratedFilters.activeToday));
    setLocation(String(hydratedFilters.location || ""));
    setAllowExtendedDistance(Boolean(hydratedFilters.allowExtendedDistance));
  }, [hydratedFilters, visible]);

  // Load user's own interests for highlighting shared ones
  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    const load = async () => {
      setInterestsLoading(true);
      try {
        const myProfile = await profileService.getMyProfile();
        if (!isMounted) return;
        setMyInterests(Array.isArray(myProfile?.interests) ? myProfile.interests : []);
      } catch {
        if (!isMounted) return;
        setMyInterests([]);
      } finally {
        if (isMounted) setInterestsLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [visible]);

  const handleReset = () => {
    setMaxDistance(DEFAULT_FILTERS.maxDistance);
    setAgeRange(DEFAULT_FILTERS.ageRange);
    setShowMe(DEFAULT_FILTERS.showMe);
    setSelectedInterests(DEFAULT_FILTERS.interests);
    setVerifiedOnly(DEFAULT_FILTERS.verifiedOnly);
    setActiveToday(DEFAULT_FILTERS.activeToday);
    setLocation(DEFAULT_FILTERS.location);
    setAllowExtendedDistance(DEFAULT_FILTERS.allowExtendedDistance);
  };

  const handleApply = () => {
    onApply?.({
      maxDistance: Number(maxDistance || DEFAULT_FILTERS.maxDistance),
      ageRange,
      showMe,
      interests: selectedInterests,
      verifiedOnly,
      activeToday,
      location: location.trim(),
      allowExtendedDistance,
    });
    onClose?.();
  };

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1}} className="bg-[#121212] rounded-t-3xl overflow-hidden">

          {/* ── Loading overlay — shown while fetching user interests ── */}
          {/* {interestsLoading && (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(255,255,255,0.82)",
                alignItems:      "center",
                justifyContent:  "center",
                zIndex:          99,
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )} */}

          {/* ── Header ── */}
     <ModalHeader
             onClose={onClose}
             centerText="Filter"
             rightText="Reset"
             onRightPress={handleReset}
           />
          {/* ── Content ── */}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >

            {/* ── Maximum Distance ── */}
            <View className="pb-10 ">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xl font-OutfitBold text-white">Maximum Distance</Text>
                <View className="flex-row items-center gap-1 bg-primary/5 px-3 py-2 rounded-full">
                  <Text className="text-lg text-primary font-OutfitBold">
                    {maxDistance} km
                  </Text>
                </View>
              </View>

              <Slider
                style={{ width: "100%", height: 50 }}
                minimumValue={2}
                maximumValue={1000}
                step={1}
                value={maxDistance}
                onValueChange={(value) => setMaxDistance(value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor={colors.primary}
              />

              <View className="flex-row justify-between px-1 -mt-1 mb-3">
                <Text className="text-xs text-white text-gray-400 font-Outfit">2 km</Text>
                <Text className="text-xs text-white text-gray-400 font-Outfit">1,000 km</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setAllowExtendedDistance((prev) => !prev)}
                  className="w-6 h-6 items-center justify-center"
                >
                  <Ionicons
                    name={allowExtendedDistance ? "checkbox" : "square-outline"}
                    size={22}
                    color={allowExtendedDistance ? colors.primary : "#9ca3af"}
                  />
                </TouchableOpacity>
                <Text className="text-base font-OutfitMedium text-white">
                  Show people further away if I run out
                </Text>
              </View>
            </View>

            {/* ── Location ── */}
            <View className="pb-10  mb-4" style={styles.boxContainer}>
              <Text className="text-xl font-OutfitBold text-white mb-3">Location</Text>

              <View
                style={{
                  flexDirection:   "row",
                  alignItems:      "center",
                  backgroundColor: "#1E1E1E",
                  borderRadius:    14,
                  borderWidth:     1,
                  borderColor:     location.trim() ? colors.primary : "#4A4A4A",
                  paddingHorizontal: 14,
                  paddingVertical:   2,
                  gap:             10,
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={location.trim() ? colors.primary : "#9ca3af"}
                />
                <TextInput
                  style={{
                    flex:       1,
                    fontSize:   15,
                    fontFamily: "Outfit",
                    color: '#E5E5E5',
                    paddingVertical: 14,
                  }}
                  placeholder="Filter by city or country"
                  placeholderTextColor="#bbb"
                  value={location}
                  onChangeText={setLocation}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                />
                {location.trim().length > 0 && (
                  <TouchableOpacity onPress={() => setLocation("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>

              <Text className="text-xs text-white font-Outfit mt-2 ml-1">
                Leave blank to use your current location
              </Text>
            </View>

            {/* ── Age Range ── */}
            <View className="pb-10" >
              <View className="flex-row items-center justify-between mt-6 mb-2">
                <Text className="text-xl font-OutfitBold text-white">Age Range</Text>
                <View className="flex-row items-center gap-1 bg-primary/5 px-3 rounded-full">
                  <Text className="text-lg text-primary font-OutfitBold">
                    {ageRange[0]} – {ageRange[1]}
                  </Text>
                </View>
              </View>

              <MultiSlider
                sliderLength={Math.max(240, width - 36)}
                values={ageRange}
                onValuesChange={(values) => setAgeRange(values)}
                min={18}
                max={100}
                step={1}
                trackStyle={{ height: 4, borderRadius: 50 }}
                selectedStyle={{ backgroundColor: colors.primary }}
                unselectedStyle={{ backgroundColor: "#d3d3d3" }}
                markerStyle={{
                  backgroundColor: colors.primary,
                  height: 25, width: 25,
                  borderColor: colors.primary,
                }}
              />
            </View>

            {/* ── Show Me ── */}
            <View className="flex-col w-full" style={styles.boxContainer}>
              <Text className="text-xl font-OutfitBold text-white  mb-2">Show Me</Text>
              <View className="w-full flex-col items-center mb-2 bg-[#1E1E1E] px-2 py-2 rounded-xl">
                <View className="flex-row flex-wrap justify-between gap-5">
                  {[
                    { label: "Men",      value: "men"      },
                    { label: "Women",    value: "women"    },
                    { label: "Everyone", value: "everyone" },
                  ].map((option) => {
                    const isSelected = showMe === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setShowMe(option.value)}
                        className={`px-4 py-2 rounded-xl ${isSelected ? "bg-[#121212]" : ""}`}
                      >
                        <Text
                          className={`font-OutfitBold text-lg ${
                            isSelected ? "text-primary" : "text-white"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* ── Interests ── */}
            <TouchableOpacity
              className="py-6 mt-5"
              onPress={() => setVisibleModal("interests")}
              style={styles.boxContainer}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-OutfitBold text-white">Interests</Text>
                <Text className="text-base font-OutfitMedium text-primary">Edit All</Text>
              </View>

              {(() => {
                const list = selectedInterests.length > 0 ? selectedInterests : myInterests;
                if (!list.length) {
                  return (
                    <Text className="text-gray-400 mt-2">
                      Tap to choose the vibes you vibe with
                    </Text>
                  );
                }
                return (
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {list.map((interest) => {
                      const isShared = myInterests.includes(interest);
                      return (
                        <View
                          key={interest}
                          className={`px-3 py-1 rounded-full border ${
                            isShared ? "bg-primary/10 border-primary" : "bg-transparent border-white"
                          }`}
                        >
                          <Text
                            className={`text-lg font-OutfitMedium ${
                              isShared ? "text-primary" : "text-white"
                            }`}
                          >
                            {interest}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
            </TouchableOpacity>

            {/* ── Advanced Filters ── */}
            <Text className="text-xl text-white font-OutfitBold mt-8 mb-4">Advanced filter</Text>

            <View className="flex-row justify-between items-center py-4">
              <View className="flex-row items-center gap-3">
                <View className="p-3 rounded-full bg-blue-100 items-center justify-center">
                  <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
                </View>
                <Text className="text-[16px] font-OutfitMedium text-white">Verified user only</Text>
              </View>
              <Switch
                value={verifiedOnly}
                onValueChange={setVerifiedOnly}
                trackColor={{ false: "#d1d5db", true: colors.primary }}
                thumbColor={verifiedOnly ? "#fff" : "#f4f3f4"}
              />
            </View>

            <View className="flex-row justify-between items-center py-4">
              <View className="flex-row items-center gap-3">
                <View className="p-3 rounded-full bg-green-100 items-center justify-center">
                  <Ionicons name="flash" size={20} color="#16A34A" />
                </View>
                <Text className="text-[16px] font-OutfitMedium text-white">Active today</Text>
              </View>
              <Switch
                value={activeToday}
                onValueChange={setActiveToday}
                trackColor={{ false: "#d1d5db", true: colors.primary }}
                thumbColor={activeToday ? "#fff" : "#f4f3f4"}
              />
            </View>

          </ScrollView>

          {/* ── Apply button ── */}
          <View className="px-4 py-3 border-t border-gray-700 bg-[#121212]">
                    <LinearGradient colors={[colors.primary, colors.secondary]} style={{ borderRadius: 50 }}>
            <TouchableOpacity
              className="rounded-full py-4 items-center justify-center"
              onPress={handleApply}
            >
      
              <View className="flex-row items-center gap-2">
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text className="text-white text-xl font-OutfitMedium">
                  Apply filters
                </Text>
              </View>
            </TouchableOpacity>
            </LinearGradient>
          </View>

          <InterestsModal
            visible={visibleModal === "interests"}
            initialSelected={selectedInterests}
            highlightedInterests={myInterests}
            onApply={(interests) => setSelectedInterests(interests)}
            onClose={() => setVisibleModal(null)}
          />

        </SafeAreaView>
      </SafeAreaProvider>
    </BaseModal>
  );
};

export default FilterModal;