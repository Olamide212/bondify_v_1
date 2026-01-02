import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {images} from "../../constant/images"

const { width, height } = Dimensions.get("window");

const VARIANT_STYLES = {
  success: {
    bg: "#22C55E",
    icon: "checkmark-circle-outline",
  },
  error: {
    bg: "#EF4444",
    icon: "close-circle-outline",
  },
  info: {
    bg: "#3B82F6",
    icon: "information-circle-outline",
  },
  warning: {
    bg: "#F59E0B",
    icon: "warning-outline",
  },
};

const Snackbar = ({
  visible,
  message,
  onDismiss,
  duration = 3000,
  variant = "info", // default variant
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
const translateY = useRef(new Animated.Value(-50)).current;

useEffect(() => {
  if (visible) {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, // slide down into place
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timeout);
  }
}, [visible]);

const handleDismiss = () => {
  Animated.parallel([
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: -50, // slide back up out of view
      duration: 200,
      useNativeDriver: true,
    }),
  ]).start(() => {
    onDismiss?.();
  });
};

  if (!visible) return null;

  const { bg, icon } = VARIANT_STYLES[variant] || VARIANT_STYLES.info;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.snackbarContainer,
          {
            backgroundColor: bg,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Image source={images.bondifyIcon} contentFit="contain" width={25} height={25} className='mr-3' />
      
        <Text style={styles.snackbarText}>{message}</Text>
        <TouchableOpacity onPress={handleDismiss}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default Snackbar;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    height,
    width,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
    paddingTop: 60,
    zIndex: 999,
  },
  snackbarContainer: {
    marginHorizontal: 20,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  snackbarText: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },
  dismissText: {
    color: "#fff",
    fontSize: 13,
    marginLeft: 12,
  },
});
