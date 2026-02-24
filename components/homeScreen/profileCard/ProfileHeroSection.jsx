import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { Briefcase, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { colors } from "../../../constant/colors";
import VerifiedIcon from "../../ui/VerifiedIcon";

const ProfileHeroSection = ({
  profile,
  currentImageIndex,
  getImageUri,
  openImageModal,
  handleImageLayout,
  isImageCacheHydrated,
  isUriCached,
  onMarkUriLoaded,
}) => {
  const [mainImageLoading, setMainImageLoading] = useState(false);
  const locationLabel = [profile?.distance, profile?.location]
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    const uri = getImageUri(currentImageIndex);
    setMainImageLoading(Boolean(uri) && isImageCacheHydrated && !isUriCached(uri));
  }, [currentImageIndex, getImageUri, isImageCacheHydrated, isUriCached]);

  return (
    <Pressable onPress={() => openImageModal(currentImageIndex)}>
      <View
        onLayout={(event) => handleImageLayout(0, event)}
        className=" shadow-lg overflow-hidden bg-white"
        style={{
          width: "100%",
          height: 820,
        }}
      >
        <TouchableWithoutFeedback onPress={() => openImageModal(currentImageIndex)}>
          <View className="relative  w-full">
            <Image
              source={{ uri: getImageUri(currentImageIndex) }}
              className="w-full h-full"
              contentFit="cover"
              cachePolicy="memory-disk"
              style={{
                width: "100%",
                height: 950,
              }}
              onLoadStart={() => {
                const uri = getImageUri(currentImageIndex);
                if (isImageCacheHydrated && !isUriCached(uri)) {
                  setMainImageLoading(true);
                }
              }}
              onLoad={async () => {
                await onMarkUriLoaded(getImageUri(currentImageIndex));
                setMainImageLoading(false);
              }}
              onError={() => setMainImageLoading(false)}
            />

            {mainImageLoading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}

            <View className="absolute bottom-64 left-6 right-6">
              <View className="flex-row items-center mb-6">
                <Text className="text-white text-4xl font-PlusJakartaSansBold mr-2 capitalize" numberOfLines={1}>
                  {profile.name}
                </Text>

                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-4xl font-PlusJakartaSans">{profile.age}</Text>
                  {profile.verified && <VerifiedIcon />}
                </View>
              </View>

              <View className="flex-row items-center flex-wrap gap-x-4 gap-y-4">
                {profile.occupation && (
                  <View className="flex-row items-center bg-secondary px-4 py-2 rounded-full">
                    <Briefcase size={18} color={"#000"} />
                    <Text className="text-black font-PlusJakartaSansMedium ml-2 capitalize">
                      {profile.occupation}
                    </Text>
                  </View>
                )}
                {profile.religion && (
                  <View className="flex-row items-center bg-secondary px-4 py-2 rounded-full">
                    <MaterialCommunityIcons
                      name="hands-pray"
                      size={20}
                      color={"#000"}
                    />
                    <Text className="text-black font-PlusJakartaSansMedium ml-2 capitalize">
                      {profile.religion}
                    </Text>
                  </View>
                )}

                {locationLabel && (
                  <View className="flex-row items-center bg-secondary px-4 py-2 rounded-full">
                    <MapPin size={18} color={"#000"} />
                    <Text className="text-black font-PlusJakartaSansMedium ml-2">
                      {locationLabel}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Pressable>
  );
};

export default ProfileHeroSection;
