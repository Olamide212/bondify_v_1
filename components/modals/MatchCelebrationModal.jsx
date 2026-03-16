import { Audio } from "expo-av";
import { MessageCircle, Sparkles, X } from "lucide-react-native";
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

// Helper function to extract image URI
const extractImageUri = (item) => {
  if (!item) return null;
  if (typeof item === 'string' && item.length > 0) return item;
  if (typeof item === 'object')
    return item.url || item.uri || item.secure_url || item.imageUrl || item.image || item.src || null;
  return null;
};

const MatchCelebrationModal = ({
  visible,
  onClose,
  matchedUser,
  currentUser,
  onSendMessage,
  onContinueSwiping,
}) => {
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const badgeScale  = useRef(new Animated.Value(0)).current;
  const soundRef    = useRef(null);

  const [selectedIceBreaker, setSelectedIceBreaker] = useState("");

  useEffect(() => {
    if (visible) {
      setSelectedIceBreaker("");
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
      badgeScale.setValue(0);

      // Play match sound
      const playMatchSound = async () => {
        try {
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
          const { sound } = await Audio.Sound.createAsync(
            require("../../assets/sounds/match.wav"),
            { shouldPlay: true, volume: 1.0 }
          );
          soundRef.current = sound;
        } catch (e) {
          if (__DEV__) console.warn("[MatchCelebrationModal] audio playback failed:", e);
        }
      };
      playMatchSound();

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScale, {
          toValue: 1,
          tension: 80,
          friction: 5,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    return () => {
      soundRef.current?.unloadAsync().catch((e) => {
        if (__DEV__) console.warn("[MatchCelebrationModal] audio cleanup failed:", e);
      });
      soundRef.current = null;
    };
  }, [visible]);

  const handleSendMessage = () => {
    if (!selectedIceBreaker) return;
    onSendMessage?.(matchedUser, selectedIceBreaker);
    onClose?.();
  };

  const handleContinueSwiping = () => {
    onContinueSwiping?.();
    onClose?.();
  };

  const matchedUserImage = extractImageUri(matchedUser?.images?.[0]);
  const currentUserImage = extractImageUri(currentUser?.images?.[0]);
  const matchedName      = matchedUser?.name || matchedUser?.firstName || "someone special";

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <View style={styles.container}>

        {/* Close button */}
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <X size={18} color="#555" />
        </Pressable>

        {/* Brandname */}
        <Text style={styles.brandName}>Bondies</Text>

        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Title */}
          <Text style={styles.matchTitle}>It&apos;s a Match!</Text>
          <Text style={styles.matchSubtitle}>You both sparked an interest!</Text>

          {/* Profile images */}
          <View style={styles.profilesContainer}>
            {/* Decorative doodles background */}
            <View style={styles.doodleWrap} pointerEvents="none">
              <Text style={styles.doodle1}>✏️</Text>
              <Text style={styles.doodle2}>🌿</Text>
              <Text style={styles.doodle3}>♡</Text>
            </View>

            {/* Current user */}
            <View style={[styles.avatarWrapper, styles.avatarLeft]}>
              {currentUserImage ? (
                <Image source={{ uri: currentUserImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>You</Text>
                </View>
              )}
            </View>

            {/* Sparkle badge */}
            <Animated.View
              style={[
                styles.sparkBadge,
                { transform: [{ scale: badgeScale }] },
              ]}
            >
              <Sparkles size={22} color="#fff" fill="#fff" />
            </Animated.View>

            {/* Matched user */}
            <View style={[styles.avatarWrapper, styles.avatarRight]}>
              {matchedUserImage ? (
                <Image source={{ uri: matchedUserImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {matchedName?.[0]?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Body text */}
          <Text style={styles.bodyText}>
            You and{" "}
            <Text style={styles.bodyNameBold}>{matchedName}</Text>
            {" "}have sparked an interest in each other.
          </Text>
          <Text style={styles.ctaLine}>DON&apos;T KEEP THEM WAITING!</Text>

          {/* Icebreakers */}
          <Text style={styles.iceBreakerTitle}>QUICK ICEBREAKERS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.iceBreakerList}
            style={styles.iceBreakerScroll}
          >
            {ICE_BREAKERS.map((item) => {
              const isSelected = selectedIceBreaker === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setSelectedIceBreaker(isSelected ? "" : item)}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipSelected : styles.chipUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable
              style={[
                styles.sendBtn,
                !selectedIceBreaker && styles.sendBtnDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!selectedIceBreaker}
            >
              <MessageCircle size={20} color={colors.primary} />
              <Text style={styles.sendBtnText}>Send a Message</Text>
            </Pressable>

            <Pressable style={styles.keepSwipingBtn} onPress={handleContinueSwiping}>
              <Text style={styles.keepSwipingText}>Keep Swiping</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary, 
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  closeBtn: {
    position:        "absolute",
    top:             30,
    left:            20,
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems:      "center",
    justifyContent:  "center",
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.1,
    shadowRadius:    4,
    elevation:       3,
  },
  brandName: {
    fontSize:    20,
    fontFamily:  "PlusJakartaSansBold",
    color:       "#fff",
    marginBottom: 28,
  },

  // ── Content wrapper ──────────────────────────────────────────────────────────
  content: {
    flex:       1,
    width:      "100%",
    alignItems: "center",
  },

  // ── Title ────────────────────────────────────────────────────────────────────
  matchTitle: {
    fontSize:    42,
    fontFamily:  "PlusJakartaSansBold",
    color:       "#fff",  // white
    textAlign:   "center",
    marginBottom: 8,
  },
  matchSubtitle: {
    fontSize:    16,
    fontFamily:  "PlusJakartaSansMedium",
    color:       "#fff",
    textAlign:   "center",
    marginBottom: 24,
  },

  // ── Profile images ───────────────────────────────────────────────────────────
  profilesContainer: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   32,
    height:         140,
    width:          "100%",
  },
  doodleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     "center",
    justifyContent: "center",
  },
  doodle1: { position: "absolute", left:  "10%", top:    "10%", fontSize: 22, opacity: 0.10 },
  doodle2: { position: "absolute", left:  "40%", top:    "5%",  fontSize: 20, opacity: 0.35 },
  doodle3: { position: "absolute", right: "8%",  bottom: "15%", fontSize: 24, opacity: 0.35 },

  avatarWrapper: {
    width:        140,
    height:       140,
    borderRadius: 100,
    borderWidth:  3,
    borderColor:  "#fff",
    overflow:     "hidden",
    shadowColor:  "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation:    6,
    backgroundColor: "#e5c9b8",
  },
  avatarLeft: {
    marginRight: -18,
    zIndex:      1,
  },
  avatarRight: {
    marginLeft: -18,
    zIndex:     1,
  },
  avatar: {
    width:  "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    backgroundColor: "#e5c9b8",
    alignItems:      "center",
    justifyContent:  "center",
  },
  avatarInitial: {
    color:      "#fff",
    fontSize:   28,
    fontFamily: "PlusJakartaSansBold",
  },

  // Sparkle badge — sits between the two avatars
  sparkBadge: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: colors.primary,
    alignItems:      "center",
    justifyContent:  "center",
    zIndex:          10,
    shadowColor:     colors.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    8,
    elevation:       8,
    marginHorizontal: -4,
  },

  // ── Body text ─────────────────────────────────────────────────────────────────
  bodyText: {
    fontSize:    16,
    fontFamily:  "PlusJakartaSansMedium",
    color:       "#fff",
    textAlign:   "center",
    lineHeight:  24,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  bodyNameBold: {
    fontFamily: "PlusJakartaSansBold",
    color:      colors.secondary,
  },
  ctaLine: {
    fontSize:    14,
    fontFamily:  "PlusJakartaSansBold",
    color:       colors.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 28,
  },

  // ── Icebreakers ───────────────────────────────────────────────────────────────
  iceBreakerTitle: {
    fontSize:    11,
    fontFamily:  "PlusJakartaSansBold",
    color:       "#999",
    letterSpacing: 1.4,
    marginBottom: 12,
    alignSelf:   "flex-start",
    marginLeft:  2,
  },
  iceBreakerScroll: {
    width:        "100%",
    marginBottom: 28,
  },
  iceBreakerList: {
    gap:         10,
    paddingRight: 8,
  },
  chip: {
    borderRadius:    20,
    paddingVertical:   10,
    paddingHorizontal: 16,
    borderWidth:     1.5,
    maxWidth:        SCREEN_WIDTH - 80,
  },
  chipSelected: {
    backgroundColor: colors.secondary,
    borderColor:     colors.secondary,
  },
  chipUnselected: {
    backgroundColor: "#fff",
    borderColor:     "#E5D5CB",
  },
  chipText: {
    fontSize:   14,
    fontFamily: "PlusJakartaSansMedium",
    lineHeight: 20,
  },
  chipTextSelected: {
    color: colors.primary,
  },
  chipTextUnselected: {
    color: colors.primary,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────────
  buttonsContainer: {
    width: "100%",
    gap:   12,
  },
  sendBtn: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    gap:            10,
    backgroundColor: colors.secondary,
    paddingVertical: 17,
    borderRadius:   30,
    shadowColor:    colors.secondary,
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.3,
    shadowRadius:   8,
    elevation:      4,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnText: {
    color:      colors.primary,
    fontSize:   17,
    fontFamily: "PlusJakartaSansSemiBold",
  },
  keepSwipingBtn: {
    alignItems:      "center",
    justifyContent:  "center",
    paddingVertical: 17,
    borderRadius:    30,
    borderWidth:     1.5,
    borderColor:     colors.secondary,
    backgroundColor: "transparent",
  },
  keepSwipingText: {
    color:      colors.secondary,
    fontSize:   17,
    fontFamily: "PlusJakartaSansMedium",
  },
});

export default MatchCelebrationModal;