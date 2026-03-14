import { Globe, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import { useLookupOptions } from "../../hooks/useLookupOptions";

const LanguageSelection = ({ profile, onUpdateField }) => {
  const { options: languageOptions, loading } = useLookupOptions("languages");
  const [selected, setSelected] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const profileLangs = profile?.languages ?? profile?.language ?? [];
    setSelected(Array.isArray(profileLangs) ? profileLangs : []);
  }, [profile]);

  const toggleLanguage = (langValue) => {
    const updated = selected.includes(langValue)
      ? selected.filter((l) => l !== langValue)
      : [...selected, langValue];
    setSelected(updated);
  };

  const handleSave = () => {
    onUpdateField("languages", selected);
    setShowPicker(false);
  };

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container} className='mx-3 border border-gray-100'>
      {/* Display selected languages */}
      <View style={s.selectedContainer}>
        {selected.length > 0 ? (
          <View style={s.chipRow}>
            {selected.map((lang) => (
              <View key={lang} style={s.chip}>
                <Globe size={14} color={colors.primary} />
                <Text style={s.chipText}>{lang}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const updated = selected.filter((l) => l !== lang);
                    setSelected(updated);
                    onUpdateField("languages", updated);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color="#999" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.placeholder}>No languages selected</Text>
        )}
      </View>

      {/* Add / Edit button */}
      <TouchableOpacity
        style={s.addButton}
        onPress={() => setShowPicker(!showPicker)}
      >
        <Text style={s.addButtonText}>
          {showPicker ? "Close" : selected.length > 0 ? "Edit Languages" : "Add Languages"}
        </Text>
      </TouchableOpacity>

      {/* Language picker */}
      {showPicker && (
        <View style={s.pickerContainer}>
          <ScrollView
            style={s.optionsList}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {languageOptions.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.optionItem, isSelected && s.optionItemSelected]}
                  onPress={() => toggleLanguage(opt.value)}
                >
                  <Text
                    style={[
                      s.optionText,
                      isSelected && s.optionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <View style={s.checkmark}>
                      <Text style={s.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={s.saveButton} onPress={handleSave}>
            <Text style={s.saveButtonText}>Save Languages</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  selectedContainer: {
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "PlusJakartaSansMedium",
  },
  placeholder: {
    fontSize: 14,
    color: "#999",
    fontFamily: "PlusJakartaSans",
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: "flex-start",
  },
  addButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontFamily: "PlusJakartaSansSemiBold",
  },
  pickerContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  optionsList: {
    maxHeight: 250,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  optionItemSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  optionText: {
    fontSize: 15,
    color: "#333",
    fontFamily: "PlusJakartaSansMedium",
  },
  optionTextSelected: {
    color: colors.primary,
    fontFamily: "PlusJakartaSansBold",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
  },
});

export default LanguageSelection;
