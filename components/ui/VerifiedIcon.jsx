import { ShieldCheck } from "lucide-react-native";
import { colors } from "../../constant/colors";
import { Image } from "react-native";
import { Icons } from "../../constant/icons";

const VerifiedIcon = ({ style }) => {
  return (
    <Image
      source={Icons.verifiedIcon}
      style={[{ width: 24, height: 24 }, style]}
      resizeMode="contain"
    />
  );
};

export default VerifiedIcon;
