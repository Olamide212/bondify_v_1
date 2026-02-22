import { User } from "lucide-react-native";
import { Text, View } from "react-native";
import { getProfileAge } from "../../utils/ageHelper";
import TextHeadingOne from "../ui/TextHeadingOne";

const BasicInfo = ({ profile }) => {
  const fullName =
    profile?.name || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Your name";

  const computedAge = getProfileAge(profile);

  return (
    <View className="px-6 py-4 bg-gray-50 border border-gray-100 mx-4 rounded-2xl ">
      <TextHeadingOne name="Basic Info" icon={User} />
      <View className="flex-row items-center mb-1">
        <Text className="text-black text-3xl font-SatoshiBold capitalize" numberOfLines={1}>{fullName}</Text>
      </View>
      <View className="flex-row items-center mb-1">
        <Text className='capitalize text-lg'>
          {profile?.gender || ""}
          {profile?.gender && computedAge ? ", " : ""}
          {computedAge ? `${computedAge} years old` : ""}
        </Text>
      </View>
    </View>
  );
};

export default BasicInfo;
