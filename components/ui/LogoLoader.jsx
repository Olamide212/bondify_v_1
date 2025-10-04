import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Dimensions, Image } from "react-native";
import { Heart } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const LogoLoader = ({ size = 100, color = "#FF5864" }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for the circle
    const pulseAnimation = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    // Scale animation for the heart
    const scaleAnimation = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    // Fade animation for the heart
    const fadeAnimation = Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    // Rotation animation for the heart
    const rotateAnimation = Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    // Loop all animations
    Animated.loop(
      Animated.parallel([
        pulseAnimation,
        Animated.sequence([scaleAnimation, fadeAnimation]),
        rotateAnimation,
      ])
    ).start();
  }, [scaleAnim, opacityAnim, pulseAnim, rotateAnim]);

  // Interpolate the pulse animation for the circle
  const circleScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const circleOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0],
  });

  // Interpolate the rotation animation for the heart
  const heartRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "10deg"],
  });

  return (
    <View style={styles.container}>
      {/* Outer circles */}
      <Animated.View
        style={[
          styles.circle,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            borderWidth: 1,
            borderColor: color,
            opacity: circleOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.circle,
          {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: size * 7,
            borderWidth: 1,
            borderColor: color,
            opacity: circleOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.circle,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size * 0.6,
            borderWidth: 1,
            borderColor: color,
            opacity: circleOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      />

      {/* Main circle with heart */}
      <View
        style={[
          styles.mainCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }, { rotate: heartRotation }],
            opacity: opacityAnim,
          }}
        >
          <Image
            source={require("../../assets/images/bondify-icon-white.png")}
            style={{width: 40, height: 40}}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1000,
  },
  circle: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  mainCircle: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default LogoLoader;
