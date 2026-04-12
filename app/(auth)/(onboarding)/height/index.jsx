import { useRouter } from "expo-router";
import { Eye } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../../../../components/ui/Button";
import WheelPicker from "../../../../components/ui/WheelPicker";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const PRIMARY = "#E8651A";

// Heights 100–250 cm; ft/in equivalents
const cmToFtIn = (cm) => {
  const totalInches = cm / 2.54;
  const ft  = Math.floor(totalInches / 12);
  const inc = Math.round(totalInches % 12);
  return `${ft}'${inc}"`;
};

const Height = () => {
  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  const [unit,           setUnit]           = useState("cm");
  const [selectedHeight, setSelectedHeight] = useState(179);
  const [showOnProfile,  setShowOnProfile]  = useState(true);
  const [submitting,     setSubmitting]     = useState(false);

  // ── Picker items depend on unit ──────────────────────────────────────────
  const cmItems = Array.from({ length: 151 }, (_, i) => {
    const h = i + 100;
    return { label: String(h), value: h };
  });

  const ftItems = Array.from({ length: 151 }, (_, i) => {
    const cm = i + 100;
    return { label: cmToFtIn(cm), value: cm };  // value still in cm
  });

  const items = unit === "cm" ? cmItems : ftItems;

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      await updateProfileStep({
        height:          selectedHeight,
        showHeightOnProfile: showOnProfile,
      });
      router.push("/gender");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {/* Heading */}
        <Text style={styles.title}>How tall are you?</Text>
        <Text style={styles.subtitle}>
          We&apos;ll use this to help find your best matches.
        </Text>

        {/* Unit toggle: cm / ft */}
        <View style={styles.unitToggle}>
          {["cm", "ft"].map((u) => (
            <TouchableOpacity
              key={u}
              style={[
                styles.unitBtn,
                unit === u && styles.unitBtnActive,
              ]}
              onPress={() => setUnit(u)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  unit === u && styles.unitBtnTextActive,
                ]}
              >
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wheel picker */}
        <View style={styles.pickerWrapper}>
          <WheelPicker
            items={items}
            selectedValue={selectedHeight}
            onValueChange={setSelectedHeight}
            itemHeight={60}
            suffix={unit === "cm" ? "cm" : undefined}
          />
        </View>

        {/* Show on profile toggle */}
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setShowOnProfile((prev) => !prev)}
          activeOpacity={0.8}
        >
          <View style={styles.toggleLeft}>
            <Eye size={20} color={PRIMARY} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.toggleTitle}>Show on profile</Text>
              <Text style={styles.toggleSub}>
                People will be able to see your height
              </Text>
            </View>
          </View>
          {/* Custom toggle pill */}
          <View
            style={[
              styles.pill,
              showOnProfile ? styles.pillOn : styles.pillOff,
            ]}
          >
            <View
              style={[
                styles.pillThumb,
                showOnProfile ? styles.pillThumbOn : styles.pillThumbOff,
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Next →"
          variant="primary"
          onPress={handleContinue}
          loading={submitting}
        />
      </View>
    </View>
  );
};

export default Height;

const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: "#121212",
  },
  content: {
    flex:              1,
    paddingTop:        32,
    paddingHorizontal: 24,
    alignItems:        "center",
  },

  // Heading
  title: {
    fontSize:    32,
    fontFamily:  "PlusJakartaSansBold",
    color: '#E5E5E5',
    textAlign:   "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize:    15,
    fontFamily:  "PlusJakartaSans",
    color:       "#888",
    textAlign:   "center",
    marginBottom: 24,
  },

  // Unit toggle
  unitToggle: {
    flexDirection:   "row",
    backgroundColor: '#1E1E1E',
    borderRadius:    50,
    padding:         4,
    marginBottom:    32,
    width:           160,
  },
  unitBtn: {
    flex:            1,
    paddingVertical: 8,
    alignItems:      "center",
    borderRadius:    50,
  },
  unitBtnActive: {
    backgroundColor: "#121212",
    shadowColor:     "#000",
    shadowOpacity:   0.08,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  unitBtnText: {
    fontSize:   14,
    fontFamily: "PlusJakartaSansMedium",
    color:      "#9CA3AF",
  },
  unitBtnTextActive: {
    color: '#E5E5E5',
    fontFamily: "PlusJakartaSansBold",
  },

  // Wheel
  pickerWrapper: {
    width: "60%",
    alignItems: "center",
  },

  // Show on profile row
  toggleRow: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    marginTop:       36,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius:    16,
    backgroundColor: '#2A1F1A',
    width:           "100%",
    borderWidth:     1,
    borderColor:     "#FFE5D6",
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems:    "center",
    flex:          1,
  },
  toggleTitle: {
    fontSize:   14,
    fontFamily: "PlusJakartaSansBold",
    color: '#E5E5E5',
  },
  toggleSub: {
    fontSize:   12,
    fontFamily: "PlusJakartaSans",
    color:      "#999",
    marginTop:  2,
  },

  // Toggle pill
  pill: {
    width:        48,
    height:       26,
    borderRadius: 13,
    padding:      3,
    justifyContent: "center",
  },
  pillOn:  { backgroundColor: PRIMARY },
  pillOff: { backgroundColor: "#D1D5DB" },
  pillThumb: {
    width:        20,
    height:       20,
    borderRadius: 10,
    backgroundColor: "#121212",
  },
  pillThumbOn:  { alignSelf: "flex-end" },
  pillThumbOff: { alignSelf: "flex-start" },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom:     36,
  },
});