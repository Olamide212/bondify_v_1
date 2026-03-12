import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "../../../../components/ui/Button";
import Info from "../../../../components/ui/Info";
import WheelPicker from "../../../../components/ui/WheelPicker";
import { months } from "../../../../data/months";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const PRIMARY = "#E8651A";

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const calculateAge = (year, month, day) => {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) age--;
  return age;
};

const Age = () => {
  const { updateProfileStep, profileData = {} } = useProfileSetup({
    isOnboarding: true,
  });
  const router = useRouter();

  const currentYear = new Date().getFullYear();

  const [selectedDay,   setSelectedDay]   = useState(profileData.birthDay   || 11);
  const [selectedMonth, setSelectedMonth] = useState(profileData.birthMonth || 5);   // June = 5
  const [selectedYear,  setSelectedYear]  = useState(profileData.birthYear  || currentYear - 25);

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  // Clamp day if month/year changes shrinks available days
  useEffect(() => {
    if (selectedDay > daysInMonth) setSelectedDay(daysInMonth);
  }, [daysInMonth]);

  // Persist to backend
  useEffect(() => {
    const month       = String(selectedMonth + 1).padStart(2, "0");
    const day         = String(selectedDay).padStart(2, "0");
    const dateOfBirth = `${selectedYear}-${month}-${day}`;
    updateProfileStep({
      dateOfBirth,
      age: calculateAge(selectedYear, selectedMonth, selectedDay),
    });
  }, [selectedDay, selectedMonth, selectedYear]);

  // ── Picker items ────────────────────────────────────────────────────────────
  const dayItems = Array.from({ length: daysInMonth }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));

  const monthItems = months.map((m, index) => ({
    label: m,
    value: index,
  }));

  const yearItems = Array.from({ length: 100 }, (_, i) => ({
    label: String(currentYear - i),
    value: currentYear - i,
  }));

  const age = calculateAge(selectedYear, selectedMonth, selectedDay);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {/* Heading */}
        <Text style={styles.title}>What&apos;s your{"\n"}birthday?</Text>
        <Text style={styles.subtitle}>
          We&apos;ll use this to calculate your age
        </Text>

        {/* Three wheel columns */}
        <View style={styles.pickersRow}>
          {/* Day */}
          <View style={styles.pickerCol}>
            <WheelPicker
              items={dayItems}
              selectedValue={selectedDay}
              onValueChange={setSelectedDay}
            />
          </View>

          {/* Month */}
          <View style={[styles.pickerCol, styles.pickerColWide]}>
            <WheelPicker
              items={monthItems}
              selectedValue={selectedMonth}
              onValueChange={setSelectedMonth}
            />
          </View>

          {/* Year */}
          <View style={styles.pickerCol}>
            <WheelPicker
              items={yearItems}
              selectedValue={selectedYear}
              onValueChange={setSelectedYear}
            />
          </View>
        </View>

        {/* Age display */}
        {age >= 0 && age <= 120 && (
          <Text style={styles.ageText}>{age} years old</Text>
        )}

        <View style={{ marginTop: 12 }}>
          <Info title="This can't be changed later" />
        </View>
      </View>

      {/* Footer: disclaimer + button */}
      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          By tapping Next you confirm you&apos;re over 18 years old.
        </Text>
        <Button
          title="Next →"
          variant="primary"
          onPress={() => router.push("/gender")}
        />
      </View>
    </View>
  );
};

export default Age;

const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: "#fff",
  },
  content: {
    flex:            1,
    paddingTop:      36,
    paddingHorizontal: 24,
    alignItems:      "center",
  },
  title: {
    fontSize:    30,
    fontFamily:  "PlusJakartaSansBold",
    color:       "#111",
    textAlign:   "center",
    lineHeight:  40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize:    15,
    fontFamily:  "PlusJakartaSans",
    color:       "#888",
    textAlign:   "center",
    marginBottom: 32,
  },

  // Picker row
  pickersRow: {
    flexDirection:   "row",
    width:           "100%",
    justifyContent:  "center",
    alignItems:      "center",
    gap:             8,
  },
  pickerCol: {
    flex:            1,
  },
  pickerColWide: {
    flex:            1.5,  // month names are longer
  },

  // Age readout
  ageText: {
    marginTop:   28,
    fontSize:    18,
    fontFamily:  "PlusJakartaSansBold",
    color:       PRIMARY,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom:     36,
    alignItems:        "center",
    gap:               10,
  },
  disclaimer: {
    fontSize:   12,
    fontFamily: "PlusJakartaSans",
    color:      "#aaa",
    textAlign:  "center",
  },
});