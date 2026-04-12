import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import {
    TextInput as RNTextInput,
    Text,
    TouchableOpacity,
    View
} from "react-native";

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
        <Text className="text-lg text-white font-PlusJakartaSansMedium mb-2">{label}</Text>
      )}
      <View
        className={`flex-row items-center  px-4 border bg-[#121212] ${error ? 'border-red-500' : 'border-whiteLight'} ${className} `}
        style={{ height: 55, borderRadius: 10,  marginBottom: 10 }}
      >
        <RNTextInput
          style={{flex: 1, fontSize: 16}} className="text-white   bg-[#121212] font-PlusJakartaSansMedium text-[18px] "
          placeholder={placeholder}
          placeholderTextColor="#929292"
          autoCapitalize="none"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          maxLength={phone ? 11 : maxLength}
          {...rest}
          textBreakStrategy="simple"
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
