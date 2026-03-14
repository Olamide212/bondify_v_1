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

  const matchedUserImage = matchedUser?.images?.[0];
  const currentUserImage = currentUser?.images?.[0];
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
              <MessageCircle size={20} color="#fff" />
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
    backgroundColor: "#FDF5EE", // warm cream — matches the design
    alignItems: "center",
    paddingTop: 52,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  closeBtn: {
    position:        "absolute",
    top:             52,
    left:            20,
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: "#EFEFEF",
    alignItems:      "center",
    justifyContent:  "center",
  },
  brandName: {
    fontSize:    17,
    fontFamily:  "PlusJakartaSansBold",
    color:       "#222",
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
    fontSize:    38,
    fontFamily:  "PlusJakartaSansBold",
    color:       colors.primary,  // orange
    textAlign:   "center",
    marginBottom: 6,
  },
  matchSubtitle: {
    fontSize:    15,
    fontFamily:  "PlusJakartaSans",
    color:       "#666",
    textAlign:   "center",
    marginBottom: 32,
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
  doodle1: { position: "absolute", left:  "10%", top:    "10%", fontSize: 22, opacity: 0.35 },
  doodle2: { position: "absolute", left:  "40%", top:    "5%",  fontSize: 20, opacity: 0.35 },
  doodle3: { position: "absolute", right: "8%",  bottom: "15%", fontSize: 24, opacity: 0.35 },

  avatarWrapper: {
    width:        120,
    height:       120,
    borderRadius: 60,
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
    fontSize:    15,
    fontFamily:  "PlusJakartaSans",
    color:       "#333",
    textAlign:   "center",
    lineHeight:  22,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  bodyNameBold: {
    fontFamily: "PlusJakartaSansBold",
    color:      "#222",
  },
  ctaLine: {
    fontSize:    12,
    fontFamily:  "PlusJakartaSansBold",
    color:       colors.primary,
    letterSpacing: 1.2,
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
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
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
    color: "#fff",
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
    backgroundColor: colors.primary,
    paddingVertical: 17,
    borderRadius:   30,
    shadowColor:    colors.primary,
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.3,
    shadowRadius:   8,
    elevation:      4,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnText: {
    color:      "#fff",
    fontSize:   17,
    fontFamily: "PlusJakartaSansSemiBold",
  },
  keepSwipingBtn: {
    alignItems:      "center",
    justifyContent:  "center",
    paddingVertical: 17,
    borderRadius:    30,
    borderWidth:     1.5,
    borderColor:     colors.primary,
    backgroundColor: "transparent",
  },
  keepSwipingText: {
    color:      colors.primary,
    fontSize:   17,
    fontFamily: "PlusJakartaSansMedium",
  },
});

export default MatchCelebrationModal;