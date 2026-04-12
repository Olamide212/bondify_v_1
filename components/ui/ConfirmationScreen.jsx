import React from "react";
import {

  Text,
  View,

} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";

const ConfirmationScreen = ({title, subtitle}) => {


  return (
    <View style={{flex: 1}} className="px-4">
      <View style={{flex: 1}} className="justify-center  mt-32">
        <Image
          source={require("../../assets/images/bondify-icon-color.png")}
          contentFit="contain"
          style={{ width: 100, height: 80, marginBottom: 10 }}
        />
        <Text className="text-[50px] font-PlusJakartaSansBold  mb-2 leading-[55px] ">
          {title}
        </Text>
        <Text className="mb-7  font-PlusJakartaSansMedium">{subtitle}</Text>
      </View>
    </View>
  );
};

export default ConfirmationScreen;
