import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useState, useMemo } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../components/headers/GeneralHeader";
import { X } from "lucide-react-native";
import useNationalities from "../../hooks/useNationalities";

const NationalityModal = ({ visible, onClose, onSelect }) => {
  const [search, setSearch] = useState("");
  const { nationalities, loading, error } = useNationalities();

const filteredNationalities = useMemo(() => {
  return nationalities.filter((n) =>
    n.label.toLowerCase().includes(search.toLowerCase())
  );
}, [search, nationalities]);

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <GeneralHeader
            title="Select Nationality"
            leftIcon={<X onPress={onClose} />}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search nationality..."
            value={search}
            onChangeText={setSearch}
          />

          {loading && (
            <ActivityIndicator size="large" style={{ marginTop: 20 }} />
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <FlatList
            data={filteredNationalities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onSelect(item.id); 
                  onClose();
                }}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </SafeAreaProvider>
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