import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Vibration,
  Animated,
  TouchableOpacity,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import {colors} from "../../constant/colors"

const GlobalOtpInput = ({
  touched,
  errors,
  onTextChange,
  onFocus,
  onResend,
}) => {
  const [animation] = useState(new Animated.Value(1));
  const [timer, setTimer] = useState(60);

  const bounce = () => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleChange = (text) => {
    Vibration.vibrate(10);
    bounce();
    onTextChange(text);
  };

  const handleResend = () => {
    setTimer(60);
    if (onResend) onResend(); // 🔥 trigger API call from parent
  };

  useEffect(() => {
    if (timer === 0) return;
    const countdown = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(countdown);
  }, [timer]);

  return (
    <View className="mb-3">
      <Animated.View style={{ transform: [{ scale: animation }] }}>
        <OtpInput
          numberOfDigits={6}
          focusColor={colors.primary}
          focusStickBlinkingDuration={500}
          onTextChange={handleChange}
          onFocus={onFocus}
          theme={{
            pinCodeContainerStyle: styles.pincodeContainer,
            containerStyle: {
              paddingHorizontal: 8,
              height: 60,
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
              borderColor: errors && touched ? "#F04438" : "#D0D5DD",
            },
            filledPinCodeContainerStyle: {
              borderColor: "#1D2939",
            },
            pinCodeTextStyle: styles.pinCodeText,
            textProps: {
              accessibilityRole: "text",
              accessibilityLabel: "OTP digit",
              allowFontScaling: false,
            },
            secureTextEntry: true,
          }}
        />
      </Animated.View>

      {errors && touched && (
        <Text className="text-red-500 ml-2 mt-2 text-sm">{errors}</Text>
      )}

      <View className="flex-row justify-center mt-4">
        {timer > 0 ? (
          <Text className="text-app font-SatoshiMedium text-sm">
            {timer} sec remaining
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text className="text-primary font-medium text-sm">
              Couldn't get OTP? <Text className="underline">Resend</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};


export default GlobalOtpInput;

const styles = StyleSheet.create({
  pincodeContainer: {
    width: 50,
    height: 50,
    borderColor: colors.gray,
    borderWidth: 1,
    marginHorizontal: 6,
  },
  pinCodeText: {
    fontSize: 24,
    color: "#000",
    fontFamily: "Satoshi",
  },
});
