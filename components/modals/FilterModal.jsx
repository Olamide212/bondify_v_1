import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import BaseModal from "./BaseModal";
import { colors } from "../../constant/colors";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import InterestsModal from "./InterestsModal";
import ModalHeader from "../headers/ModalHeader";
import LookingForModal from "./LookingForModal";
import EthnicityModal from "./EthnicityModal";
import FamilyPlanModal from "./FamilyPlanModal";
import EducationModal from "./EducationModal";
import DrinkingModal from "./DrinkingModal";
import SmokingModal from "./SmokingModal";
import ReligionModal from "./ReligionModal";
import CommunicationModal from "./CommunicationModal";
import LoveStyleModal from "./LoveStyle";
import ZodiacModal from "./ZodiacModal";
import WorkOutModal from "./WorkOutModal";
import FinanceModal from "./FinanceModal";
import LanguageModal from "./LanguageModal";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const FilterModal = ({ visible, onClose }) => {
  const [selectedGender, setSelectedGender] = useState("Everyone");
  const [ageRange, setAgeRange] = useState([18, 90]);
  const [distance, setDistance] = useState(1000);

  // Track which modal is open
  const [visibleModal, setVisibleModal] = useState(null);

  // Track selections
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedEthnicityOption, setSelectedEthnicityOption] = useState("");
  const [selectedFamilyPlanOption, setSelectedFamilyPlanOption] = useState("");
  const [selectedEducationOption, setSelectedEducationOption] = useState("");
  const [selectedDrinkingOption, setSelectedDrinkingOption] = useState("");
  const [selectedSmokingOption, setSelectedSmokingOption] = useState("");
  const [selectedReligionOption, setSelectedReligionOption] = useState("");
  const [selectedCommunicationOption, setSelectedCommunicationOption] =
    useState("");
  const [selectedLoveOption, setSelectedLoveOption] = useState("");
  const [selectedZodiacOption, setSelectedZodiacOption] = useState("");
  const [selectedWorkOutOption, setSelectedWorkOutOption] = useState("");
  const [selectedFinanceOption, setSelectedFinanceOption] = useState("");
  const [selectedLanguageOption, setSelectedLanguageOption] = useState("");

  const genderOptions = ["Male", "Female", "Nonbinary", "Everyone"];

  const filters = [
    {
      label: "People interested",
      value: selectedOption ? selectedOption : "Select",
      key: "looking",
    },
    {
      label: "Interests",
      value:
        selectedInterests.length > 0 ? selectedInterests.join(", ") : "Select",
      key: "interests",
    },
    {
      label: "Zodiac",
      value: selectedZodiacOption ? selectedZodiacOption : "Select",
      key: "zodiac",
    },
    {
      label: "Ethnicity",
      value: selectedEthnicityOption ? selectedEthnicityOption : "Select",
      key: "ethnicity",
    },
    {
      label: "Education level",
      value: selectedEducationOption ? selectedEducationOption : "Select",
      key: "education",
    },

    {
      label: "Drinking",
      value: selectedDrinkingOption ? selectedDrinkingOption : "Select",
      key: "drinking",
    },
    {
      label: "Smoking",
      value: selectedSmokingOption ? selectedSmokingOption : "Select",
      key: "smoking",
    },
    {
      label: "Religion",
      value: selectedReligionOption ? selectedReligionOption : "Select",
      key: "religion",
    },
    {
      label: "Communication style",
      value: selectedCommunicationOption
        ? selectedCommunicationOption
        : "Select",
      key: "communication",
    },
    {
      label: "Love language",
      value: selectedLoveOption ? selectedLoveOption : "Select",
      key: "love",
    },

    {
      label: "Workout",
      value: selectedWorkOutOption ? selectedWorkOutOption : "Select",
      key: "workout",
    },
  ];

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white rounded-t-3xl overflow-hidden ">
          <ModalHeader
            onClose={onClose}
            centerText="Filter"
            rightText="Apply"
            onRightPress={onClose}
          />

          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Age */}
            <Text className="text-lg font-SatoshiBold mb-1">Age</Text>
            <Text className="mb-2 text-gray-500 font-Satoshi">
              {ageRange[0]} – {ageRange[1]}
            </Text>
            <MultiSlider
              sliderLength={350}
              values={ageRange}
              onValuesChange={(values) => setAgeRange(values)}
              min={18}
              max={100}
              step={1}
              trackStyle={{ height: 4, borderRadius: 50 }}
              selectedStyle={{
                backgroundColor: colors.primary,
              }}
              unselectedStyle={{
                backgroundColor: "#d3d3d3",
              }}
              markerStyle={{
                backgroundColor: colors.primary,
                height: 25,
                width: 25,
                borderColor: colors.primary,
              }}
            />

            {/* Distance */}
            <Text className="text-lg font-SatoshiBold mt-6 mb-1">
              Distance (km)
            </Text>
            <Text className="mb-2 text-gray-500">{distance}km</Text>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={2}
              maximumValue={1000}
              step={1}
              value={distance}
              onValueChange={(value) => setDistance(value)}
              minimumTrackTintColor="#FF0066"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#FF0066"
            />

            {/* Advanced Filters */}
            <View className="flex-row justify-between items-center mt-8 mb-4">
              <Text className="text-lg font-bold">Advanced filters</Text>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Filter rows */}
            {filters.map((item) => (
              <TouchableOpacity
                key={item.key}
                className="flex-row justify-between items-center py-6 border-b border-gray-200"
                onPress={() => setVisibleModal(item.key)}
              >
                <Text className="text-[16px] font-SatoshiMedium">
                  {item.label}
                </Text>
                <Text
                  className={`${
                    item.value === "Select"
                      ? "text-gray-500"
                      : "text-black capitalize"
                  }`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ maxWidth: "60%" }}
                >
                  {item.value}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Interests Modal */}
          <InterestsModal
            visible={visibleModal === "interests"}
            initialSelected={selectedInterests}
            onApply={(interests) => setSelectedInterests(interests)}
            onClose={() => setVisibleModal(null)}
          />

          {/* Looking for modal*/}
          <LookingForModal
            visible={visibleModal === "looking"}
            initialSelected={selectedOption}
            onApply={(looking) => setSelectedOption(looking)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Ethnicity modal*/}
          <EthnicityModal
            visible={visibleModal === "ethnicity"}
            initialSelected={selectedEthnicityOption}
            onApply={(ethnicity) => setSelectedEthnicityOption(ethnicity)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Family modal*/}
          <FamilyPlanModal
            visible={visibleModal === "kids"}
            initialSelected={selectedFamilyPlanOption}
            onApply={(kids) => setSelectedFamilyPlanOption(kids)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Education modal*/}
          <EducationModal
            visible={visibleModal === "education"}
            initialSelected={selectedEducationOption}
            onApply={(education) => setSelectedEducationOption(education)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Drinking modal*/}
          <DrinkingModal
            visible={visibleModal === "drinking"}
            initialSelected={selectedDrinkingOption}
            onApply={(drinking) => setSelectedDrinkingOption(drinking)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Smoking modal*/}
          <SmokingModal
            visible={visibleModal === "smoking"}
            initialSelected={selectedSmokingOption}
            onApply={(smoking) => setSelectedSmokingOption(smoking)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Religion modal*/}
          <ReligionModal
            visible={visibleModal === "religion"}
            initialSelected={selectedReligionOption}
            onApply={(religion) => setSelectedReligionOption(religion)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Communication Style modal*/}
          <CommunicationModal
            visible={visibleModal === "communication"}
            initialSelected={selectedCommunicationOption}
            onApply={(communication) =>
              setSelectedCommunicationOption(communication)
            }
            onClose={() => setVisibleModal(null)}
          />

          {/*Love Style modal*/}
          <LoveStyleModal
            visible={visibleModal === "love"}
            initialSelected={selectedLoveOption}
            onApply={(love) => setSelectedLoveOption(love)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Zodiac modal*/}
          <ZodiacModal
            visible={visibleModal === "zodiac"}
            initialSelected={selectedZodiacOption}
            onApply={(zodiac) => setSelectedZodiacOption(zodiac)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Workout modal*/}
          <WorkOutModal
            visible={visibleModal === "workout"}
            initialSelected={selectedWorkOutOption}
            onApply={(workout) => setSelectedWorkOutOption(workout)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Finance modal*/}
          <FinanceModal
            visible={visibleModal === "finance"}
            initialSelected={selectedFinanceOption}
            onApply={(finance) => setSelectedFinanceOption(finance)}
            onClose={() => setVisibleModal(null)}
          />

          {/*Language modal*/}
          <LanguageModal
            visible={visibleModal === "language"}
            initialSelected={selectedLanguageOption}
            onApply={(finance) => setSelectedLanguageOption(finance)}
            onClose={() => setVisibleModal(null)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </BaseModal>
  );
};

export default FilterModal;
