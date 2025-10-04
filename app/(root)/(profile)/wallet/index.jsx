import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import { ArrowLeft, Coins } from "lucide-react-native";
import BaseModal from "../../../../components/modals/BaseModal";

const coinBundles = [
  { id: "starter", coins: 100, price: "₦750", bonus: 0 },
  { id: "mini", coins: 500, price: "₦3,500", bonus: 50 },
  { id: "value", coins: 1200, price: "₦7,000", bonus: 200 },
  { id: "super", coins: 3000, price: "₦15,000", bonus: 600 },
  { id: "mega", coins: 8000, price: "₦35,000", bonus: 2000 },
  { id: "king", coins: 20000, price: "₦80,000", bonus: 7000 },
];

const WalletScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(250); // example balance
  const [selectedBundle, setSelectedBundle] = useState(null);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-SatoshiBold">
          My Wallet
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Balance Card */}
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
      <Text className="px-5 mb-3 text-lg font-SatoshiBold text-black">
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
            onPress={() => setSelectedBundle(item)}
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

      {/* Confirm Purchase Modal */}
      <BaseModal
        visible={!!selectedBundle}
        onClose={() => setSelectedBundle(null)}
      >
        {selectedBundle && (
          <View className="p-5">
            <Text className="text-xl font-SatoshiBold mb-2">
              Confirm Purchase
            </Text>
            <Text className="text-base text-black mb-4">
              Buy {selectedBundle.coins} coins for {selectedBundle.price}?
            </Text>

            <TouchableOpacity
              onPress={() => {
                setBalance(
                  balance + selectedBundle.coins + selectedBundle.bonus
                );
                setSelectedBundle(null);
              }}
              className="bg-purple-600 py-3 rounded-xl"
            >
              <Text className="text-white text-center font-SatoshiBold text-lg">
                Purchase
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedBundle(null)}
              className="py-3 mt-3"
            >
              <Text className="text-center text-gray-600 font-Satoshi">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </BaseModal>
    </SafeAreaView>
  );
};

export default WalletScreen;
