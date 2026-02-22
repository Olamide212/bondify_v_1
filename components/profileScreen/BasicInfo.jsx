import { Text, View } from "react-native";
import { getProfileAge } from "../../utils/ageHelper";

const BasicInfo = ({ profile }) => {
  const fullName =
    profile?.name || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Your name";

  const computedAge = getProfileAge(profile);

  return (
    <View className="px-6 py-4 bg-white mx-4 rounded-2xl mt-4">
      <View className="flex-row items-center mb-1">
        <Text className="text-black text-3xl font-SatoshiBold">{fullName}</Text>
      </View>
      <View className="flex-row items-center mb-1">
        <Text>
          {profile?.gender || ""}
          {profile?.gender && computedAge ? ", " : ""}
          {computedAge ? `${computedAge} years old` : ""}
        </Text>
      </View>
    </View>
  );
};

export default BasicInfo;
