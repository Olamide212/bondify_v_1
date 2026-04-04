import React from "react";
import { View, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

const AgePicker = ({ selectedAge, onAgeChange }) => {
  const ages = Array.from({ length: 83 }, (_, i) => 18 + i); // 18 to 100

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedAge}
        onValueChange={onAgeChange}
        style={styles.picker}
        mode="dropdown"
      >
        {ages.map((age) => (
          <Picker.Item key={age} label={`${age}`} value={age} />
        ))}
      </Picker>
    </View>
  );
};

export default AgePicker;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#121212",
  },
  picker: {
    height: 50,
    width: "100%",
  },
});
