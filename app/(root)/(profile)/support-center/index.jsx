import { ArrowLeft, Facebook, Instagram, Mail, Phone } from "lucide-react-native";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import Card from "../../../../components/ui/Card"; // adjust import path if needed

const SupportCenter = () => {
  const contactItems = [
    {
      title: "+234 810 0275 274",
      description: "Call us",
      icon: Phone,
      onPress: () => console.log("Call pressed"),
    },
    {
      title: "support@bondies.online",
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
      onPress: () => console.log("Tiktok pressed"),
    },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <GeneralHeader title=" Support" leftIcon={<ArrowLeft />}
          className="bg-white" />
        <ScrollView contentContainerStyle={styles.scrollContent} className="flex-1 flex-col gap-6 bg-background">
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
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
    marginBottom: 5,
    marginTop: 10,
  },
  infoText: {
    textAlign: "left",
    color: "#555",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: "PlusJakartaSansMedium",
  },
});
