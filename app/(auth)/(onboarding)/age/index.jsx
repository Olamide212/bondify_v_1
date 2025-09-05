import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import NextButton from "../../../../components/ui/NextButton";
import { useRouter } from "expo-router";
import Info from "../../../../components/ui/Info";
import Button from "../../../../components/ui/Button";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const calculateAge = (dob) => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

const Age = () => {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i); 

  const [selectedDay, setSelectedDay] = useState(4);
  const [selectedMonth, setSelectedMonth] = useState(4); 
  const [selectedYear, setSelectedYear] = useState(currentYear - 25);
  const [age, setAge] = useState(null);

  useEffect(() => {
    const dob = new Date(selectedYear, selectedMonth, selectedDay);
    const calculatedAge = calculateAge(dob);
    setAge(calculatedAge);
  }, [selectedDay, selectedMonth, selectedYear]);

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  return (
    <View className="bg-white flex-1">
      <View style={styles.container}>
        <Text className='text-3xl font-SatoshiBold'>Whats your date of birth?</Text>
        <Text className='text-lg font-Satoshi'>
          We’ll use this to calculate your age
        </Text>

        <View style={styles.pickerRow}>
          {/* Day Picker */}
          <Picker
            selectedValue={selectedDay}
            style={styles.picker}
            onValueChange={(value) => setSelectedDay(value)}
          >
            {days.map((day) => (
              <Picker.Item key={day} label={String(day)} value={day} />
            ))}
          </Picker>

          {/* Month Picker */}
          <Picker
            selectedValue={selectedMonth}
            style={styles.picker}
            onValueChange={(value) => setSelectedMonth(value)}
          >
            {months.map((month, index) => (
              <Picker.Item key={index} label={month} value={index} />
            ))}
          </Picker>

          {/* Year Picker */}
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

        {age !== null && <Text style={styles.ageText}>Age: {age} years old</Text>}

        <View className='mt-3'>
          <Info title="This can't be changed later" />
        </View>
      </View>

      <View className="w-full items-end pb-6">
        <Button title="Continue" variant="gradient" onPress={() => router.push("/height")} />
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
  title: {
    fontSize: 25,
    fontFamily: "SatoshiBold",
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#000",
    fontFamily: "Satoshi",
    marginBottom: 30,
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
