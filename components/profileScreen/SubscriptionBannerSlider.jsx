import React from "react";
import { View, Text, Dimensions, TouchableOpacity, Image } from "react-native";
import Swiper from "react-native-swiper";

const { width } = Dimensions.get("window");

const banners = [
  {
    title: "Upgrade to Premium",
    desc: "See who likes you instantly",
    cta: "Upgrade Now",
    color: "#FFD93D",
  },
  {
    title: "Unlimited Swipes",
    desc: "Never run out of chances",
    cta: "Go Unlimited",
    color: "#6BCB77",
  },
  {
    title: "Boost Profile",
    desc: "Get noticed faster",
    cta: "Boost Me",
    color: "#4D96FF",
  },
];

const SubscriptionBannerSlider = () => {
  return (
    <View>
      {/* Swiper with autoplay */}
      <Swiper
        autoplay
        loop
        showsPagination={false} // we'll handle pagination below
        height={180}
      >
        {banners.map((banner, idx) => (
          <View
            key={idx}
            className="rounded-xl p-6 justify-center items-center mx-4"
            style={{
              width: width - 30,
              backgroundColor: banner.color,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 5,
            }}
          >
            <Image
              source={require("../../assets/images/bondify-icon-white.png")}
              resizeMode="contain"
        style={{width: 30, height: 30}}
            />
            <Text className="text-xl font-bold text-white mb-1">
              {banner.title}
            </Text>
            <Text className="text-base text-white mb-3">{banner.desc}</Text>

            {/* CTA Button */}
            <TouchableOpacity className="bg-white px-4 py-2 rounded-full">
              <Text className="text-black font-semibold">{banner.cta}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Swiper>

      {/* Pagination dots outside the swiper */}
      <View className="flex-row justify-center mt-3">
        {banners.map((_, index) => (
          <View
            key={index}
            className="h-2 w-2 rounded-full mx-1"
            style={{
              backgroundColor: index === 0 ? "#333" : "#ccc", // active dot darker
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default SubscriptionBannerSlider;
