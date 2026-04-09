// components/ui/ProgressBar.jsx
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const ProgressBar = ({ progress }) => {
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 350 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View className="h-1 w-full bg-white rounded-full mt-4 overflow-hidden ">
      <Animated.View
        className="h-full bg-primary rounded-full"
        style={barStyle}
      />
    </View>
  );
};
