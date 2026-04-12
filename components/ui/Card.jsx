import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";
import { Icons } from "../../constant/icons";

const Card = ({ title, items }) => {
  return (
    <View className="bg-[#121212] mt-4 p-6 border border-whiteLight rounded-xl">
      {title && (
        <Text className="text-white text-xl font-PlusJakartaSansSemiBold mb-3">
          {title}
        </Text>
      )}

      {items.map(({ title, description, onPress, icon: RightIcon }, index) => {
        const isLast = index === items.length - 1;
        const isTiktok = description?.toLowerCase() === "tiktok";

        return (
          <TouchableOpacity
            key={index}
            className={`flex-row items-center justify-between py-4 gap-4 ${
              !isLast ? "border-b border-whiteLight" : ""
            }`}
            onPress={onPress}
          >

              {RightIcon ? (
                <RightIcon size={20} color={'#fff'} />
              ) : isTiktok ? (
                <Image source={Icons.TikTok} style={{ width: 20, height: 20 }} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              )}
            <View className="flex-row items-center gap-3 flex-1">
              <View style={{flex: 1}}>
                <Text className="text-xl text-white font-PlusJakartaSansSemiBold">
                  {title}
                </Text>
                {description && (
                  <Text className="text-lg  text-white font-PlusJakartaSans mt-0.5">
                    {description}
                  </Text>
                )}
              </View>

            
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Card;
