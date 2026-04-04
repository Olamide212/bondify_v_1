/**
 * AlertModal.jsx
 *
 * A global in-app alert modal to replace native Alert.alert()
 * Supports multiple action buttons with different styles.
 *
 * Usage via AlertContext:
 *   const { showAlert } = useAlert();
 *   showAlert({
 *     icon: 'success' | 'error' | 'warning' | 'info' | 'leave' | 'delete',
 *     title: 'Title',
 *     message: 'Message',
 *     actions: [
 *       { label: 'Cancel', style: 'cancel', onPress: () => {} },
 *       { label: 'OK', style: 'primary', onPress: () => {} },
 *       { label: 'Delete', style: 'destructive', onPress: () => {} },
 *     ],
 *   });
 */

import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";

const BRAND = colors.primary;

const ICON_MAP = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
  leave: "🚪",
  delete: "🗑️",
  question: "❓",
  camera: "📷",
  mic: "🎤",
  location: "📍",
  calendar: "📅",
  coming: "🚀",
};

const AlertModal = ({ visible, icon, title, message, actions, onClose, loading }) => {
  const iconEmoji = ICON_MAP[icon] || icon || null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {iconEmoji && <Text style={styles.iconEmoji}>{iconEmoji}</Text>}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            {actions?.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.actionBtn,
                  action.style === "destructive" && styles.actionBtnDestructive,
                  action.style === "primary" && styles.actionBtnPrimary,
                  action.style === "cancel" && styles.actionBtnCancel,
                ]}
                onPress={action.onPress}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    action.style === "destructive" && styles.actionBtnTextDestructive,
                    action.style === "primary" && styles.actionBtnTextPrimary,
                    action.style === "cancel" && styles.actionBtnTextCancel,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#121212",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: "Outfit",
    color: '#9CA3AF',
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  actionBtnPrimary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: BRAND,
  },
  actionBtnDestructive: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#EF4444",
  },
  actionBtnCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: '#1E1E1E',
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: "OutfitBold",
        color: "#fff",

  },
  actionBtnTextPrimary: {
    fontSize: 15,
    fontFamily: "OutfitBold",
    color: "#fff",
  },
  actionBtnTextDestructive: {
    fontSize: 15,
    fontFamily: "OutfitBold",
    color: "#fff",
  },
  actionBtnTextCancel: {
    fontSize: 15,
    fontFamily: "OutfitBold",
    color: '#9CA3AF',
  },
});

export default AlertModal;
