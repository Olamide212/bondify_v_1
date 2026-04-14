/**
 * app/(root)/(settings)/edit-birthday.jsx
 * Screen for updating user's date of birth/age.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import WheelPicker from "../../../components/ui/WheelPicker";
import { colors } from "../../../constant/colors";
import { useAlert } from "../../../context/AlertContext";
import { months } from "../../../data/months";
import SettingsService from "../../../services/settingsService";
import { setUser } from "../../../slices/authSlice";

const PRIMARY = colors.primary;

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const calculateAge = (year, month, day) => {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) age--;
  return age;
};

const parseDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const date = new Date(dateOfBirth);
  if (isNaN(date.getTime())) return null;
  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
  };
};

const EditBirthdayScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  
  const user = useSelector((state) => state.auth?.user);
  const currentYear = new Date().getFullYear();

  // Parse existing DOB or use defaults
  const existingDob = parseDateOfBirth(user?.dateOfBirth);

  const [selectedDay, setSelectedDay] = useState(existingDob?.day || 1);
  const [selectedMonth, setSelectedMonth] = useState(existingDob?.month ?? 0);
  const [selectedYear, setSelectedYear] = useState(existingDob?.year || currentYear - 25);
  const [loading, setLoading] = useState(false);

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  // Clamp day if month/year change shrinks available days
  useEffect(() => {
    if (selectedDay > daysInMonth) setSelectedDay(daysInMonth);
  }, [daysInMonth, selectedDay]);

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

  const handleSave = async () => {
    // Validate age (must be 18+)
    if (age < 18) {
      return showAlert({
        icon: "warning",
        title: "Age Requirement",
        message: "You must be at least 18 years old to use this app.",
        actions: [{ label: "OK", style: "primary" }],
      });
    }

    if (age > 120) {
      return showAlert({
        icon: "warning",
        title: "Invalid Date",
        message: "Please enter a valid date of birth.",
        actions: [{ label: "OK", style: "primary" }],
      });
    }

    setLoading(true);
    try {
      const month = String(selectedMonth + 1).padStart(2, "0");
      const day = String(selectedDay).padStart(2, "0");
      const dateOfBirth = `${selectedYear}-${month}-${day}`;

      const response = await SettingsService.updateBirthday({ dateOfBirth });

      // Update Redux store with response data
      if (user) {
        dispatch(setUser({ 
          ...user, 
          dateOfBirth: response.data?.dateOfBirth || dateOfBirth, 
          age: response.data?.age || age 
        }));
      }

      showAlert({
        icon: "success",
        title: "Updated!",
        message: "Your birthday has been updated successfully.",
        actions: [{ label: "OK", style: "primary", onPress: () => router.back() }],
      });
    } catch (err) {
      showAlert({
        icon: "error",
        title: "Update Failed",
        message: err?.response?.data?.message || err?.message || "Could not update your birthday. Please try again.",
        actions: [{ label: "OK", style: "primary" }],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Birthday</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Update your{"\n"}birthday</Text>
        <Text style={styles.subtitle}>
          Your age is calculated from this date
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
        {age < 18 && age >= 0 && (
          <Text style={styles.warningText}>Must be 18 or older</Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading || age < 18}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EditBirthdayScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    // borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#E5E5E5",
  },
  content: {
    flex: 1,
    paddingTop: 36,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "PlusJakartaSansBold",
    color: "#E5E5E5",
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    color: "#888",
    textAlign: "center",
    marginBottom: 32,
  },
  pickersRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  pickerCol: {
    flex: 1,
  },
  pickerColWide: {
    flex: 1.5,
  },
  ageText: {
    marginTop: 28,
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
  },
  warningText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "PlusJakartaSansMedium",
    color: "#EF4444",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 16,
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 99,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
  },
});
