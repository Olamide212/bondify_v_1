import { Text, TouchableOpacity, View } from "react-native";

const Location = ({ profile }) => {
    const locationText =
      typeof profile?.location === "string"
        ? profile.location
        : [profile?.location?.city, profile?.location?.state, profile?.location?.country]
            .filter(Boolean)
            .join(", ");

    return (
      <TouchableOpacity className="px-6 py-4 bg-white mx-4 rounded-2xl mt-4">
        <Text className="mb-2 font-SatoshiMedium text-lg text-gray-500 ">
          Location
        </Text>
        <View className=" mb-1">
          <Text className="text-black text-2xl font-SatoshiMedium">
            {locationText || "Location not set"}
          </Text>
            <Text className="flex-1  text-lg text-primary font-SatoshiMedium">
                            
                    Change your location
                  </Text>
        </View>
      </TouchableOpacity>
    );
};

export default Location;
