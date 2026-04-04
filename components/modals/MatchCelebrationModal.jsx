import { Audio } from "expo-av";
import { MessageCircle, Send, Sparkles, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import { ICE_BREAKERS } from "../../constant/iceBreakers";
import LoadingImage from '../ui/LoadingImage';
import BaseModal from "./BaseModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Helper function to extract image URI from various data shapes
const extractImageUri = (item) => {
  if (!item) return null;
  if (typeof item === 'string' && item.length > 0) return item;
  if (typeof item === 'object')
    return item.url || item.uri || item.secure_url || item.imageUrl || item.image || item.src || null;
  return null;
};

// Robust helper: pull the first usable image URL from a user object
const getUserImage = (user) => {
  if (!user) return null;

  // 1. Direct profileImage / avatar string
  if (typeof user.profileImage === 'string' && user.profileImage) return user.profileImage;
  if (typeof user.avatar === 'string' && user.avatar) return user.avatar;

  // 2. images array (could be strings or objects)
  if (Array.isArray(user.images) && user.images.length > 0) {
    const first = user.images[0];
    const uri = extractImageUri(first);
    if (uri) return uri;
  }

  // 3. photos array fallback
  if (Array.isArray(user.photos) && user.photos.length > 0) {
    const first = user.photos[0];
    const uri = extractImageUri(first);
    if (uri) return uri;
  }

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
  const scrollRef   = useRef(null);
  const inputRef    = useRef(null);
  const keyboardPadding = useRef(new Animated.Value(0)).current;

  const [selectedIceBreaker, setSelectedIceBreaker] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  // Keyboard listeners — scroll to bottom & add padding when keyboard opens
  useEffect(() => {
    if (!visible) return;

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e) => {
      const kbHeight = e.endCoordinates.height;
      Animated.timing(keyboardPadding, {
        toValue: kbHeight,
        duration: Platform.OS === "ios" ? e.duration || 250 : 200,
        useNativeDriver: false,
      }).start();
      // Scroll to bottom so input is visible
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100);
    };

    const onHide = (e) => {
      Animated.timing(keyboardPadding, {
        toValue: 0,
        duration: Platform.OS === "ios" ? (e?.duration || 250) : 200,
        useNativeDriver: false,
      }).start();
    };

    const sub1 = Keyboard.addListener(showEvent, onShow);
    const sub2 = Keyboard.addListener(hideEvent, onHide);
    return () => { sub1.remove(); sub2.remove(); };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setSelectedIceBreaker("");
      setCustomMessage("");
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
      badgeScale.setValue(0);

      // Play match sound
      const playMatchSound = async () => {
        try {
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
          const { sound } = await Audio.Sound.createAsync(
            require("../../assets/sounds/match-2.mp3"),
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

  const messageToSend = selectedIceBreaker || customMessage.trim();

  const handleSendMessage = () => {
    if (!messageToSend) return;
    onSendMessage?.(matchedUser, messageToSend);
    onClose?.();
  };

  const handleContinueSwiping = () => {
    onContinueSwiping?.();
    onClose?.();
  };

  const matchedUserImage = getUserImage(matchedUser);
  const currentUserImage = getUserImage(currentUser);
  const matchedName      = matchedUser?.name || matchedUser?.firstName || "someone special";

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen noPadding >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

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
                <LoadingImage source={{ uri: currentUserImage }} style={styles.avatar} containerStyle={styles.avatarImageContainer} cachePolicy="memory-disk" contentFit="cover" transition={150} indicatorColor="#fff" />
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
                <LoadingImage source={{ uri: matchedUserImage }} style={styles.avatar} containerStyle={styles.avatarImageContainer} cachePolicy="memory-disk" contentFit="cover" transition={150} indicatorColor="#fff" />
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
                  onPress={() => {
                    setSelectedIceBreaker(isSelected ? "" : item);
                    if (!isSelected) setCustomMessage("");
                  }}
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

          {/* Custom message input */}
          <Text style={styles.orDividerText}>OR TYPE YOUR OWN</Text>
          <View style={styles.customInputRow}>
            <TextInput
              ref={inputRef}
              style={styles.customInput}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={customMessage}
              onChangeText={(text) => {
                setCustomMessage(text);
                if (text.trim()) setSelectedIceBreaker("");
              }}
              onFocus={() => {
                setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 300);
              }}
              maxLength={300}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            {customMessage.trim().length > 0 && (
              <Pressable style={styles.customSendBtn} onPress={handleSendMessage}>
                <Send size={18} color="#fff" />
              </Pressable>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable
              style={[
                styles.sendBtn,
                !messageToSend && styles.sendBtnDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!messageToSend}
            >
              <MessageCircle size={20} color={colors.primary} />
              <Text style={styles.sendBtnText}>Send a Message</Text>
            </Pressable>

            <Pressable style={styles.keepSwipingBtn} onPress={handleContinueSwiping}>
              <Text style={styles.keepSwipingText}>Keep Swiping</Text>
            </Pressable>
          </View>
            </Animated.View>

            {/* Keyboard spacer — pushes content up when keyboard is open */}
            <Animated.View style={{ height: keyboardPadding }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    fontFamily:  "OutfitBold",
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
    fontFamily:  "OutfitBold",
    color:       "#fff",  // white
    textAlign:   "center",
    marginBottom: 8,
  },
  matchSubtitle: {
    fontSize:    16,
    fontFamily:  "OutfitMedium",
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
  avatarImageContainer: {
    width:        "100%",
    height:       "100%",
    borderRadius: 100,
    overflow:     "hidden",
  },
  avatarPlaceholder: {
    backgroundColor: "#e5c9b8",
    alignItems:      "center",
    justifyContent:  "center",
  },
  avatarInitial: {
    color:      "#fff",
    fontSize:   28,
    fontFamily: "OutfitBold",
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
    fontFamily:  "OutfitMedium",
    color:       "#fff",
    textAlign:   "center",
    lineHeight:  24,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  bodyNameBold: {
    fontFamily: "OutfitBold",
    color:      colors.white,
  },
  ctaLine: {
    fontSize:    14,
    fontFamily:  "OutfitBold",
    color:       colors.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 28,
  },

  // ── Icebreakers ───────────────────────────────────────────────────────────────
  iceBreakerTitle: {
    fontSize:    11,
    fontFamily:  "OutfitBold",
    color:       "#fff",
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
    borderWidth:     1,
    maxWidth:        SCREEN_WIDTH - 80,
  },
  chipSelected: {
    backgroundColor: colors.white,
    borderColor:     colors.white,
  },
  chipUnselected: {
    backgroundColor: "#121212",
    borderColor:     "#E5D5CB",
  },
  chipText: {
    fontSize:   14,
    fontFamily: "OutfitMedium",
    lineHeight: 20,
    color: '#fff'
  },
  chipTextSelected: {
    color: colors.primary,
  },
  chipTextUnselected: {
    color: colors.white,
  },

  // ── Custom input ──────────────────────────────────────────────────────────────
  orDividerText: {
    fontSize:       11,
    fontFamily:     "OutfitBold",
    color:          "rgba(255,255,255,0.6)",
    letterSpacing:  1.4,
    marginBottom:   10,
    alignSelf:      "flex-start",
    marginLeft:     2,
  },
  customInputRow: {
    width:          "100%",
    flexDirection:  "row",
    alignItems:     "center",
    gap:            10,
    marginBottom:   24,
  },
  customInput: {
    flex:              1,
    backgroundColor:   "rgba(255,255,255,0.12)",
    borderRadius:      24,
    borderWidth:       1,
    borderColor:       "rgba(255,255,255,0.2)",
    paddingHorizontal: 18,
    paddingVertical:   13,
    fontSize:          15,
    fontFamily:        "Outfit",
    color:             "#fff",
  },
  customSendBtn: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: colors.primary,
    alignItems:      "center",
    justifyContent:  "center",
    shadowColor:     colors.primary,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.35,
    shadowRadius:    6,
    elevation:       4,
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
    backgroundColor: colors.white,
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
    fontFamily: "OutfitSemiBold",
  },
  keepSwipingBtn: {
    alignItems:      "center",
    justifyContent:  "center",
    paddingVertical: 17,
    borderRadius:    30,
    borderWidth:     1.5,
    borderColor:     colors.white,
    backgroundColor: "transparent",
  },
  keepSwipingText: {
    color:      colors.white,
    fontSize:   17,
    fontFamily: "OutfitMedium",
  },
});

export default MatchCelebrationModal;