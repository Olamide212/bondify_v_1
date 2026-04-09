import { LinearGradient } from "expo-linear-gradient";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { colors } from "../../constant/colors";

const Button = ({
  title = "Button",
  onPress,
  loading = false,
  disabled = false,
  className = "",
  variant = "primary",
  textClassName = "",
}) => {
  const renderContent = () =>
    loading ? (
      <ActivityIndicator color={colors.primary} />
    ) : (
      <Text
        className={`text-xl font-OutfitMedium text-white ${textClassName}`}
      >
        {title}
      </Text>
    );

  if (variant === "gradient") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        style={[styles.buttonWrapper, disabled && { opacity: 0.5 }]}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // fallback for other variants
  const baseStyle =
    variant === "primary"
      ? "bg-primary"
      : variant === "white"
        ? "bg-white"
        : variant === "secondary"
          ? "bg-secondary"
          : variant === "danger"
            ? "bg-red-700"
            : variant === "neutral"
              ? "bg-white border border-[#E8E8E8] "
              : "bg-black";

  const textStyle =
    variant === "primary"
      ? "text-white font-OutfitSemiBold"
      : variant === "white"
        ? "text-black font-OutfitSemiBold"
        : variant === "secondary"
          ? "text-primary font-OutfitSemiBold"
          : variant === "neutral"
            ? "text-[#1E4234] font-OutfitSemiBold"
            : "text-white font-OutfitSemiBold";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      className={`w-full py-4 rounded-full items-center justify-center ${baseStyle} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
    >
      {loading ? (
        <View className="flex-row items-center gap-2">
 <ActivityIndicator color={"#fff"} />
        {/* <Text className='text-xl font-OutfitSemiBold text-white'>Loading...</Text> */}
        </View>
       
      ) : (
        <Text
          className={`text-xl font-OutfitSemiBold ${textStyle} ${textClassName}`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    width: "100%",
    borderRadius: 999,
  },
  gradientButton: {
    paddingVertical: 18,
    marginBottom:10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});

export default Button;
