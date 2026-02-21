import React from "react";
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
      <ActivityIndicator color="#fff" />
    ) : (
      <Text
        className={`text-xl font-GeneralSansMedium text-white ${textClassName}`}
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
          colors={["#5A56D0", "#5A56D0"]}
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
      ? "text-white"
      : variant === "white"
        ? "text-black"
        : variant === "secondary"
          ? "text-primary"
          : variant === "neutral"
            ? "text-[#1E4234] "
            : "text-white";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      className={`w-full py-5 rounded-full items-center justify-center ${baseStyle} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#000" : "#fff"} />
      ) : (
        <Text
          className={`text-xl font-GeneralSansMedium ${textStyle} ${textClassName}`}
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
