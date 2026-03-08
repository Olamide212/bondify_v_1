import { Share } from "react-native";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Copy, Share2, Gift, Star } from "lucide-react-native";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import ReferralHistoryModal from "../../../../components/modals/ReferralHistoryModal";



const REFERRAL_CODE = "BONDIES-LOVE-24";
const PRIMARY = "#E8572A";
const PRIMARY_LIGHT = "#FFF0EB";

const InviteScreen = ({ navigation }) => {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
const [referralHistory, setReferralHistory] = useState([]);
const [isLoadingHistory, setIsLoadingHistory] = useState(false);


// Fetch when opening
const handleViewHistory = async () => {
  setShowHistory(true);
  setIsLoadingHistory(true);
  try {
    const data = await referralService.getHistory(); // your API call
    setReferralHistory(data);
  } catch (e) {
    setReferralHistory([]);
  } finally {
    setIsLoadingHistory(false);
  }
};

  const handleCopy = () => {
    Clipboard.setString(REFERRAL_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Bondies and find your perfect match! Use my referral code ${REFERRAL_CODE} when signing up and we both get 1 Month AI Plus free! 🎉`,
        title: "Join Bondies",
      });
    } catch (error) {
      Alert.alert("Error", "Could not share referral code.");
    }
  };

//   const handleViewHistory = () => {
//     navigation?.navigate("ReferralHistory");
//   };

  return (
    <SafeAreaView style={styles.safe}>
 

      <GeneralHeader title="Refer & Earn"  leftIcon={<ArrowLeft />} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80" }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Spread the Love on Bondies</Text>
        <Text style={styles.subtitle}>
          Invite your friends to find their perfect match{"\n"}and you both get rewarded!
        </Text>

        {/* Reward Cards */}
        <View style={styles.rewardRow}>
          <View style={styles.rewardCard}>
            <View style={styles.rewardIconWrap}>
              <Gift size={22} color={PRIMARY} />
            </View>
            <Text style={styles.rewardLabel}>THEY GET</Text>
            <Text style={styles.rewardValue}>1 Month AI Plus</Text>
          </View>

          <View style={styles.rewardCard}>
            <View style={styles.rewardIconWrap}>
              <Star size={22} color={PRIMARY} />
            </View>
            <Text style={styles.rewardLabel}>YOU GET</Text>
            <Text style={styles.rewardValue}>1 Month AI Plus</Text>
          </View>
        </View>

        {/* Referral Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>

          <Pressable onPress={handleCopy} style={styles.codeBox}>
            <Text style={styles.codeText}>{REFERRAL_CODE}</Text>
            <View style={styles.copyIcon}>
              <Copy size={18} color={copied ? "#4CAF50" : PRIMARY} />
            </View>
          </Pressable>

          {copied && (
            <Text style={styles.copiedText}>Copied to clipboard!</Text>
          )}

          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <Share2 size={20} color="#fff" />
            <Text style={styles.shareBtnText}>Share Your Code</Text>
          </Pressable>

          <Pressable onPress={handleViewHistory}>
            <Text style={styles.historyLink}>View Referral History</Text>
          </Pressable>
        </View>

        {/* How it works */}
        <View style={styles.howSection}>
          <Text style={styles.howTitle}>How it works</Text>

          {[
            {
              step: "1",
              text: "Send your unique code to friends who haven't joined Bondies yet.",
            },
            {
              step: "2",
              text: "They enter your code when signing up for their new account.",
            },
            {
              step: "3",
              text: "Once they complete their profile, you both unlock 30 days of AI Plus perks!",
            },
          ].map((item) => (
            <View key={item.step} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{item.step}</Text>
              </View>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>


<ReferralHistoryModal
  visible={showHistory}
  onClose={() => setShowHistory(false)}
  referrals={referralHistory}
  isLoading={isLoadingHistory}
/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero
  heroContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    height: 220,
    marginBottom: 24,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },

  // Title
  title: {
    fontSize: 22,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 32,
    marginBottom: 24,
  },

  // Reward Cards
  rewardRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  rewardLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSansBold",
    color: PRIMARY,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansSemiBold",
    color: "#111",
    textAlign: "center",
  },

  // Code Card
  codeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  codeLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSansBold",
    color: "#999",
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    width: "100%",
    marginBottom: 6,
    backgroundColor: PRIMARY_LIGHT,
  },
  codeText: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: PRIMARY,
    letterSpacing: 1.5,
  },
  copyIcon: {
    padding: 4,
  },
  copiedText: {
    fontSize: 12,
    color: "#4CAF50",
    fontFamily: "PlusJakartaSansMedium",
    marginBottom: 6,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    paddingVertical: 16,
    width: "100%",
    marginTop: 10,
    marginBottom: 16,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "PlusJakartaSansSemiBold",
  },
  historyLink: {
    fontSize: 14,
    fontFamily: "PlusJakartaSansMedium",
    color: PRIMARY,
  },

  // How it works
  howSection: {
    marginHorizontal: 16,
  },
  howTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 16,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PRIMARY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumber: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
    color: PRIMARY,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#444",
    lineHeight: 22,
  },
});

export default InviteScreen;