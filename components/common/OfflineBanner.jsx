/**
 * OfflineBanner.jsx
 *
 * Displays a non-dismissable banner at the top of the screen when the device
 * has no internet connectivity. Uses periodic fetch-based checks since
 * @react-native-community/netinfo is not in this project's dependencies.
 *
 * Usage: Mount once near the root of your app (e.g. inside app/_layout.jsx).
 */

import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const CHECK_INTERVAL_MS = 5000;   // re-check every 5 s
// Use a neutral, widely-available endpoint to check connectivity.
// Falls back gracefully if the primary check is blocked.
const CHECK_URL = "https://www.google.com/generate_204";
const CHECK_TIMEOUT_MS = 3000;

async function isOnline() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    const res = await fetch(CHECK_URL, { method: "HEAD", signal: controller.signal });
    clearTimeout(id);
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

const OfflineBanner = () => {
  const [offline, setOffline] = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;

  const showBanner = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      const online = await isOnline();
      if (!isMounted) return;
      setOffline(!online);
      if (!online) {
        showBanner();
      } else {
        hideBanner();
      }
    };

    // Initial check
    check();

    const interval = setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!offline) return null;

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents="none"
    >
      <Text style={styles.text}>📶 No internet connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1F2937",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    zIndex: 9999,
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default OfflineBanner;
