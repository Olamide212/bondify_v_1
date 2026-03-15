import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../../components/ui/Button";
import {images} from "../../../constant/images";

// ── Swap this for your own local asset once you have the photo ──────────────
// e.g. require("../../../assets/images/african-couple.jpg")


const Onboarding = () => {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Full-screen couple photo ── */}
      <Image
        source={images.onboardingImage}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* ── Primary orange overlay (semi-transparent) ── */}
      <LinearGradient
        colors={[
          "rgba(238, 95, 43, 0.55)",   // top — lighter tint
          "rgba(238, 95, 43, 0.70)",   // mid
          "rgba(238, 95, 43, 0.92)",   // bottom — almost solid for text legibility
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Content ── */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.inner}>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image
              source={require("../../../assets/images/bondies-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          {/* Spacer — pushes content to bottom */}
          <View style={{ flex: 1 }} />

          {/* Bottom section */}
          <View style={styles.bottomSection}>

            {/* Tagline */}
            <Text style={styles.tagline}>
             Find meaningful connections 
            </Text>

            {/* African identity line */}
            <View style={styles.identityRow}>
              <View style={styles.identityLine} />
              <Text style={styles.identityText}>Powered by AI </Text>
              <View style={styles.identityLine} />
            </View>

            {/* Buttons */}
            <View style={styles.buttonsWrap}>
              <Button
                title="Continue with Phone Number"
                onPress={() => router.push("/login")}
                className="mb-3"
                textClassName="font-PlusJakartaSansSemiBold"
                variant="white"
              />
              <Button
                title="Create an Account"
                onPress={() => router.push("/register")}
                style={styles.outlineBtn}
                textClassName="font-PlusJakartaSansMedium"
                variant="black"
              />
            </View>

            {/* Terms */}
            <Text style={styles.terms}>
              By joining, you agree to our{" "}
           
                <Text style={styles.termsLink}>Terms & Conditions</Text>
     
            </Text>
            <Text style={styles.terms}>
       Built for Africans by Africans
           
       
     
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#EE5F2B",
  },
  safeArea: {
    flex: 1,
  },
  inner: {
    flex:            1,
    paddingHorizontal: 24,
    paddingBottom:   12,
  },

  // Logo
  logoWrap: {
    alignItems: "center",
    paddingTop: 8,
  },
  logo: {
    width:  130,
    height: 44,
  },

  // Bottom
  bottomSection: {
    width: "100%",
  },
  tagline: {
    fontSize:    35,
    fontFamily:  "PlusJakartaSansBold",
    color:       "#fff",
    textAlign:   "center",
    lineHeight:  38,
    marginBottom: 16,
    textShadowColor:  "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // "Made for Africans" divider
  identityRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    gap:            10,
    marginBottom:   24,
  },
  identityLine: {
    flex:            1,
    height:          1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  identityText: {
    fontSize:   15,
    fontFamily: "PlusJakartaSansSemiBold",
    color:      "rgba(255,255,255,0.9)",
  },

  // Buttons
  buttonsWrap: {
    gap:          12,
    marginBottom: 16,
  },
  outlineBtn: {
    backgroundColor: "transparent",
    borderWidth:     1.5,
    borderColor:     "#fff",
  },

  // Terms
  terms: {
    fontSize:   13,
    fontFamily: "PlusJakartaSansMedium",
    color:      "rgba(255,255,255,0.75)",
    textAlign:  "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  termsLink: {
    color:      "#fff",
    fontFamily: "PlusJakartaSansBold",
  },
});

export default Onboarding;