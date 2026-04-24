import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { images } from "../../constant/images";

const HeaderWithLogo = ({ title, showBackButton = true, onBack }) => {
const router = useRouter()    

  return (
    <View className="flex-row items-center justify-between pt-3 px-5">
      {showBackButton ? (
        <Pressable onPress={() => onBack ? onBack() : router.back()}>
          <ArrowLeft color="#fff" />
        </Pressable>
      ) : (
        <View style={{ width: 24 }} />
      )}

      <Image
        source={images.bondiesMainicon}
        style={{ width: 60, height: 40 }}
        contentFit="contain"
      />
      <Text className="text-white font-PlusJakartaSansMedium">{title}</Text>
    </View>
  );
};

export default HeaderWithLogo;
