/**
 * NotificationBanner.jsx
 *
 * In-app push notification banner — Reanimated 3 compatible.
 * Uses the RNGH v2 Gesture API instead of the removed useAnimatedGestureHandler.
 */

import { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_HEIGHT = 72;
const AUTO_DISMISS_MS = 4000;
const SWIPE_UP_THRESHOLD = -30;

const TYPE_META = {
  match:         { icon: "💜", label: "New Match" },
  message:       { icon: "💬", label: "Message" },
  like:          { icon: "❤️",  label: "New Like" },
  superLike:     { icon: "⭐", label: "Super Like" },
  profile_visit: { icon: "👀", label: "Profile Visit" },
  notification:  { icon: "🔔", label: "Notification" },
};

const getMeta = (type) => TYPE_META[type] ?? TYPE_META.notification;

// ─── Component ────────────────────────────────────────────────────────────────

const NotificationBanner = ({ notification, onDismiss, onPress }) => {
  const insets = useSafeAreaInsets();

  const HIDDEN_Y  = -(BANNER_HEIGHT + insets.top + 20);
  const VISIBLE_Y = insets.top + 12;

  const translateY   = useSharedValue(HIDDEN_Y);
  const opacity      = useSharedValue(0);
  const dragStartY   = useSharedValue(0);

  const dismissTimer = useRef(null);

  // ── animation helpers (called from JS thread) ──────────────────────────────
  const hideAndCall = (cb) => {
    "worklet";
    translateY.value = withTiming(HIDDEN_Y, { duration: 280 }, () => {
      opacity.value = withTiming(0, { duration: 80 }, () => {
        if (cb) runOnJS(cb)();
      });
    });
  };

  const snapToVisible = () => {
    "worklet";
    translateY.value = withSpring(VISIBLE_Y, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    });
  };

  // JS-thread dismiss (clears timer too)
  const triggerDismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    hideAndCall(onDismiss);
  };

  // ── show / hide on notification change ────────────────────────────────────
  useEffect(() => {
    if (!notification) return;

    // Reset position and show
    translateY.value = HIDDEN_Y;
    opacity.value    = 1;
    snapToVisible();

    // Auto-dismiss
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      hideAndCall(onDismiss);
    }, AUTO_DISMISS_MS);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification]);

  // ── Gesture API (Reanimated 3 / RNGH v2) ──────────────────────────────────
  const panGesture = Gesture.Pan()
    .onStart(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((e) => {
      // Only allow dragging upward
      if (e.translationY < 0) {
        translateY.value = dragStartY.value + e.translationY * 0.5;
      }
    })
    .onEnd((e) => {
      if (e.translationY < SWIPE_UP_THRESHOLD) {
        // Swiped far enough — dismiss
        hideAndCall(onDismiss);
      } else {
        // Snap back
        snapToVisible();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!notification) return null;

  const meta = getMeta(notification.type);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.banner, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => {
            triggerDismiss();
            onPress?.(notification);
          }}
          style={styles.touchable}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{meta.icon}</Text>
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title || meta.label}
            </Text>
            <Text style={styles.body} numberOfLines={1}>
              {notification.body}
            </Text>
            {notification.type === "profile_visit" && (
              <Text style={styles.ctaText}>Tap to view profile →</Text>
            )}
          </View>

          {/* Close */}
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={triggerDismiss}
            style={styles.closeBtn}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    width: SCREEN_WIDTH - 24,
    minHeight: BANNER_HEIGHT,
    borderRadius: 20,
    backgroundColor: "#1C1C1E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 9999,
    overflow: "hidden",
  },
  touchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "PlusJakartaSansBold",
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    fontFamily: "PlusJakartaSans",
    lineHeight: 17,
  },
  closeBtn: {
    paddingLeft: 8,
    flexShrink: 0,
  },
  closeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },
  ctaText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
    fontFamily: "PlusJakartaSansBold",
    marginTop: 3,
  },
});

export { NotificationBanner };