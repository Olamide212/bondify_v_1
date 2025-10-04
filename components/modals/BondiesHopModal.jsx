import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { MapPin, Globe, ArrowRight } from "lucide-react-native";
import BaseModal from "../modals/BaseModal";
import { useWallet } from "../../context/WalletContext";
import WalletModal from "../modals/WalletModal"; // Import your wallet screen modal

const popularDestinations = [
  { id: "1", name: "New York, USA" },
  { id: "2", name: "London, UK" },
  { id: "3", name: "Lagos, Nigeria" },
  { id: "4", name: "Paris, France" },
  { id: "5", name: "Tokyo, Japan" },
];

const BondiesHopModal = ({ visible, onClose }) => {
  const { coins, plan, deductCoins } = useWallet();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showWallet, setShowWallet] = useState(false); // 👈 control Wallet modal

  const filtered = popularDestinations.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleHop = () => {
    if (!selected) return;

    if (plan === "Gold" || plan === "Diamond") {
      Alert.alert(
        "Success",
        `You hopped to ${selected.name} (Premium access 🎉)`
      );
      onClose();
      return;
    }

    const cost = 50;
    const success = deductCoins(cost);

    if (success) {
      Alert.alert("Success", `You hopped to ${selected.name}! -${cost} coins`);
      onClose();
    } else {
      // 👇 Instead of alert, open Buy Coins modal
      setShowWallet(true);
    }
  };

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View className="flex-1 p-5">
        {/* Header */}
        <Text className="text-2xl font-GeneralSansBold mb-2">
          🌍 Bondies Hop
        </Text>
        <Text className="text-base text-gray-600 mb-5">
          Travel anywhere digitally and meet people worldwide.
        </Text>

        {/* Wallet Status */}
        <View className="flex-row items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
          <Text className="text-gray-800">Your Balance: {coins} coins</Text>
          <Text className="text-primary">{plan} Plan</Text>
        </View>

        {/* Current Location */}
        <View className="flex-row items-center bg-gray-100 p-3 rounded-lg mb-4">
          <MapPin size={18} className="text-primary mr-2" />
          <Text className="flex-1 text-gray-800">
            Your Location: Lagos, Nigeria
          </Text>
        </View>

        {/* Search */}
        <TextInput
          placeholder="Search for a country or city..."
          value={search}
          onChangeText={setSearch}
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        />

        {/* Popular Destinations */}
        <Text className="text-lg font-GeneralSansMedium mb-3">
          Popular Destinations
        </Text>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`flex-row items-center justify-between p-3 mb-2 rounded-lg border ${
                selected?.id === item.id
                  ? "border-primary bg-primary/10"
                  : "border-gray-200"
              }`}
              onPress={() => setSelected(item)}
            >
              <Text className="text-gray-800">{item.name}</Text>
              {selected?.id === item.id && (
                <Globe size={18} className="text-primary" />
              )}
            </TouchableOpacity>
          )}
        />

        {/* CTA */}
        <TouchableOpacity
          disabled={!selected}
          onPress={handleHop}
          className={`mt-5 flex-row items-center justify-center py-3 rounded-lg ${
            selected ? "bg-primary" : "bg-gray-300"
          }`}
        >
          <Text className="text-white text-lg font-GeneralSansMedium mr-2">
            {plan === "Gold" || plan === "Diamond"
              ? selected
                ? `Hop to ${selected.name} (Free)`
                : "Select a destination"
              : selected
                ? `Hop to ${selected.name} (-50 coins)`
                : "Select a destination"}
          </Text>
          <ArrowRight size={18} className="text-white" />
        </TouchableOpacity>
      </View>

      {/* Wallet Modal */}
      <WalletModal visible={showWallet} onClose={() => setShowWallet(false)} />
    </BaseModal>
  );
};

export default BondiesHopModal;
