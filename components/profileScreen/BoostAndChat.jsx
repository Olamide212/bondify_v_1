import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Rocket, Sparkles } from "lucide-react-native";
import { colors } from "../../constant/colors";

const Perks = () => {
  const perks = [
    {
      id: 1,
      title: "Spark",
      sparkQTY: "5",
      description: "Stand out and get more profile views.",
      icon: <Rocket size={20} color="#ff3b6a" fill="#ff3b6a" />,
      bgColor: "#f1f1f1",
      btnColor: "#ff3b6a",
    },
    {
      id: 2,
      title: "Bondo",
      sparkQTY: "5",
      description: "Bondies AI conversation starter",
      icon: <Sparkles size={20} color="#000" fill="#000" />,
      bgColor: colors.secondary,
      btnColor: "#000",
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        marginVertical: 30,
        marginHorizontal: 20,
      }}
    >
      {perks.map((perk) => (
        <TouchableOpacity
          key={perk.id}
          style={{
            backgroundColor: perk.bgColor,
            padding: 15,
            borderRadius: 16,
            width: "50%",
          }}
        >
          {/* Header row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {perk.icon}
            <Text style={{ fontFamily: "Satoshi-Bold", fontSize: 18 }}>
              {perk.sparkQTY}
            </Text>
            <Text style={{ fontFamily: "Satoshi-Bold", fontSize: 18 }}>
              {perk.title}
            </Text>
          </View>

          {/* Description */}
          <Text
            style={{
              color: "#555",
              fontFamily: "Satoshi-Regular",
              fontSize: 14,
              marginTop: 8,
            }}
          >
            {perk.description}
          </Text>

          {/* Button */}
          <TouchableOpacity
            style={{
              marginTop: 16,
              backgroundColor: perk.btnColor,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "Satoshi-Medium",
              }}
            >
              Go unlimited
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default Perks;
