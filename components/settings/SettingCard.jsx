import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const SettingsSection = ({ title, items }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface },
      ]}
    >
      {title && (
        <Text style={[styles.title, { color: colors.primary }]}>
          {title}
        </Text>
      )}

      {items.map(({ title, subtitle, description, onPress, icon: RightIcon }, index) => {
        const isLast = index === items.length - 1;

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.row,
              !isLast && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={onPress}
            activeOpacity={0.65}
          >
            <View style={styles.rowInner}>
              {/* Left: title + optional description */}
              <View style={styles.textBlock}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  {title}
                </Text>
                {description && (
                  <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                    {description}
                  </Text>
                )}
              </View>

              {/* Right: subtitle hint + icon */}
              <View style={styles.rightBlock}>
                {subtitle && (
                  <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
                    {subtitle}
                  </Text>
                )}
                {RightIcon ? (
                  <RightIcon size={20} color="#ef4444" />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textTertiary}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    marginBottom: 8,
  },
  row: {
    paddingVertical: 16,
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  textBlock: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSansSemiBold",
  },
  rowDescription: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    marginTop: 2,
    lineHeight: 19,
  },
  rightBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
  },
});

export default SettingsSection;