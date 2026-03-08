import { Check, X } from "lucide-react-native";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import { Icons } from "../../constant/icons";
import BaseModal from "./BaseModal";

const plans = [
  {
    id: "free",
    title: "Free",
    price: "₦0 / mo",
    highlight: false,
    perks: [
      "Limited swipes per day",
      "Basic filters (age, gender, distance)",
      "Send & receive messages after match",
      "1 Spark per week",
    ],
  },
  {
    id: "plus",
    title: "Plus",
    price: "₦5,000 / mo",
    highlight: false,
    perks: [
      "Unlimited swipes",
      "Rewind last swipe",
      "1 Spark boost per week",
      "Extended filters (education, lifestyle)",
      "No ads",
    ],
  },
  {
    id: "gold",
    title: "Gold",
    price: "₦15,000 / mo",
    highlight: true,
    perks: [
      "All Plus features",
      "See who liked you",
      "5 Super Likes per day",
      "2 Spark boosts per month",
      "Priority placement in discovery",
      "Passport mode",
      "Read receipts",
      "Bondies AI conversation starter",
    ],
  },
  {
    id: "diamond",
    title: "Diamond",
    price: "₦30,000 / mo",
    highlight: false,
    perks: [
      "All Gold features",
      "Unlimited Sparks",
      "Unlimited Super Likes",
      "Incognito Mode",
      "VIP profile badge",
      "Priority messaging",
      "AI match suggestions daily",
      "Exclusive profile customization",
    ],
  },
];

const benefits = [
  {
    id: 1,
    title: "Unlimited AI Icebreakers",
    description: "Never run out of things to say with personalized prompts.",
    icon: Icons.messageIcon,
  },
  {
    id: 2,
    title: "Deep Conversation Mode",
    description: "Go beyond surface level with advanced profile insights.",
    icon: Icons.deepConversationIcon,
  },
  {
    id: 3,
    title: "Priority Profile Analysis",
    description: "Get discovered by your most compatiblematches faster.",
    icon: Icons.verifyIcon,
  },
  {
    id: 4,
    title: "Ad-free Experience",
    description: "Zero interruptions. Purely meaningful social bonds.",
    icon: Icons.AdFreeIcon,
  },
];

const SubscriptionModal = ({ visible, onClose }) => {
  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 5,

            }}
          >

            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>




          {/* Body */}
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              gap: 20,
              paddingBottom: 60,
            }}
          >
            <View className='flex flex-col justify-center items-center mt-6 mb-4'>
              <Image source={Icons.BotIcon} resizeMode="contain" style={{ width: 60, height: 60, marginBottom: 8 }} />
              <Text style={{ fontFamily: "PlusJakartaSansBold", fontSize: 26, marginTop: 8 }}>
                Bondies <Text className='text-primary'>AI Plus</Text>
              </Text>
              <Text style={{ fontFamily: "PlusJakartaSansMedium", fontSize: 14, color: "#000", marginTop: 4, textAlign: 'center',  }}>
                Unlock your full potential and experience
                deeper connections.
              </Text>
            </View>

{             benefits.map((benefit) => (
                <View
                  key={benefit.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,  
                  
                  }}
                >
                  <Image source={benefit.icon} style={{ width: 38, height: 38, marginRight: 8 }} />
                  <View style={{ flexDirection: "column", flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSansBold",
                      fontSize: 17,
                      color: "#000",
                      marginBottom: 2,
                    }}
                  >
                    {benefit.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans",
                      fontSize: 15,
                      color: "#000",
                      flex: 1,
                      lineHeight: 18,
                    }}
                    numberOfLines={2}
                  >
                    {benefit.description}
                  </Text>
                  </View>
                </View>
              ))}

            {plans.map((plan) => (
              <View
                key={plan.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 10,
                  elevation: 3,
                  borderWidth: plan.id === "free" ? 2 : 1,
                  borderColor: plan.id === "free" ? colors.primary : "#eee",
                  marginTop: plan.highlight ? 40 : 0,
                  minHeight: 280,
                }}
              >
                {plan.highlight && (
                  <View
                    style={{
                      position: "absolute",
                      top: -20,
                      left: 20,
                      right: 20,
                      backgroundColor: colors.primary,
                      paddingVertical: 12,
                      borderRadius: 50,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "PlusJakartaSansSemiBold",
                        fontSize: 16,
                      }}
                    >
                      Most Popular
                    </Text>
                  </View>
                )}
                {/* Title & Price */}
                <Text
                  style={{
                    fontFamily: "PlusJakartaSansBold",
                    fontSize: 22,
                    color: colors.primary,
                    marginTop: plan.highlight ? 20 : 0, 
                  }}
                >
                  {plan.title}
                </Text>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSansBold",
                    fontSize: 20,
                    color: "#000",
                    marginTop: 4,
                    marginBottom: 12,
                  }}
                >
                  {plan.price}
                </Text>

                {/* Perks */}
                <View style={{ flex: 1, paddingBottom: 10 }}>
                  {plan.perks.map((perk, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginVertical: 4,
                      }}
                    >
                      <Check size={18} color={colors.primary} />
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans",
                          fontSize: 16,
                          color: "#000",
                          marginLeft: 8,
                          flex: 1,
                        }}
                      >
                        {perk}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Sticky Button */}
                {/* <View
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    right: 20,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: plan.highlight ? colors.primary : "#000",
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "PlusJakartaSansBold",
                        fontSize: 16,
                      }}
                    >
                      {plan.id === "free" ? "Current Plan" : "Subscribe"}
                    </Text>
                  </TouchableOpacity>
                </View> */}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </BaseModal>
  );
};

export default SubscriptionModal;
