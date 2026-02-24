import { ShieldCheck } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import TextHeadingOne from "../ui/TextHeadingOne";

const Verification = ({ profile }) => {
    return (
      <TouchableOpacity className="px-6 py-4 bg-white  mx-4 rounded-2xl">
         
        <View className=" mb-1">

          <Text className="text-black text-2xl font-PlusJakartaSansMedium">
           Get verified
          </Text>
          <Text className="flex-1 font-PlusJakartaSans text-lg">
            Verify your identity with a quick selfie and get your badge to build trust with others
          </Text>
        </View>
      </TouchableOpacity>
    );
};

export default Verification;
