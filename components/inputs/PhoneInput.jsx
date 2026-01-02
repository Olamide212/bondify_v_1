import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import CountryPicker, { LIGHT_THEME } from "react-native-country-picker-modal";

const GlobalPhoneInput = ({
  phoneNumber,
  countryCode,
  onChangePhoneNumber,
  onChangeCountryCode,
}) => {
  const [cca2, setCca2] = useState("NG");
  const [callingCode, setCallingCode] = useState("234");

  // ⚡ Make sure the parent always has a country code on mount
  useEffect(() => {
    if (!countryCode) {
      onChangeCountryCode?.(`+${callingCode}`);
    }
  }, []);

  const onSelect = (country) => {
    setCca2(country.cca2);
    setCallingCode(country.callingCode[0]);

    // send full calling code to parent (+234)
    onChangeCountryCode?.(`+${country.callingCode[0]}`);
  };

  const handlePhoneChange = (text) => {
    let digits = text.replace(/\D/g, "");

    // Remove leading zero if user typed it
    if (digits.startsWith("0")) digits = digits.slice(1);

    // Hard limit 10 digits
    digits = digits.slice(0, 10);

    onChangePhoneNumber?.(digits);
  };

  return (
    <View style={styles.container}>
      <View style={styles.countryPickerContainer}>
        <CountryPicker
          countryCode={cca2}
          withFlag
          withCallingCodeButton
          withFilter
          withCallingCode
          withAlphaFilter
          onSelect={onSelect}
          theme={LIGHT_THEME}
          containerButtonStyle={styles.countryPickerButton}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="8012345678"
        placeholderTextColor="#929292"
        keyboardType="number-pad"
        value={phoneNumber}
        onChangeText={handlePhoneChange}
        maxLength={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 10,
    alignItems: "center",
    height: 50,
    marginBottom: 17,
  },
  countryPickerContainer: {
    borderRightWidth: 1,
    borderColor: "#dcdcdc",
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  countryPickerButton: {
    height: "100%",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#000",
    height: "100%",
    fontFamily: "GeneralSansMedium",
  },
});

export default GlobalPhoneInput;
