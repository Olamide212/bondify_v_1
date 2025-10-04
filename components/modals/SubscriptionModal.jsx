import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Check, X } from "lucide-react-native";
import { colors } from "../../constant/colors";
import BaseModal from "./BaseModal";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

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

const SubscriptionModal = ({ visible, onClose }) => {
  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
          }}
        >
          <Text
            style={{ fontSize: 20, fontFamily: "SatoshiBold", color: "#000" }}
          >
            Choose Your Plan
          </Text>
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
                borderWidth: plan.highlight ? 2 : 1,
                borderColor: plan.highlight ? colors.primary : "#eee",
                minHeight: 280,
              }}
            >
              {/* Title & Price */}
              <Text
                style={{
                  fontFamily: "SatoshiBold",
                  fontSize: 22,
                  color: colors.primary,
                }}
              >
                {plan.title}
              </Text>
              <Text
                style={{
                  fontFamily: "SatoshiMedium",
                  fontSize: 18,
                  color: "#000",
                  marginTop: 4,
                  marginBottom: 12,
                }}
              >
                {plan.price}
              </Text>

              {/* Perks */}
              <View style={{ flex: 1, paddingBottom: 60 }}>
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
                        fontFamily: "Satoshi",
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
              <View
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
                      fontFamily: "SatoshiBold",
                      fontSize: 16,
                    }}
                  >
                    {plan.id === "free" ? "Current Plan" : "Subscribe"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        </SafeAreaView>
        </SafeAreaProvider>
    </BaseModal>
  );
};

export default SubscriptionModal;
