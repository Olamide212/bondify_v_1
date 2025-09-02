import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
    StyleSheet,
  Modal
} from "react-native";
import React, { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../components/headers/GeneralHeader"
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

const NationalityModal = ({ visible, onClose, onSelect }) => {
  const [search, setSearch] = useState("");

  const filteredCountries = africanCountries.filter((country) =>
    country.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View>
          {/* Header */}
          <GeneralHeader
            title="Select Nationality"
            leftIcon=<ArrowLeft onPress={onClose} />
          />

          {/* Search */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search nationality..."
            value={search}
            onChangeText={setSearch}
          />

          {/* List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={styles.itemText}>{item.value}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default NationalityModal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    margin: 15,
    padding: 15,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    fontFamily: "SatoshiMedium",
  },
  itemText: { fontSize: 16 },
});