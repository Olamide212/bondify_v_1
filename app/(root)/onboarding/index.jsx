import { View, Text, TouchableOpacity, Pressable } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Button from "../../../components/ui/Button";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const Onboarding = () => {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#FD465C", "#4B164C"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-between pb-4">
          {/* Logo at top */}
          <View className="justify-center items-center pt-4">
            <Image
              source={require("../../../assets/images/bondies-logo.png")}
              style={{ width: 120, height: 40 }}
              resizeMode="contain"
            />
          </View>

          {/* Main Image */}
          <View className="-mt-48">
            <Image
              source={require("../../../assets/images/l-image.png")}
              style={{ width: "100%", height: 450 }}
              contentFit="cover"
            />
          </View>

          {/* Text + Buttons */}
          <View className="items-center -mt-56 px-3">
            <Text className="text-white font-GeneralSansBold text-3xl text-center mb-4">
              Discover Love where your story begins.
            </Text>

            {/* Buttons */}
            <View className="w-full">
              <Button
                title="Continue with Phone Number"
                onPress={() => router.push("/login")}
                className="mb-3"
                textClassName="font-santoshiMedium"
                variant="white"
              />
              <Button
                title="Create an Account"
                onPress={() => router.push("/register")}
                className="mb-3 bg-transparent border-[1.5px] border-white"
                textClassName="font-santoshiMedium"
                variant="black"
              />
              <Text className="text-white font-GeneralSansMedium text-lg text-center mb-4 px-4">
                By joining our platform, you agree to our Terms and Condtion
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Onboarding;
