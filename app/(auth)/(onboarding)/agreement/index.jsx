import { View, Text } from "react-native";
import React from "react";
import Button from "../../../../components/ui/Button";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import {guidelines} from "../../../../data/guidelinesData"


const Agreement = () => {
  const { nextStep } = useProfileSetup({ isOnboarding: true });

  return (
    <View className="bg-white flex-1 px-4 pt-8">
      <Text className="text-3xl font-SatoshiBold">Welcome to Bondies!</Text>

      <Text className="mt-3 font-Satoshi text-lg text-gray-700">
        To ensure the best experience, please follow our community guidelines:
      </Text>

      <View className="mt-6 gap-5 flex-1">
        {guidelines.map((item, index) => (
          <View key={index} className="flex-row items-start gap-3">
            <View className="mt-1">{item.icon}</View>
            <View>
              <Text className="text-xl font-SatoshiBold">{item.title}</Text>
              <Text className="text-lg font-Satoshi text-app pr-6">
                {item.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Button variant="gradient" title="Agree & Continue" onPress={nextStep} />
    </View>
  );
};

export default Agreement;
