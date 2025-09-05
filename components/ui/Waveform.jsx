import React from "react";
import { Dimensions } from "react-native";
import Svg, { Rect } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Calculate the number of bars and their properties
const barWidth = 3;
const gap = 2;
const maxHeight = 30;
const numBars = Math.floor(width / (barWidth + gap));

// Create the initial bars data
const initialBars = Array.from({ length: numBars }, (_, i) => ({
  id: i,
  height: Math.random() * 10 + 5,
  delay: Math.random() * 1000,
  x: i * (barWidth + gap),
}));

const AnimatedBar = ({ isRecording, bar, barWidth, maxHeight }) => {
  const animatedProps = useAnimatedProps(() => {
    if (!isRecording) {
      return { height: 5 };
    }

    return {
      height: withRepeat(
        withSequence(
          withDelay(bar.delay, withTiming(maxHeight * 0.8, { duration: 150 })),
          withTiming(maxHeight * 0.3, { duration: 150 }),
          withTiming(maxHeight * 0.6, { duration: 150 }),
          withTiming(maxHeight * 0.4, { duration: 150 })
        ),
        -1,
        true
      ),
    };
  });

  return (
    <AnimatedRect
      x={bar.x}
      y={30 - bar.height / 2}
      width={barWidth}
      animatedProps={animatedProps}
      fill="#007AFF"
      rx={1}
    />
  );
};

export default function Waveform({ isRecording }) {
  return (
    <Svg height="60" width={width} style={{ marginHorizontal: 10 }}>
      {initialBars.map((bar) => (
        <AnimatedBar
          key={bar.id}
          isRecording={isRecording}
          bar={bar}
          barWidth={barWidth}
          maxHeight={maxHeight}
        />
      ))}
    </Svg>
  );
}
