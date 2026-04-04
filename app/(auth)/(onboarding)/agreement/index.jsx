import { Text, View } from "react-native";

import { useRouter } from "expo-router";
import Button from "../../../../components/ui/Button";
import { guidelines } from "../../../../data/guidelinesData";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";


const Agreement = () => {
  const { nextStep } = useProfileSetup({ isOnboarding: true });
  const router = useRouter()

  return (
    <View className="bg-[#121212] flex-1 px-4 pt-8">
      <Text className="text-3xl font-OutfitBold">Welcome to Bondies!</Text>

      <Text className="mt-3 font-Outfit text-lg text-gray-300">
        To ensure the best experience, please follow our community guidelines:
      </Text>

      <View className="mt-6 gap-5 flex-1">
        {guidelines.map((item, index) => (
          <View key={index} className="flex-row items-start gap-3">
            <View className="mt-1">{item.icon}</View>
            <View>
              <Text className="text-xl font-OutfitBold">{item.title}</Text>
              <Text className="text-lg font-Outfit text-app pr-6">
                {item.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Button variant="primary" title="Agree & Continue" onPress={() => router.push("/age")} />

      
    </View>
  );
};

export default Agreement;
