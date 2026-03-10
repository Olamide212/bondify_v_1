import { useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";

const Verification = ({ profile }) => {
  const router    = useRouter();
  const verified  = profile?.verified === true;
  const pending   = profile?.verificationStatus === "pending";

  const handlePress = () => {
    if (verified || pending) return;
    router.push("/verification");
  };

  return (
    <TouchableOpacity
      style={[s.card, (verified || pending) && s.cardDone]}
      onPress={handlePress}
      activeOpacity={verified || pending ? 1 : 0.8}
    >
      <View style={s.cardLeft}>
        <View style={[s.iconCircle, verified && s.iconCircleVerified, pending && s.iconCirclePending]}>
          <ShieldCheck
            size={18}
            color={verified ? "#10B981" : pending ? "#F59E0B" : colors.primary}
            strokeWidth={2}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>
            {verified ? "Identity Verified" : pending ? "Verification Pending" : "Get Verified"}
          </Text>
          <Text style={s.cardSub} numberOfLines={2}>
            {verified
              ? "Your profile has a verified badge — others can trust it's really you."
              : pending
              ? "We're reviewing your selfie. This usually takes a few minutes."
              : "Take a quick selfie to verify your identity and earn a trust badge."}
          </Text>
          {!verified && !pending && (
            <Text style={s.cardCta}>Verify now →</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Verification;

const s = StyleSheet.create({
  card: {
    backgroundColor:  "#fff",
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      "#F3F4F6",
    marginHorizontal: 16,
    padding:          16,
  },
  cardDone: {
    borderColor: "#F3F4F6",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems:    "flex-start",
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
  iconCircleVerified: {
    backgroundColor: "#D1FAE5",
  },
  iconCirclePending: {
    backgroundColor: "#FEF3C7",
  },
  cardTitle: {
    fontSize:     16,
    fontFamily:   "PlusJakartaSansBold",
    color:        "#111",
    marginBottom: 4,
  },
  cardSub: {
    fontSize:   13,
    fontFamily: "PlusJakartaSans",
    color:      "#6B7280",
    lineHeight: 19,
  },
  cardCta: {
    fontSize:   13,
    fontFamily: "PlusJakartaSansSemiBold",
    color:      "#E8651A",
    marginTop:  6,
  },
});