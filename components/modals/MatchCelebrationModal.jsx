import { ArrowRight, Heart, MessageCircle, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import { ICE_BREAKERS } from "../../constant/iceBreakers";
import BaseModal from "./BaseModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MatchCelebrationModal = ({
  visible,
  onClose,
  matchedUser,
  currentUser,
  onSendMessage,
  onContinueSwiping,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedIceBreaker, setSelectedIceBreaker] = useState("");

  useEffect(() => {
    if (visible) {
      setSelectedIceBreaker("");

      // Entrance animations
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(heartAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      heartAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, heartAnim, fadeAnim]);

  const handleSendMessage = () => {
    if (!selectedIceBreaker) return;
    onSendMessage?.(matchedUser, selectedIceBreaker);
    onClose?.();
  };

  const handleContinueSwiping = () => {
    onContinueSwiping?.();
    onClose?.();
  };

  const matchedUserImage = matchedUser?.images?.[0];
  const currentUserImage = currentUser?.images?.[0];

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <View style={styles.container}>
        {/* Background gradient effect */}
        <View style={styles.backgroundOverlay} />

        {/* Celebration content */}
        <View style={styles.content}>
          {/* Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.sparkleRow}>
              <Sparkles size={24} color={colors.secondary} />
              <Text style={styles.matchTitle}>It&apos;s a Match!</Text>
              <Sparkles size={24} color={colors.secondary} />
            </View>
            <Text style={styles.matchSubtitle}>
              You and {matchedUser?.name || "someone special"} liked each other
            </Text>
          </Animated.View>

          {/* Profile images */}
          <Animated.View
            style={[
              styles.profilesContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.profileImageWrapper}>
              {currentUserImage ? (
                <Image
                  source={{ uri: currentUserImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>You</Text>
                </View>
              )}
            </View>

            <Animated.View
              style={[
                styles.heartBadge,
                {
                  transform: [
                    {
                      scale: heartAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1.3, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Heart size={28} color="#fff" fill="#fff" />
            </Animated.View>

            <View style={styles.profileImageWrapper}>
              {matchedUserImage ? (
                <Image
                  source={{ uri: matchedUserImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>
                    {matchedUser?.name?.[0] || "?"}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Ice Breaker suggestions */}
          <Animated.View style={[styles.iceBreakerContainer, { opacity: fadeAnim }]}>
            <View style={styles.iceBreakerHeader}>
              <MessageCircle size={18} color={colors.primary} />
              <Text style={styles.iceBreakerLabel}>Pick an Ice Breaker</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iceBreakerList}
            >
              {ICE_BREAKERS.map((item) => {
                const isSelected = selectedIceBreaker === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setSelectedIceBreaker(item)}
                    style={[
                      styles.iceBreakerChip,
                      isSelected
                        ? styles.iceBreakerChipSelected
                        : styles.iceBreakerChipUnselected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.iceBreakerChipText,
                        isSelected
                          ? styles.iceBreakerChipTextSelected
                          : styles.iceBreakerChipTextUnselected,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Action buttons */}
          <Animated.View style={[styles.buttonsContainer, { opacity: fadeAnim }]}>
            <Pressable
              style={[
                styles.sendMessageButton,
                !selectedIceBreaker && styles.sendMessageButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!selectedIceBreaker}
            >
              <MessageCircle size={20} color="#fff" />
              <Text style={styles.sendMessageText}>Send a message</Text>
            </Pressable>

            <Pressable
              style={styles.continueButton}
              onPress={handleContinueSwiping}
            >
              <Text style={styles.continueText}>Continue swiping</Text>
              <ArrowRight size={20} color={colors.primary} />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(238, 95, 43, 0.15)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  sparkleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  matchTitle: {
    fontSize: 36,
    fontFamily: "PlusJakartaSansBold",
    color: "#fff",
    textAlign: "center",
  },
  matchSubtitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  profilesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.secondary,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "PlusJakartaSansBold",
  },
  heartBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: -16,
    zIndex: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  iceBreakerContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    width: SCREEN_WIDTH - 48,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  iceBreakerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  iceBreakerLabel: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  iceBreakerText: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansMedium",
    color: "#fff",
    lineHeight: 24,
  },
  iceBreakerList: {
    gap: 10,
    paddingRight: 4,
  },
  iceBreakerChip: {
    maxWidth: SCREEN_WIDTH - 110,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  iceBreakerChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  iceBreakerChipUnselected: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  iceBreakerChipText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "PlusJakartaSansMedium",
  },
  iceBreakerChipTextSelected: {
    color: "#fff",
  },
  iceBreakerChipTextUnselected: {
    color: "rgba(255,255,255,0.9)",
  },
  buttonsContainer: {
    width: SCREEN_WIDTH - 48,
    gap: 12,
  },
  sendMessageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
  },
  sendMessageButtonDisabled: {
    opacity: 0.45,
  },
  sendMessageText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "PlusJakartaSansSemiBold",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  continueText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "PlusJakartaSansMedium",
  },
});

export default MatchCelebrationModal;
