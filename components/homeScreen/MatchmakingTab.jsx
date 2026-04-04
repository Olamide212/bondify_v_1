import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const MatchmakingTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.aiMatchContainer}>
        <Text style={styles.aiMatchText}>AI-Powered Matchmaking</Text>
      </View>
      <View style={styles.matchmakingContent}>
        <Text style={styles.matchmakingTitle}>Personalized AI Matching</Text>
        <Text style={styles.matchmakingDescription}>
          Our advanced AI analyzes your preferences, behavior, and compatibility
          factors to find your perfect match.
        </Text>
        <TouchableOpacity style={styles.matchmakingButton}>
          <Text style={styles.matchmakingButtonText}>
            Talk to Bondify Matchmaker
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  aiMatchContainer: {
    alignSelf: "center",
    backgroundColor: "rgba(74, 144, 226, 0.9)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 20,
  },
  aiMatchText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "OutfitMedium",
  },
  matchmakingContent: {
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
  },
  matchmakingTitle: {
    fontSize: 24,
    fontFamily: "OutfitBold",
    textAlign: "center",
    marginBottom: 16,
    color: '#D1D5DB',
  },
  matchmakingDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  matchmakingButton: {
    backgroundColor: "#FF0066",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: "#FF0066",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  matchmakingButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "OutfitMedium",
  },
});

export default MatchmakingTab;
