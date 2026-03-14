import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, Image } from "react-native";
import { images } from "../../constant/images";

const LogoLoader = ({
  size = 140,
  color = "#EE5F2B",
  logo,
}) => {

  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  const rotate = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.5)).current;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {

    const createRing = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    createRing(ring1, 0).start();
    createRing(ring2, 700).start();
    createRing(ring3, 1400).start();

    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.9,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const pulseDot = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );

    pulseDot(dot1, 400).start();
    pulseDot(dot2, 1200).start();
    pulseDot(dot3, 2000).start();

  }, []);

  const ringStyle = (anim) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 2.4],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: [0.6, 0.2, 0],
    }),
  });

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>

      {/* Radar Rings */}
      {[ring1, ring2, ring3].map((ring, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            {
              borderColor: color,
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            ringStyle(ring),
          ]}
        />
      ))}

      {/* Radar Sweep Beam */}
      <Animated.View
        style={[
          styles.sweep,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            borderColor: color,
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      />

      {/* Nearby Users (detected dots) */}
      <Animated.View
        style={[
          styles.userDot,
          {
            backgroundColor: color,
            top: -size * 0.55,
            opacity: dot1,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.userDot,
          {
            backgroundColor: color,
            right: -size * 0.5,
            opacity: dot2,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.userDot,
          {
            backgroundColor: color,
            bottom: -size * 0.6,
            opacity: dot3,
          },
        ]}
      />

      {/* Glow under logo */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: size,
            backgroundColor: color,
            opacity: glow,
          },
        ]}
      />

      {/* Logo */}
      <Image
        source={images.bondifyIcon}
        style={{
          width: size * 0.55,
          height: size * 0.55,
          resizeMode: "contain",
        }}
      />

    </View>
  );
};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

  },

  ring: {
    position: "absolute",
    borderWidth: 2,
  },

  sweep: {
    position: "absolute",
    borderLeftWidth: 2,
    borderTopWidth: 2,
    opacity: 0.18,
  },

  glow: {
    position: "absolute",
    opacity: 0.15,
  },

  userDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 10,
  },

});

export default LogoLoader;