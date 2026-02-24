import { Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import Slider from "@react-native-community/slider";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { profileService } from "../../services/profileService";
import BaseModal from "./BaseModal";
import InterestsModal from "./InterestsModal";

const DEFAULT_FILTERS = {
  maxDistance: 1000,
  ageRange: [18, 90],
  showMe: "everyone",
  interests: [],
  verifiedOnly: false,
  activeToday: false,
  location: "",
  allowExtendedDistance: false,
};

const FilterModal = ({ visible, onClose, initialFilters, onApply }) => {
  const { width } = useWindowDimensions();

  const [maxDistance, setMaxDistance] = useState(DEFAULT_FILTERS.maxDistance);
  const [ageRange, setAgeRange] = useState(DEFAULT_FILTERS.ageRange);
  const [showMe, setShowMe] = useState(DEFAULT_FILTERS.showMe);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeToday, setActiveToday] = useState(false);
  const [location, setLocation] = useState("");
  const [allowExtendedDistance, setAllowExtendedDistance] = useState(false);
  const [myInterests, setMyInterests] = useState([]);

  const [visibleModal, setVisibleModal] = useState(null);

  const hydratedFilters = useMemo(
    () => ({ ...DEFAULT_FILTERS, ...(initialFilters || {}) }),
    [initialFilters]
  );

  useEffect(() => {
    if (!visible) return;

    setMaxDistance(Number(hydratedFilters.maxDistance || DEFAULT_FILTERS.maxDistance));
    setAgeRange(
      Array.isArray(hydratedFilters.ageRange)
        ? hydratedFilters.ageRange
        : DEFAULT_FILTERS.ageRange
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

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;

    const loadMyInterests = async () => {
      try {
        const myProfile = await profileService.getMyProfile();
        if (!isMounted) return;
        setMyInterests(Array.isArray(myProfile?.interests) ? myProfile.interests : []);
      } catch (_error) {
        if (!isMounted) return;
        setMyInterests([]);
      }
    };

    loadMyInterests();

    return () => {
      isMounted = false;
    };
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
        <SafeAreaView className="flex-1 bg-white rounded-t-3xl overflow-hidden">
          <View className="flex-row items-center justify-between px-4 pb-4 border-b border-gray-200">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-base font-PlusJakartaSansMedium text-gray-800">Close</Text>
            </TouchableOpacity>

            <Text className="text-xl font-PlusJakartaSansBold">Discovery Settings</Text>

            <TouchableOpacity onPress={handleReset}>
              <Text className="text-base font-PlusJakartaSansBold text-primary">Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <View className='pb-10 border-b-gray-100 border-b mb-6'>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xl font-PlusJakartaSansBold">Maximum Distance</Text>
                <View className="flex-row items-center gap-1 bg-primary/5 px-3 py-2 rounded-full">
                  <Text className="text-lg text-primary font-PlusJakartaSansBold">{maxDistance} miles</Text>
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
              <View className="flex-row items-center gap-2 mt-2">
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
                <Text className="text-base font-PlusJakartaSansMedium">
                  Show people further away if I run out
                </Text>

              </View>
            </View>

            {/* <View className="mt-4 mb-2">
              <Text className="text-lg font-PlusJakartaSansBold mb-2">Location</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base font-PlusJakartaSans"
                placeholder="Filter by city, state, or country"
                placeholderTextColor="#999"
                value={location}
                onChangeText={setLocation}
              />
            </View> */}

            <View className='border-b-gray-100 border-b pb-10'>
              <View className="flex-row items-center justify-between mt-6 mb-2">
                <Text className="text-xl font-PlusJakartaSansBold">Age Range</Text>
                <View className='flex-row items-center gap-1 bg-primary/5 px-3  rounded-full'>
                  <Text className="text-lg text-primary font-PlusJakartaSansBold">
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
                  height: 25,
                  width: 25,
                  borderColor: colors.primary,
                }}
              />
            </View>


            <View className='flex-col  w-full'>
              <Text className="text-xl font-PlusJakartaSansBold mt-6 mb-2">Show Me</Text>
              <View className="w-full flex-col items-center   mb-2 bg-[#F1F5F9] px-5 py-2 rounded-xl">
                <View className=" flex-row flex-wrap justify-between gap-10  ">
                  {[
                    { label: "Men", value: "men" },
                    { label: "Women", value: "women" },
                    { label: "Everyone", value: "everyone" },
                  ].map((option) => {
                    const isSelected = showMe === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setShowMe(option.value)}
                        className={`px-4 py-2 rounded-xl  ${isSelected
                          ? "bg-white"
                          : ""
                          }`}
                      >
                        <Text className={`font-PlusJakartaSansBold  ${isSelected ? "text-primary" : "text-gray-500 "} text-lg`}>{option.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            </View>


            <TouchableOpacity
              className="py-6 border-b border-gray-200"
              onPress={() => setVisibleModal("interests")}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-PlusJakartaSansBold">Interests</Text>
                <Text className="text-base font-PlusJakartaSansMedium text-primary">Edit All</Text>
              </View>

              {(() => {
                const hasSelections = selectedInterests.length > 0;
                const interestList = hasSelections ? selectedInterests : myInterests;

                if (!interestList.length) {
                  return (
                    <Text className="text-gray-500 mt-2">
                      Tap to choose the vibes you vibe with
                    </Text>
                  );
                }

                return (
                  <>
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      {interestList.map((interest) => {
                        const isShared = myInterests.includes(interest);
                        return (
                          <View
                            key={interest}
                            className={`px-3 py-1 rounded-full border ${
                              isShared
                                ? "bg-primary/10 border-primary"
                                : "bg-gray-100 border-gray-200"
                            }`}
                          >
                            <Text
                              className={`text-lg font-PlusJakartaSansMedium ${
                                isShared ? "text-primary" : "text-gray-700"
                              }`}
                            >
                              {interest}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                );
              })()}
            </TouchableOpacity>

            <Text className="text-xl font-PlusJakartaSansBold mt-8 mb-4">Advanced filter</Text>

            <View className="flex-row justify-between items-center py-4 ">
              <View className="flex-row items-center gap-3">
                <View className="p-3 rounded-full bg-blue-100 items-center justify-center">
                    <Ionicons name="shield-checkmark" size={20} color={"#2563EB"} />
                </View>
              
                <Text className="text-[16px] font-PlusJakartaSansMedium">Verified user only</Text>
              </View>
              <Switch
                value={verifiedOnly}
                onValueChange={setVerifiedOnly}
                trackColor={{ false: "#d1d5db", true: colors.primary }}
                thumbColor={verifiedOnly ? "#fff" : "#f4f3f4"}
              />
            </View>

            <View className="flex-row justify-between items-center py-4 ">
              <View className="flex-row items-center gap-3">
                <View className="p-3 rounded-full bg-green-100 items-center justify-center">
                   <Ionicons name="flash" size={20} color={"#16A34A"} />
                </View>
               
                <Text className="text-[16px] font-PlusJakartaSansMedium">Active today</Text>
              </View>
              <Switch
                value={activeToday}
                onValueChange={setActiveToday}
                trackColor={{ false: "#d1d5db", true: colors.primary }}
                thumbColor={activeToday ? "#fff" : "#f4f3f4"}
              />
            </View>
          </ScrollView>

          <View className="px-4 py-3 border-t border-gray-100 bg-white">
            <TouchableOpacity
              className="bg-primary rounded-full py-4 items-center justify-center"
              onPress={handleApply}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text className="text-white text-xl font-PlusJakartaSansMedium">Apply filters</Text>
              </View>
            </TouchableOpacity>
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
