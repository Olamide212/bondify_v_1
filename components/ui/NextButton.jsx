import Entypo from "@expo/vector-icons/Entypo";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";

const NextButton = ({
  title = "", 
  onPress,
  loading = false,
  disabled = false,
  className = "",
  variant = "primary",
  textClassName = "",
  icon = <Entypo name="chevron-small-right" size={30} color="white" />, // Default icon
}) => {
    const renderContent = () =>
      loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View className="flex-row">
          <Text
            className={`text-xl font-OutfitBold text-white ${textClassName}`}
          >
            {title}
          </Text>
          {icon}
        </View>
      );
        
      
  
  const baseStyle =
    variant === "primary"
      ? "bg-primary"
      : variant === "white"
        ? "bg-[#121212]"
        : variant === "secondary"
          ? "bg-secondary"
          : variant === "danger"
            ? "bg-red-700"
            : variant === "neutral"
              ? "bg-[#121212] border border-[#E8E8E8] "
              : "bg-black";

  const textStyle =
    variant === "primary"
      ? "text-white"
      : variant === "white"
        ? "text-white"
        : variant === "secondary"
          ? "text-primary"
          : variant === "neutral"
            ? "text-[#1E4234]"
            : "text-white";
  
  
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
  

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      className={`flex-row gap-2 items-center justify-center py-3 px-4 rounded-md ${baseStyle} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View className="flex-row items-center justify-center">
          {title !== "" && (
            <Text
              className={`text-lg font-OutfitMedium ml-2 ${textStyle} ${textClassName}`}
            >
              {title}
            </Text>
          )}
          {icon}
        </View>
      )}
    </TouchableOpacity>
  );
};






const styles = StyleSheet.create({
  buttonWrapper: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    borderRadius: 10,
  },
  gradientButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom:10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "auto",
  },
});

export default NextButton;
