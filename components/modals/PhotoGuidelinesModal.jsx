import { X } from "lucide-react-native";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";

const PhotoGuidelinesModal = ({ visible, onClose }) => {
  const guidelines = [
    {
      title: "Clear Face Shot",
      description: "Make sure your face is clearly visible and well-lit",
      emoji: "📸",
    },
    {
      title: "Good Lighting",
      description: "Natural light works best. Avoid shadows and backlighting",
      emoji: "💡",
    },
    {
      title: "Recent Photo",
      description: "Use a recent photo that looks like you today",
      emoji: "📅",
    },
    {
      title: "Professional Appearance",
      description: "Wear clean, appropriate clothing",
      emoji: "👔",
    },
    {
      title: "No Filters or Heavy Editing",
      description: "Use photos as they are, minimal editing only",
      emoji: "✨",
    },
    {
      title: "Avoid Sunglasses & Hats",
      description: "Let your face be fully visible",
      emoji: "😎",
    },
    {
      title: "No Group Photos",
      description: "Upload individual photos, just you",
      emoji: "👤",
    },
    {
      title: "No Screenshots",
      description: "Upload actual photos, not screenshots",
      emoji: "📱",
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Photo Guidelines</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Follow these tips to get better matches
          </Text>

          <View style={styles.guidelinesList}>
            {guidelines.map((item, index) => (
              <View key={index} style={styles.guidelineItem}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.guidelineContent}>
                  <Text style={styles.guidelineTitle}>{item.title}</Text>
                  <Text style={styles.guidelineDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.dosDonts}>
            <View style={styles.dosContainer}>
              <Text style={styles.dosTitle}>✅ DO</Text>
              <Text style={styles.dosText}>
                • Smile naturally{"\n"}
                • Show your personality{"\n"}
                • Be authentic{"\n"}
                • Use variety in poses
              </Text>
            </View>

            <View style={styles.dontsContainer}>
              <Text style={styles.dontsTitle}>❌ DON'T</Text>
              <Text style={styles.dontsText}>
                • Use old photos{"\n"}
                • Over-edit or filter{"\n"}
                • Include other people{"\n"}
                • Use blurry images
              </Text>
            </View>
          </View>

          <Text style={styles.footer}>
            Photos that violate our guidelines may be rejected. Respectful and authentic photos help everyone find better matches!
          </Text>
        </ScrollView>

        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  closeBtn: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  guidelinesList: {
    gap: 16,
    marginBottom: 32,
  },
  guidelineItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  emoji: {
    fontSize: 24,
    marginTop: 2,
  },
  guidelineContent: {
    flex: 1,
  },
  guidelineTitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansSemiBold",
    color: "#111",
    marginBottom: 4,
  },
  guidelineDescription: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
  },
  dosDonts: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  dosContainer: {
    flex: 1,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  dosTitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
    color: "#10B981",
    marginBottom: 8,
  },
  dosText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#047857",
    lineHeight: 20,
  },
  dontsContainer: {
    flex: 1,
    backgroundColor: "#FEF3EC",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  dontsTitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
    color: "#EF4444",
    marginBottom: 8,
  },
  dontsText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#DC2626",
    lineHeight: 20,
  },
  footer: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans",
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 32,
    paddingVertical: 14,
    borderRadius: 99,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
  },
});

export default PhotoGuidelinesModal;
