import React from "react";
import { View, Dimensions } from "react-native";
import { Image } from "expo-image";
import Swiper from "react-native-swiper";

const { width } = Dimensions.get("window");

const ImageCarousel = ({ images }) => {
  return (
    <View className="h-80 w-full">
      <Swiper showsPagination autoplay>
        {images.map((img, index) => (
          <Image
            key={index}
            source={{ uri: img }}
            className="w-full h-80 rounded-xl"
            contentFit="cover"
            style={{ width }}
          />
        ))}
      </Swiper>
    </View>
  );
};

export default ImageCarousel;
