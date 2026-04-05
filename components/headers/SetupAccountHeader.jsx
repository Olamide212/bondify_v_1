import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

const AccountSetupHeader = ({ title, rightText, showBack = true, onSkip }) => {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between pt-3 ">
      {showBack ? (
        <Pressable onPress={() => router.back()}>
          <ArrowLeft color="#fff" />
        </Pressable>
      ) : (
        // keeps title centered when back button is hidden
        <View style={{ width: 24 }} />
      )}

      <Text className="text-white font-OutfitBold text-[20px]">{title}</Text>

      {onSkip ? (
        <Pressable onPress={onSkip} hitSlop={8}>
          <Text className="text-white font-OutfitMedium text-[15px]">Skip</Text>
        </Pressable>
      ) : rightText ? (
        <Text className="text-white font-OutfitMedium">{rightText}</Text>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
};

export default AccountSetupHeader;
