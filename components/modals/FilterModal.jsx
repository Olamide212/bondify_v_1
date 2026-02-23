import MultiSlider from "@ptomasroos/react-native-multi-slider";
import Slider from "@react-native-community/slider";
import { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
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
    });
    onClose?.();
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white rounded-t-3xl overflow-hidden">
          <View className="flex-row items-center justify-between px-4 pb-4 border-b border-gray-200">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-base font-SatoshiMedium text-gray-800">Close</Text>
            </TouchableOpacity>

            <Text className="text-xl font-SatoshiBold">Filter</Text>

            <TouchableOpacity onPress={handleReset}>
              <Text className="text-base font-SatoshiBold text-primary">Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-SatoshiBold">Maximum Distance</Text>
              <Text className="text-base text-gray-500 font-Satoshi">{maxDistance} km</Text>
            </View>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={2}
              maximumValue={1000}
              step={1}
              value={maxDistance}
              onValueChange={(value) => setMaxDistance(value)}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor={colors.primary}
            />

            <View className="mt-4 mb-2">
              <Text className="text-lg font-SatoshiBold mb-2">Location</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base font-Satoshi"
                placeholder="Filter by city, state, or country"
                placeholderTextColor="#999"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View className="flex-row items-center justify-between mt-6 mb-2">
              <Text className="text-lg font-SatoshiBold">Age Range</Text>
              <Text className="text-base text-gray-500 font-Satoshi">
                {ageRange[0]} – {ageRange[1]}
              </Text>
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

            <Text className="text-lg font-SatoshiBold mt-6 mb-2">Show me</Text>
            <View className="flex-row flex-wrap gap-2 mb-2">
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
                    className={`px-4 py-2 rounded-full border ${
                      isSelected
                        ? "bg-secondary border-secondary"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text className="font-SatoshiMedium">{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              className="flex-row justify-between items-center py-6 border-b border-gray-200"
              onPress={() => setVisibleModal("interests")}
            >
              <Text className="text-[16px] font-SatoshiMedium">Interests</Text>

              {selectedInterests.length > 0 ? (
                <View className="flex-row flex-wrap justify-end gap-1" style={{ maxWidth: "62%" }}>
                  {selectedInterests.slice(0, 3).map((interest) => (
                    <View key={interest} className="px-2 py-1 rounded-full bg-secondary border border-secondary">
                      <Text className="text-xs font-SatoshiMedium text-black" numberOfLines={1}>
                        {interest}
                      </Text>
                    </View>
                  ))}
                  {selectedInterests.length > 3 && (
                    <View className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200">
                      <Text className="text-xs font-SatoshiMedium text-gray-700">
                        +{selectedInterests.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text className="text-gray-500">Select</Text>
              )}
            </TouchableOpacity>

            <Text className="text-lg font-SatoshiBold mt-8 mb-4">Advanced filter</Text>

            <View className="flex-row justify-between items-center py-4 border-b border-gray-200">
              <Text className="text-[16px] font-SatoshiMedium">Verified user only</Text>
              <Switch
                value={verifiedOnly}
                onValueChange={setVerifiedOnly}
                trackColor={{ false: "#d1d5db", true: "#b6b4f4" }}
                thumbColor={verifiedOnly ? colors.primary : "#f4f3f4"}
              />
            </View>

            <View className="flex-row justify-between items-center py-4 border-b border-gray-200">
              <Text className="text-[16px] font-SatoshiMedium">Active today</Text>
              <Switch
                value={activeToday}
                onValueChange={setActiveToday}
                trackColor={{ false: "#d1d5db", true: "#b6b4f4" }}
                thumbColor={activeToday ? colors.primary : "#f4f3f4"}
              />
            </View>
          </ScrollView>

          <View className="px-4 py-3 border-t border-gray-100 bg-white">
            <TouchableOpacity
              className="bg-primary rounded-full py-4 items-center justify-center"
              onPress={handleApply}
            >
              <Text className="text-white text-lg font-GeneralSansMedium">Apply filter</Text>
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
