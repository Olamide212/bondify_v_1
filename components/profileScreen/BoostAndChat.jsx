import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Rocket, MessageCircle, Star } from "lucide-react-native";


const Perks = () => {
  const perks = [
    {
      id: 1,
      title: "Spark",
      sparkQTY: "5",
      description: "Stand out and get more profile views.",
          icon: <Rocket size={20} color="#ff3b6a" fill="#ff3b6a" />,
      bgColor: "#fff",
    },
    {
      id: 2,
      title: "Bondo",
      sparkQTY: "5",
      description: "Super like to start instant conversation",
      icon: <Star size={20} color="#3b82f6" fill="#3b82f6" />,
      bgColor: "#fff",
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
              alignItems: "center",
        gap: 10,
        marginVertical: 15,
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
          <View className="flex-row items-center gap-2">
            {perk.icon}
            <Text className="font-SatoshiMedium text-lg"> {perk.sparkQTY}</Text>
            <Text className="font-SatoshiMedium text-lg">{perk.title}</Text>
          </View>

          <Text className="text-[#555] font-Satoshi text-base">{perk.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default Perks;
