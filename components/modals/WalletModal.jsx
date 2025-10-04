import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Coins, X } from "lucide-react-native";
import BaseModal from "./BaseModal";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const coinBundles = [
  { id: "starter", coins: 100, price: "₦750", bonus: 0 },
  { id: "mini", coins: 500, price: "₦3,500", bonus: 50 },
  { id: "value", coins: 1200, price: "₦7,000", bonus: 200 },
  { id: "super", coins: 3000, price: "₦15,000", bonus: 600 },
  { id: "mega", coins: 8000, price: "₦35,000", bonus: 2000 },
  { id: "king", coins: 20000, price: "₦80,000", bonus: 7000 },
];

const WalletModal = ({ visible, onClose }) => {
  const [balance, setBalance] = useState(250);

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <SafeAreaProvider>
      <SafeAreaView className='flex-1'>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
          <Text className="text-2xl font-SatoshiBold text-black">My Wallet</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View className="m-5 p-6 rounded-2xl bg-purple-600 items-center">
          <Coins size={32} color="white" />
          <Text className="text-white text-lg mt-2 font-Satoshi">
            Current Balance
          </Text>
          <Text className="text-white text-3xl font-SatoshiBold">
            {balance} Coins
          </Text>
        </View>

        {/* Buy Coins */}
        <Text className="px-5 mb-3 text-xl font-SatoshiBold text-black">
          Buy Coins
        </Text>

        <FlatList
          data={coinBundles}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: 20,
          }}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setBalance(balance + item.coins + item.bonus)}
              className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex-1 mx-1 shadow-sm"
            >
              <Text className="text-xl font-SatoshiBold text-purple-600">
                {item.coins} 💰
              </Text>
              <Text className="text-base text-black mt-1">{item.price}</Text>
              {item.bonus > 0 && (
                <Text className="text-sm text-green-600 font-Satoshi mt-1">
                  +{item.bonus} bonus
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
        </SafeAreaView>
        </SafeAreaProvider>
    </BaseModal>
  );
};

export default WalletModal;
