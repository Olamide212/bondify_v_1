import { ShieldCheck } from "lucide-react-native";
import { colors } from "../../constant/colors";

const VerifiedIcon = ({ style }) => {
  return (
    <ShieldCheck
      size={23}
      color={colors.primary}
      strokeWidth={2}
      style={style}
    />
  );
};

export default VerifiedIcon;
