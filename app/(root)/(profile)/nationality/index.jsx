import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNationalities } from "../../../../hooks/useNationalities"; 

const Nationality = ({ visible, onClose, onSelect }) => {
  const [search, setSearch] = useState("");
  const { nationalities, loading } = useNationalities();

  const filteredCountries = nationalities.filter((country) =>
    country.value.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Modal visible={visible} onRequestClose={onClose}>
        <View style={styles.container}>
          <Text>Loading nationalities...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Select Nationality</Text>
        </View>

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
    </Modal>
  );
};

export default Nationality;
