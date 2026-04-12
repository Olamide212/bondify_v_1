import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import CountryPicker, { DARK_THEME } from "react-native-country-picker-modal";

const GlobalPhoneInput = ({
  phoneNumber,
  countryCode,
  onChangePhoneNumber,
  onChangeCountryCode,
  error,
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

    // Hard limit 15 digits
    digits = digits.slice(0, 15);

    onChangePhoneNumber?.(digits);
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={[styles.container, error && styles.containerError]}>
        <View style={styles.countryPickerContainer}>
          <CountryPicker
            countryCode={cca2}
            withFlag
            withCallingCodeButton
            withFilter
            withCallingCode
            withAlphaFilter
            onSelect={onSelect}
            theme={DARK_THEME}
            containerButtonStyle={styles.countryPickerButton}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="WhatsApp number"
          placeholderTextColor="#929292"
          keyboardType="number-pad"
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          maxLength={15}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    alignItems: "center",
    height: 55,
  },
  containerError: {
    borderColor: '#EF4444',
  },
  countryPickerContainer: {
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: '#FFFFFF',
    height: "100%",
    fontFamily: "PlusJakartaSansMedium",
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default GlobalPhoneInput;
