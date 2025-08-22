import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React, { useState, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import { ArrowLeft } from "lucide-react-native";

const africanCountries = [
  { key: "dz", value: "Algeria" },
  { key: "ao", value: "Angola" },
  { key: "bj", value: "Benin" },
  { key: "bw", value: "Botswana" },
  { key: "bf", value: "Burkina Faso" },
  { key: "bi", value: "Burundi" },
  { key: "cv", value: "Cabo Verde" },
  { key: "cm", value: "Cameroon" },
  { key: "cf", value: "Central African Republic" },
  { key: "td", value: "Chad" },
  { key: "km", value: "Comoros" },
  { key: "cd", value: "Democratic Republic of the Congo" },
  { key: "cg", value: "Republic of the Congo" },
  { key: "ci", value: "Côte d’Ivoire" },
  { key: "dj", value: "Djibouti" },
  { key: "eg", value: "Egypt" },
  { key: "gq", value: "Equatorial Guinea" },
  { key: "er", value: "Eritrea" },
  { key: "sz", value: "Eswatini" },
  { key: "et", value: "Ethiopia" },
  { key: "ga", value: "Gabon" },
  { key: "gm", value: "Gambia" },
  { key: "gh", value: "Ghana" },
  { key: "gn", value: "Guinea" },
  { key: "gw", value: "Guinea-Bissau" },
  { key: "ke", value: "Kenya" },
  { key: "ls", value: "Lesotho" },
  { key: "lr", value: "Liberia" },
  { key: "ly", value: "Libya" },
  { key: "mg", value: "Madagascar" },
  { key: "mw", value: "Malawi" },
  { key: "ml", value: "Mali" },
  { key: "mr", value: "Mauritania" },
  { key: "mu", value: "Mauritius" },
  { key: "ma", value: "Morocco" },
  { key: "mz", value: "Mozambique" },
  { key: "na", value: "Namibia" },
  { key: "ne", value: "Niger" },
  { key: "ng", value: "Nigeria" },
  { key: "rw", value: "Rwanda" },
  { key: "st", value: "São Tomé and Príncipe" },
  { key: "sn", value: "Senegal" },
  { key: "sc", value: "Seychelles" },
  { key: "sl", value: "Sierra Leone" },
  { key: "so", value: "Somalia" },
  { key: "za", value: "South Africa" },
  { key: "ss", value: "South Sudan" },
  { key: "sd", value: "Sudan" },
  { key: "tz", value: "Tanzania" },
  { key: "tg", value: "Togo" },
  { key: "tn", value: "Tunisia" },
  { key: "ug", value: "Uganda" },
  { key: "zm", value: "Zambia" },
  { key: "zw", value: "Zimbabwe" },
];

const Nationality = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState(params.currentValue || "");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelect = (country) => {
    setSelected(country.value);

    // Update the parent component through router params
    router.setParams({
      updatedField: params.fieldKey,
      updatedValue: country.value,
    });

    // Don't navigate back immediately - let the user press the back button
  };

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return africanCountries;
    return africanCountries.filter((country) =>
      country.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <GeneralHeader title="Select your country" leftIcon={<ArrowLeft />} />
        <View className="mx-4">
          <Text className="text-2xl font-SatoshiBold mt-4">
            What is your nationality
          </Text>

          {/* 🔎 Search Input */}
          <TextInput
            placeholder="Search country..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              marginTop: 15,
              marginBottom: 20,
              padding: 12,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 10,
              fontSize: 16,
            }}
          />

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.key}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  flex: 1,
                  margin: 5,
                  padding: 20,
                  borderRadius: 15,
                  backgroundColor:
                    selected === item.value ? "#4B164C" : "#f5f5f5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => handleSelect(item)}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: selected === item.value ? "#fff" : "#333",
                  }}
                >
                  {item.value}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Nationality;
