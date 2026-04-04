/**
 * CardFeedbackModal.jsx
 *
 * A lightweight card that slides up briefly to confirm an action
 * (like, nope, compliment sent, super-like, etc.) then auto-dismisses.
 *
 * Props
 *   visible:  boolean
 *   action:   'like' | 'nope' | 'compliment' | 'superlike' | null
 *   onDone(): void  — called when the animation finishes
 */

import { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text
} from "react-native";
import { colors } from "../../constant/colors";

const { width: SW } = Dimensions.get("window");

const ACTIONS = {
  like: {
    emoji:    "❤️",
    label:    "Liked!",
    bg:       colors.primaryLight,
    border:   colors.primary,
    text:     colors.primary,
  },
  nope: {
    emoji:    "👋",
    label:    "Passed",
    bg:       "#F9FAFB",
    border:   "#E5E7EB",
    text:     "#555",
  },
  compliment: {
    emoji:    "💌",
    label:    "Compliment sent!",
    bg:       "#FFF5F8",
    border:   "#FBCFE8",
    text:     "#EC4899",
  },
  superlike: {
    emoji:    "⭐",
    label:    "Super liked!",
    bg:       "#FEFCE8",
    border:   "#FDE047",
    text:     "#CA8A04",
  },
};

const SHOW_DURATION   = 1600;   // ms to stay visible
const ANIM_IN         = 260;
const ANIM_OUT        = 200;

const CardFeedbackModal = ({ visible, action, onDone }) => {
  const slideY    = useRef(new Animated.Value(80)).current;
  const opacity   = useRef(new Animated.Value(0)).current;
  const timerRef  = useRef(null);

  useEffect(() => {
    if (visible && action) {
      clearTimeout(timerRef.current);

      // Slide + fade in
      slideY.setValue(60);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(slideY,  { toValue: 0, useNativeDriver: true, bounciness: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: ANIM_IN,    useNativeDriver: true }),
      ]).start(() => {
        timerRef.current = setTimeout(() => {
          // Slide + fade out
          Animated.parallel([
            Animated.timing(slideY,  { toValue: -30, duration: ANIM_OUT, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0,   duration: ANIM_OUT, useNativeDriver: true }),
          ]).start(() => {
            onDone?.();
          });
        }, SHOW_DURATION);
      });
    }

    return () => clearTimeout(timerRef.current);
  }, [visible, action, slideY, opacity, onDone]);

  if (!visible || !action) return null;

  const cfg = ACTIONS[action] ?? ACTIONS.like;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.card,
        {
          backgroundColor: cfg.bg,
          borderColor:     cfg.border,
          opacity,
          transform: [{ translateY: slideY }],
        },
      ]}
    >
      <Text style={styles.emoji}>{cfg.emoji}</Text>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position:         "absolute",
    alignSelf:        "center",
    bottom:           120,
    flexDirection:    "row",
    alignItems:       "center",
    gap:              8,
    paddingHorizontal: 22,
    paddingVertical:   12,
    borderRadius:     99,
    borderWidth:      1.5,
    shadowColor:      "#000",
    shadowOffset:     { width: 0, height: 4 },
    shadowOpacity:    0.10,
    shadowRadius:     10,
    elevation:        6,
    zIndex:           999,
    left:             (SW - 200) / 2,
    width:            200,
    justifyContent:   "center",
  },
  emoji: { fontSize: 22 },
  label: { fontSize: 15, fontFamily: "OutfitBold" },
});

export default CardFeedbackModal;
