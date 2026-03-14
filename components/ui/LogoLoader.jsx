import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Text } from "react-native";

/**
 * LogoLoader — a unique animated loader for Bondify.
 *
 * Three animated "bond" dots orbit a central wordmark, suggesting
 * connection / pairing rather than a generic pulsing heart.
 */
const LogoLoader = ({ size = 100, color = "#EE5F2B" }) => {
  // Three dots orbiting
  const rot1 = useRef(new Animated.Value(0)).current;
  const rot2 = useRef(new Animated.Value(0.33)).current;
  const rot3 = useRef(new Animated.Value(0.66)).current;

  // Wordmark fade
  const textOpacity = useRef(new Animated.Value(0.4)).current;

  // Outer ring scale
  const ringScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const DURATION = 2000;

    const spin = (val, offset) =>
      Animated.loop(
        Animated.timing(val, {
          toValue:        offset + 1,
          duration:       DURATION,
          easing:         Easing.linear,
          useNativeDriver: true,
        })
      );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(textOpacity, { toValue: 1,   duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 0.4, duration: 700, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
      ])
    );

    const ringPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(ringScale, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 0.9,  duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    spin(rot1, 0).start();
    spin(rot2, 0.33).start();
    spin(rot3, 0.66).start();
    pulse.start();
    ringPulse.start();
  }, [rot1, rot2, rot3, textOpacity, ringScale]);

  const orbit = size * 0.56;
  const dotSize = size * 0.14;

  const makeDotStyle = (rotVal) => {
    const rotate = rotVal.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
    return {
      position: "absolute",
      width:    orbit * 2,
      height:   orbit * 2,
      top:      -(orbit - size / 2),
      left:     -(orbit - size / 2),
      transform: [{ rotate }],
    };
  };

  return (
    <View style={styles.container}>
      {/* Outer breathing ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width:       size * 1.5,
            height:      size * 1.5,
            borderRadius: size * 0.75,
            borderColor: color,
            transform:   [{ scale: ringScale }],
          },
        ]}
      />

      {/* Centre wordmark */}
      <View
        style={[
          styles.centre,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: "#FFF8F5" },
        ]}
      >
        <Animated.Text style={[styles.wordmark, { color, opacity: textOpacity, fontSize: size * 0.22 }]}>
          bondify
        </Animated.Text>
      </View>

      {/* Orbiting dot 1 */}
      <Animated.View style={makeDotStyle(rot1)} pointerEvents="none">
        <View style={[styles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color, marginLeft: -(dotSize / 2) }]} />
      </Animated.View>

      {/* Orbiting dot 2 — slightly transparent */}
      <Animated.View style={makeDotStyle(rot2)} pointerEvents="none">
        <View style={[styles.dot, { width: dotSize * 0.8, height: dotSize * 0.8, borderRadius: dotSize * 0.4, backgroundColor: color, opacity: 0.7, marginLeft: -(dotSize * 0.4) }]} />
      </Animated.View>

      {/* Orbiting dot 3 — more transparent */}
      <Animated.View style={makeDotStyle(rot3)} pointerEvents="none">
        <View style={[styles.dot, { width: dotSize * 0.6, height: dotSize * 0.6, borderRadius: dotSize * 0.3, backgroundColor: color, opacity: 0.45, marginLeft: -(dotSize * 0.3) }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:            1,
    justifyContent:  "center",
    alignItems:      "center",
    position:        "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    zIndex:          1000,
  },
  ring: {
    position:    "absolute",
    borderWidth: 1.5,
    opacity:     0.25,
  },
  centre: {
    justifyContent: "center",
    alignItems:     "center",
    shadowColor:    "#EE5F2B",
    shadowOffset:   { width: 0, height: 3 },
    shadowOpacity:  0.15,
    shadowRadius:   8,
    elevation:      4,
  },
  wordmark: {
    fontFamily:  "PlusJakartaSansBold",
    letterSpacing: 1,
  },
  dot: {
    position: "absolute",
    top:      0,
    left:     "50%",
  },
});

export default LogoLoader;
