import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Button from "../../../../components/ui/Button";
import Info from "../../../../components/ui/Info";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import { months } from "../../../../data/months";




const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const calculateAge = (dob) => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

const Age = () => {
  const { updateProfileStep, nextStep, profileData } = useProfileSetup({
    isOnboarding: true,
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Initialize state from profileData if exists
  const [selectedDay, setSelectedDay] = useState(profileData.birthDay || 1);
  const [selectedMonth, setSelectedMonth] = useState(
    profileData.birthMonth || 0
  );
  const [selectedYear, setSelectedYear] = useState(
    profileData.birthYear || currentYear - 25
  );
  const [age, setAge] = useState(null);

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  // Update age display
  useEffect(() => {
    const dob = new Date(selectedYear, selectedMonth, selectedDay);
    setAge(calculateAge(dob));
  }, [selectedDay, selectedMonth, selectedYear]);

  // Auto-save to backend whenever selection changes
  useEffect(() => {
    updateProfileStep({
      birthdate: `${selectedYear}-${selectedMonth + 1}-${selectedDay}`,
    });
  }, [selectedDay, selectedMonth, selectedYear]);

  return (
    <View className="bg-white flex-1">
      <View style={styles.container}>
        <Text className="text-3xl font-SatoshiBold">
          What's your date of birth?
        </Text>
        <Text className="text-lg font-Satoshi">
          We’ll use this to calculate your age
        </Text>

        <View style={styles.pickerRow}>
          <Picker
            selectedValue={selectedDay}
            style={styles.picker}
            onValueChange={(value) => setSelectedDay(value)}
          >
            {days.map((day) => (
              <Picker.Item key={day} label={String(day)} value={day} />
            ))}
          </Picker>

          <Picker
            selectedValue={selectedMonth}
            style={styles.picker}
            onValueChange={(value) => setSelectedMonth(value)}
          >
            {months.map((month, index) => (
              <Picker.Item key={index} label={month} value={index} />
            ))}
          </Picker>

          <Picker
            selectedValue={selectedYear}
            style={styles.picker}
            onValueChange={(value) => setSelectedYear(value)}
          >
            {years.map((year) => (
              <Picker.Item key={year} label={String(year)} value={year} />
            ))}
          </Picker>
        </View>

        {age !== null && (
          <Text style={styles.ageText}>Age: {age} years old</Text>
        )}
        <View className="mt-3">
          <Info title="This can't be changed later" />
        </View>
      </View>

      <View className="w-full items-end pb-6">
        <Button title="Continue" variant="gradient" onPress={nextStep} />
      </View>
    </View>
  );
};

export default Age;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    alignItems: "center",
  },
  pickerRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-evenly",
  },
  picker: {
    width: "30%",
    backgroundColor: "#fff",
    color: "#333",
    height: Platform.OS === "ios" ? 200 : 50,
  },
  ageText: {
    marginTop: 60,
    fontSize: 20,
    fontFamily: "SatoshiBold",
    color: "#333",
  },
});
