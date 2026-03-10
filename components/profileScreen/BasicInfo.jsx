import { User } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { getProfileAge } from "../../utils/ageHelper";
import { colors } from "../../constant/colors";

const BasicInfo = ({ profile }) => {
  const fullName =
    profile?.name ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Your name";

  const computedAge = getProfileAge(profile);

  const subtitle = [
    profile?.gender,
    computedAge ? `${computedAge} years old` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={s.card}>
      <View style={s.cardLeft}>
        <View style={s.iconCircle}>
          <User size={18} color={colors.primary} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1} adjustsFontSizeToFit>
            {fullName}
          </Text>
          {subtitle ? (
            <Text style={s.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default BasicInfo;

const s = StyleSheet.create({
  card: {
    backgroundColor:  "#fff",
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      "#F3F4F6",
    marginHorizontal: 16,
    padding:          16,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           12,
  },
  iconCircle: {
    width:           40,
    height:          40,
    borderRadius:    99,
    backgroundColor: "#FEF3EC",
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },
  name: {
    fontSize:     16,
    fontFamily:   "PlusJakartaSansBold",
    color:        "#111",
    marginBottom: 3,
    textTransform: "capitalize",
  },
  subtitle: {
    fontSize:      13,
    fontFamily:    "PlusJakartaSansMedium",
    color:         "#9CA3AF",
    textTransform: "capitalize",
  },
});