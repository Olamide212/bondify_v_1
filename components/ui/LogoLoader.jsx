import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

/**
 * LogoLoader — Bondify branded loading indicator.
 *
 * Two heart-shaped circles pulse and merge toward a glowing centre,
 * symbolising two people connecting. A tagline fades in beneath.
 */
const LogoLoader = ({ size = 100, color = "#EE5F2B" }) => {
  const leftScale   = useRef(new Animated.Value(1)).current;
  const rightScale  = useRef(new Animated.Value(1)).current;
  const leftX       = useRef(new Animated.Value(0)).current;
  const rightX      = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (left, right) => {
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(left,  { toValue: -size * 0.10, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(right, { toValue:  size * 0.10, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(left,  { toValue: 0, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(right, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
        ])
      );
    };

    const scalePulse = (val, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1.12, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 1,    duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.9, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const textFadeIn = Animated.timing(textOpacity, {
      toValue: 1, duration: 600, delay: 200, easing: Easing.out(Easing.ease), useNativeDriver: true,
    });

    // Typing dots
    const dotSeq = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity1, { toValue: 1,   duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity2, { toValue: 1,   duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity3, { toValue: 1,   duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ])
    );

    pulse(leftX, rightX).start();
    scalePulse(leftScale, 0).start();
    scalePulse(rightScale, 300).start();
    glow.start();
    textFadeIn.start();
    dotSeq.start();
  }, [leftX, rightX, leftScale, rightScale, glowOpacity, textOpacity, dotOpacity1, dotOpacity2, dotOpacity3]);

  const circleSize  = size * 0.44;
  const overlapGap  = size * 0.18;

  return (
    <View style={styles.container}>
      {/* Glow backdrop */}
      <Animated.View
        style={[
          styles.glow,
          {
            width:        size * 1.6,
            height:       size * 1.6,
            borderRadius: size * 0.8,
            backgroundColor: color,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Two circles merging */}
      <View style={[styles.circlesRow, { gap: -(overlapGap) }]}>
        <Animated.View
          style={[
            styles.circle,
            {
              width:        circleSize,
              height:       circleSize,
              borderRadius: circleSize / 2,
              borderColor:  color,
              transform:    [{ scale: leftScale }, { translateX: leftX }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.circle,
            {
              width:        circleSize,
              height:       circleSize,
              borderRadius: circleSize / 2,
              borderColor:  color,
              transform:    [{ scale: rightScale }, { translateX: rightX }],
            },
          ]}
        />
      </View>

      {/* Wordmark */}
      <Animated.Text
        style={[
          styles.wordmark,
          { color, fontSize: size * 0.19, opacity: textOpacity },
        ]}
      >
        bondies
      </Animated.Text>

      {/* Typing dots */}
      <View style={styles.dotsRow}>
        {[dotOpacity1, dotOpacity2, dotOpacity3].map((op, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { width: size * 0.07, height: size * 0.07, borderRadius: size * 0.035, backgroundColor: color, opacity: op },
            ]}
          />
        ))}
      </View>
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
    backgroundColor: "rgba(255, 255, 255, 0.93)",
    zIndex:          1000,
  },
  glow: {
    position:  "absolute",
    opacity:   0.06,
  },
  circlesRow: {
    flexDirection: "row",
    alignItems:    "center",
    marginBottom:  12,
  },
  circle: {
    borderWidth: 2.5,
    backgroundColor: "rgba(238, 95, 43, 0.08)",
  },
  wordmark: {
    fontFamily:    "PlusJakartaSansBold",
    letterSpacing: 2,
    marginBottom:  10,
  },
  dotsRow: {
    flexDirection: "row",
    gap:           6,
  },
  dot: {},
});

export default LogoLoader;

