/**
 * ActionTipsOverlay.jsx
 *
 * Shown once (stored in AsyncStorage) to first-time users to explain
 * the three swipe action buttons.
 *
 * Props
 *   onDismiss(): void
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../../constant/colors";

const STORAGE_KEY = "@bondify/firstTime/actionTips";

const TIPS = [
  { icon: "👈", label: "Swipe left",  desc: "Pass — not your type" },
  { icon: "💌", label: "Compliment",  desc: "Tab to send a compliment" },
  { icon: "❤️",  label: "Swipe right", desc: "Like — start a connection" },
];

const ActionTipsOverlay = ({ onDismiss }) => {
  const opacity  = useRef(new Animated.Value(0)).current;
  const slideY   = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideY,  { toValue: 0, useNativeDriver: true, bounciness: 5 }),
    ]).start();
  }, [opacity, slideY]);

  const handleDismiss = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "1").catch(() => {});
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(slideY,  { toValue: 20, duration: 220, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  };

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ translateY: slideY }] }]}>
        <Text style={styles.title}>How it works</Text>

        <View style={styles.tipsRow}>
          {TIPS.map((t, i) => (
            <View key={i} style={styles.tipItem}>
              <Text style={styles.tipIcon}>{t.icon}</Text>
              <Text style={styles.tipLabel}>{t.label}</Text>
              <Text style={styles.tipDesc}>{t.desc}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.gotItBtn} onPress={handleDismiss}>
          <Text style={styles.gotItText}>Got it!</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

/** Check AsyncStorage and return true if tips should be shown. */
ActionTipsOverlay.shouldShow = async () => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY);
    return val !== "1";
  } catch {
    return true;
  }
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent:  "flex-end",
    zIndex:          500,
  },
  card: {
    backgroundColor: '#121212',
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    padding:              28,
    paddingBottom:        44,
    alignItems:           "center",
  },
  title: {
    fontSize:   20,
    fontFamily: "PlusJakartaSansBold",
    color: '#E5E5E5',
    marginBottom: 24,
  },
  tipsRow: {
    flexDirection:  "row",
    gap:            16,
    marginBottom:   28,
    justifyContent: "center",
  },
  tipItem: {
    alignItems:  "center",
    flex:        1,
    gap:         4,
  },
  tipIcon:  { fontSize: 34 },
  tipLabel: { fontSize: 13, fontFamily: "PlusJakartaSansBold", color: '#E5E5E5', textAlign: "center" },
  tipDesc:  { fontSize: 12, fontFamily: "PlusJakartaSans",     color: "#888", textAlign: "center", lineHeight: 16 },

  gotItBtn: {
    backgroundColor: colors.primary,
    borderRadius:    99,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  gotItText: { color: "#fff", fontSize: 16, fontFamily: "PlusJakartaSansBold" },
});

export default ActionTipsOverlay;
