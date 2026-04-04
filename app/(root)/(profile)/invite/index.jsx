import { ArrowLeft, Copy, Gift, Share2, Star, Users } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Clipboard, Image, Pressable, ScrollView, Share, StyleSheet, Text, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GeneralHeader from "../../../../components/headers/GeneralHeader";
import { colors } from "../../../../constant/colors";
import { useAlert } from "../../../../context/AlertContext";
import SettingsService from "../../../../services/settingsService";

const PRIMARY       = colors.primary;
const PRIMARY_LIGHT = colors.primaryLight;

const InviteScreen = ({ navigation }) => {
  const { showAlert } = useAlert();
  const [referralCode,  setReferralCode]  = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralLink,  setReferralLink]  = useState(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [fetchError,    setFetchError]    = useState(null);
  const [copied,        setCopied]        = useState(false);

  // ── Fetch referral code on mount ──────────────────────────────
  const fetchReferralCode = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await SettingsService.getReferralCode();
      // response.data = { referralCode, referralCount, referralLink }
      const { referralCode: code, referralCount: count, referralLink: link } =
        response?.data ?? {};
      setReferralCode(code  ?? null);
      setReferralCount(count ?? 0);
      setReferralLink(link  ?? null);
    } catch (err) {
      setFetchError("Couldn't load your referral code. Tap to retry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralCode();
  }, [fetchReferralCode]);

  // ── Copy code to clipboard ────────────────────────────────────
  const handleCopy = () => {
    if (!referralCode) return;
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Share sheet ───────────────────────────────────────────────
  const handleShare = async () => {
    if (!referralCode) return;
    const shareText = referralLink
      ? `Join me on Bondies! Use my referral code ${referralCode} or tap the link: ${referralLink} 🎉`
      : `Join me on Bondies and find your perfect match! Use my referral code ${referralCode} when signing up and we both get 1 Month AI Plus free! 🎉`;
    try {
      await Share.share({ message: shareText, title: "Join Bondies" });
    } catch {
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Could not share referral code.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <GeneralHeader title="Refer & Earn" leftIcon={<ArrowLeft color={'#fff'} />} />

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

          {isLoading ? (
            // ── Loading state ──
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={PRIMARY} />
              <Text style={styles.loadingText}>Generating your code...</Text>
            </View>
          ) : fetchError ? (
            // ── Error state with retry ──
            <Pressable style={styles.errorBox} onPress={fetchReferralCode}>
              <Text style={styles.errorText}>{fetchError}</Text>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          ) : (
            // ── Code display ──
            <Pressable onPress={handleCopy} style={styles.codeBox}>
              <Text style={styles.codeText}>Bondies - {referralCode}</Text>
              <View style={styles.copyIcon}>
                <Copy size={18} color={copied ? "#4CAF50" : PRIMARY} />
              </View>
            </Pressable>
          )}

          {copied && (
            <Text style={styles.copiedText}>Copied to clipboard!</Text>
          )}

          {/* Referral count badge */}
          {!isLoading && !fetchError && (
            <View style={styles.countBadge}>
              <Users size={14} color={'white'} />
              <Text style={styles.countText}>
                {referralCount === 0
                  ? "No referrals yet — share your code!"
                  : `${referralCount} friend${referralCount === 1 ? "" : "s"} joined using your code`}
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.shareBtn, (isLoading || !referralCode) && styles.shareBtnDisabled]}
            onPress={handleShare}
            disabled={isLoading || !referralCode}
          >
            <Share2 size={20} color="#fff" />
            <Text style={styles.shareBtnText}>Share Your Code</Text>
          </Pressable>
        </View>

        {/* How it works */}
        <View style={styles.howSection}>
          <Text style={styles.howTitle}>How it works</Text>
          {[
            { step: "1", text: "Send your unique code to friends who haven't joined Bondies yet." },
            { step: "2", text: "They enter your code when signing up for their new account." },
            { step: "3", text: "Once they complete their profile, you both unlock 30 days of AI Plus perks!" },
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: "#121212" },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  heroContainer: { marginHorizontal: 16, borderRadius: 20, overflow: "hidden", height: 220, marginBottom: 24 },
  heroImage:     { width: "100%", height: "100%" },

  title:    { fontSize: 22, fontFamily: "OutfitBold", color: '#E5E5E5', textAlign: "center", marginBottom: 8, paddingHorizontal: 24 },
  subtitle: { fontSize: 14, fontFamily: "Outfit", color: '#9CA3AF', textAlign: "center", lineHeight: 22, paddingHorizontal: 32, marginBottom: 24 },

  rewardRow:     { flexDirection: "row", gap: 12, marginHorizontal: 16, marginBottom: 20 },
  rewardCard:    { flex: 1, backgroundColor: "#121212", borderRadius: 16, padding: 16, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  rewardIconWrap:{ width: 48, height: 48, borderRadius: 24, backgroundColor: PRIMARY_LIGHT, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  rewardLabel:   { fontSize: 11, fontFamily: "OutfitBold", color: PRIMARY, letterSpacing: 0.8, marginBottom: 4 },
  rewardValue:   { fontSize: 13, fontFamily: "OutfitSemiBold", color: '#E5E5E5', textAlign: "center" },

  codeCard: { backgroundColor: "#121212", borderRadius: 20, marginHorizontal: 16, padding: 20, alignItems: "center", marginBottom: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  codeLabel: { fontSize: 11, fontFamily: "OutfitBold", color: "#999", letterSpacing: 1.2, marginBottom: 14 },

  // Loading
  loadingBox:  { paddingVertical: 20, alignItems: "center", gap: 10 },
  loadingText: { fontSize: 13, fontFamily: "Outfit", color: "#999" },

  // Error
  errorBox:  { borderWidth: 1.5, borderColor: "#FCA5A5", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, width: "100%", alignItems: "center", backgroundColor: '#2A1A1A', marginBottom: 6, gap: 4 },
  errorText: { fontSize: 13, fontFamily: "Outfit", color: "#EF4444", textAlign: "center" },
  retryText: { fontSize: 12, fontFamily: "OutfitMedium", color: PRIMARY },

  // Code box
  codeBox:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderColor: PRIMARY, borderStyle: "dashed", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, width: "100%", marginBottom: 6, backgroundColor: PRIMARY_LIGHT },
  codeText:   { fontSize: 18, fontFamily: "OutfitBold", color: PRIMARY, letterSpacing: 1.5 },
  copyIcon:   { padding: 4 },
  copiedText: { fontSize: 12, color: "#4CAF50", fontFamily: "OutfitMedium", marginBottom: 6 },

  // Referral count
  countBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: PRIMARY_LIGHT, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 16, marginTop: 6 },
  countText:  { fontSize: 12, fontFamily: "OutfitMedium", color: '#fff' },

  shareBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: PRIMARY, borderRadius: 30, paddingVertical: 16, width: "100%", marginTop: 4 },
  shareBtnDisabled: { backgroundColor: "#A99BC4" },
  shareBtnText:     { color: "#fff", fontSize: 16, fontFamily: "OutfitSemiBold" },

  howSection: { marginHorizontal: 16 },
  howTitle:   { fontSize: 18, fontFamily: "OutfitBold", color: '#E5E5E5', marginBottom: 16 },
  stepRow:    { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 16 },
  stepBadge:  { width: 30, height: 30, borderRadius: 15, backgroundColor: PRIMARY_LIGHT, justifyContent: "center", alignItems: "center", flexShrink: 0, marginTop: 1 },
  stepNumber: { fontSize: 13, fontFamily: "OutfitBold", color: PRIMARY },
  stepText:   { flex: 1, fontSize: 14, fontFamily: "Outfit", color: '#D1D5DB', lineHeight: 22 },
});

export default InviteScreen;
