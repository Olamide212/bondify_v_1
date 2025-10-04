import { Image } from "react-native";
import React from "react";

const VerifiedIcon = ({ style }) => {
  return (
    <Image
      source={require("../../assets/icons/verified-icon.png")}
      style={[{ width: 23, height: 23, resizeMode: "contain" }, style]}
    />
  );
};

export default VerifiedIcon;
