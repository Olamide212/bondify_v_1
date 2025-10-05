import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Phone, Mail, Instagram, Linkedin, Facebook } from "lucide-react-native";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import Card from "../../../../components/ui/Card"; // adjust import path if needed

const SupportCenter = () => {
  const contactItems = [
    {
      title: "+31 20 123 4567",
      description: "Call us",
      icon: Phone,
      onPress: () => console.log("Call pressed"),
    },
    {
      title: "support@bondie.online",
      description: "Send us an email",
      icon: Mail,
      onPress: () => console.log("Email pressed"),
    },
  ];

  const socialItems = [
    {
      title: "@bondies",
      description: "Instagram",
      icon: Instagram,
      onPress: () => console.log("Instagram pressed"),
    },
    {
      title: "@bondies",
      description: "Facebook",
      icon: Facebook,
      onPress: () => console.log("Facebook pressed"),
    },
    {
      title: "@bondies",
      description: "Tiktok",
      icon: Linkedin,
      onPress: () => console.log("LinkedIn pressed"),
    },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <GeneralHeader title="Help and Support" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.headerTitle}>Contact us</Text>

          <Text style={styles.infoText}>
            If you have any inquiries, get in touch with us.{"\n"}We’ll be happy to help!
          </Text>

          <Card title="Contact Information" items={contactItems} />

          <Card title="Social Media" items={socialItems} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default SupportCenter;

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },
  infoText: {
    textAlign: "left",
    color: "#555",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
});
