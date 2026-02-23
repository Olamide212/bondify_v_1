import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    Pressable,
    View,
} from "react-native";
import { colors } from "../../../constant/colors";

const { width } = Dimensions.get("window");

const ProfileImageModal = ({
  visible,
  onClose,
  totalImages,
  modalImageIndex,
  onChangeImageIndex,
  getImageUri,
  isImageCacheHydrated,
  isUriCached,
  onMarkUriLoaded,
}) => {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const modalFlatListRef = useRef(null);

  useEffect(() => {
    if (!visible || !modalFlatListRef.current) return;

    requestAnimationFrame(() => {
      modalFlatListRef.current?.scrollToIndex({
        index: modalImageIndex,
        animated: false,
      });
    });
  }, [modalImageIndex, visible]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View className="flex-1 bg-black">
        <Pressable
          className="absolute top-14 right-6 z-50 bg-black/50 rounded-full p-2"
          onPress={onClose}
        >
          <X color="white" size={24} />
        </Pressable>

        <View className="flex-1 justify-center">
          <FlatList
            ref={modalFlatListRef}
            data={Array.from({ length: totalImages }, (_, index) => index)}
            keyExtractor={(item) => String(item)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={modalImageIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item: index }) => {
              const uri = getImageUri(index);

              return (
                <View style={{ width, height: "100%" }}>
                  <Image
                    source={{ uri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    onLoadStart={() => {
                      if (isImageCacheHydrated && !isUriCached(uri)) {
                        setIsImageLoading(true);
                      }
                    }}
                    onLoad={async () => {
                      await onMarkUriLoaded(uri);
                      setIsImageLoading(false);
                    }}
                    onError={() => setIsImageLoading(false)}
                  />
                </View>
              );
            }}
            onMomentumScrollEnd={(event) => {
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              onChangeImageIndex(nextIndex);
            }}
          />

          {isImageLoading && (
            <View className="absolute inset-0 items-center justify-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>

        <View className="absolute bottom-10 left-0 right-0 flex-row justify-center">
          {Array.from({ length: totalImages }).map((_, index) => (
            <View
              key={index}
              className={`h-2 w-2 rounded-full mx-1 ${
                index === modalImageIndex ? "bg-white" : "bg-gray-400"
              }`}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
};

export default ProfileImageModal;
