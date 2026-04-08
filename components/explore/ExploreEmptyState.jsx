import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constant/colors";

const ExploreEmptyState = ({ emoji, title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emoji: {
    fontSize: 34,
    marginBottom: 12,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontFamily: "OutfitBold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: "Outfit",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
});

export default ExploreEmptyState;
