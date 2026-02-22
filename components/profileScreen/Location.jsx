import { MapPin } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import TextHeadingOne from "../ui/TextHeadingOne";

const Location = ({ profile }) => {
    const locationText =
      typeof profile?.location === "string"
        ? profile.location
        : [profile?.location?.city, profile?.location?.state, profile?.location?.country]
            .filter(Boolean)
            .join(", ");

    return (
      <TouchableOpacity className="px-6 py-4 bg-gray-50 border border-gray-100 mx-4 rounded-2xl">
        <TextHeadingOne name="Location" icon={MapPin} />
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
