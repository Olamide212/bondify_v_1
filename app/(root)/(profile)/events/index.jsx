import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { CalendarX, ArrowLeft } from "lucide-react-native";
import GeneralHeader from "../../../../components/headers/GeneralHeader"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


const Events = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1 bg-[#121212]'>
        <GeneralHeader title="Events"
          leftIcon={<ArrowLeft />}
          className="bg-[#121212]" />
        <View style={{flex: 1}} className="bg-[#121212] items-center justify-center p-6">

          {/* Icon */}
          <CalendarX size={64} color="#9ca3af" strokeWidth={1.5} />

          {/* Title */}
          <Text className="text-2xl font-OutfitBold text-white mt-6">
            No Events Yet
          </Text>

          {/* Description */}
          <Text className="text-center text-gray-400 font-Outfit text-lg mt-2 px-4">
            Stay tuned! Bondify events and communities will appear here soon.
            Connect, share, and meet amazing people once we go live.
          </Text>

          {/* Placeholder action */}
          <TouchableOpacity className="mt-6 bg-black px-6 py-3 rounded-full">
            <Text className="text-white font-OutfitMedium text-lg">
              Explore Bondies
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Events;
