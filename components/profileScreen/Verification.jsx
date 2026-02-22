import { ShieldCheck } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import TextHeadingOne from "../ui/TextHeadingOne";

const Verification = ({ profile }) => {
    return (
      <TouchableOpacity className="px-6 py-4 bg-gray-50 border border-gray-100 mx-4 rounded-2xl">
              <TextHeadingOne name="Verification" icon={ShieldCheck} />
        <View className=" mb-1">

          <Text className="text-black text-2xl font-SatoshiMedium">
            Become a verified user{" "}
          </Text>
          <Text className="flex-1 font-Satoshi text-lg">
            Verify your identity with a quick selfie and get your badge
          </Text>
        </View>
      </TouchableOpacity>
    );
};

export default Verification;
