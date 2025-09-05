import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const badgesData = [
  {
    id: "1",
    title: "First Match",
    description: "Awarded when you make your first match",
    unlocked: true,
    tips: "Keep swiping and engaging with profiles to match faster!",
  },
  {
    id: "2",
    title: "Social Butterfly",
    description: "Awarded after 10 matches",
    unlocked: false,
    progress: 7,
    goal: 10,
    tips: "Increase your chances by liking more profiles and being active daily.",
  },
  {
    id: "3",
    title: "Active User",
    description: "Login 7 days in a row",
    unlocked: true,
    tips: "Daily consistency pays off!",
  },
];

export default function BadgesScreen() {
  const [selectedBadge, setSelectedBadge] = useState(null);

  const renderBadgeCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, item.unlocked ? styles.unlocked : styles.locked]}
      onPress={() => item.unlocked && setSelectedBadge(item)}
      activeOpacity={item.unlocked ? 0.8 : 1}
    >
      <Ionicons
        name={item.unlocked ? "medal" : "lock-closed"}
        size={32}
        color={item.unlocked ? "#FFD700" : "#999"}
      />
      <Text style={styles.badgeTitle}>{item.title}</Text>
      <Text style={styles.badgeDesc} numberOfLines={1}>
        {item.description}
      </Text>

      {!item.unlocked && item.progress !== undefined && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressFill,
              { width: `${(item.progress / item.goal) * 100}%` },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Showcase Grid */}
      <Text style={styles.sectionTitle}>Badge Showcase</Text>
      <View style={styles.grid}>
        {badgesData.map((badge) => (
          <TouchableOpacity
            key={badge.id}
            style={[
              styles.gridBadge,
              badge.unlocked ? styles.unlocked : styles.locked,
            ]}
            onPress={() => badge.unlocked && setSelectedBadge(badge)}
            activeOpacity={badge.unlocked ? 0.8 : 1}
          >
            <Ionicons
              name={badge.unlocked ? "medal" : "lock-closed"}
              size={28}
              color={badge.unlocked ? "#FFD700" : "#999"}
            />
            <Text style={styles.gridBadgeTitle} numberOfLines={1}>
              {badge.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings-Style List */}
      <Text style={styles.sectionTitle}>All Badges</Text>
      <FlatList
        data={badgesData}
        keyExtractor={(item) => item.id}
        renderItem={renderBadgeCard}
        contentContainerStyle={{ paddingBottom: 30 }}
      />

      {/* Badge Details Modal */}
      <Modal visible={!!selectedBadge} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons
              name="medal"
              size={50}
              color="#FFD700"
              style={{ alignSelf: "center" }}
            />
            <Text style={styles.modalTitle}>{selectedBadge?.title}</Text>
            <Text style={styles.modalDesc}>{selectedBadge?.description}</Text>
            <Text style={styles.modalTips}>💡 Tips: {selectedBadge?.tips}</Text>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedBadge(null)}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
  },
  gridBadge: {
    width: "30%",
    padding: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  gridBadgeTitle: { fontSize: 12, marginTop: 6, textAlign: "center" },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#f2f2f2",
  },
  unlocked: { opacity: 1 },
  locked: { opacity: 0.5 },
  badgeTitle: { fontSize: 16, fontWeight: "600" },
  badgeDesc: { fontSize: 12, color: "#666", marginTop: 4 },
  progressContainer: {
    marginTop: 8,
    height: 6,
    backgroundColor: "#ddd",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
  },
  modalDesc: {
    fontSize: 14,
    color: "#555",
    marginVertical: 8,
    textAlign: "center",
  },
  modalTips: { fontSize: 13, color: "#333", marginTop: 6, fontStyle: "italic" },
  closeBtn: {
    backgroundColor: "#FF3B30",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
});
