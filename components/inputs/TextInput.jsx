import React, { useState } from "react";
import {
  View,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";

const TextInput = ({
  label,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  error,
  keyboardType = "default",
  phone,
  maxLength,
  className,
  ...rest
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePassword = () => setIsPasswordVisible(!isPasswordVisible);

  return (
    <View className="mb-2 w-full">
      {label && (
        <Text className="text-lg  font-SatoshiMedium mb-2">{label}</Text>
      )}
      <View
        className={`flex-row items-center  px-4 border bg-white border-[#dcdcdc] ${className} `}
        style={{ height: 50, borderRadius: 10, marginBottom: 10 }}
      >
        <RNTextInput
          className="flex-1 text-app   bg-white font-GeneralSansMedium "
          placeholder={placeholder}
          placeholderTextColor="#929292"
          autoCapitalize="none"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          maxLength={phone ? 11 : maxLength}
          {...rest}
          style={{fontSize: 16}}
        />

        {/* Show toggle icon for password */}
        {secureTextEntry && (
          <TouchableOpacity onPress={togglePassword}>
            <Feather
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={22}
              color="#555"
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
};

export default TextInput;
