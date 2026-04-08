import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef } from "react";
import { StatusBar, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import MatchCelebrationModal from "../components/modals/MatchCelebrationModal";
import { AlertProvider } from "../context/AlertContext";
import { DiscoveryProfilesProvider } from "../context/DiscoveryProfilesContext";
import { ProfileProvider, useProfile } from "../context/ProfileContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ToastProvider } from "../context/ToastContext";
import { WalletProvider } from "../context/WalletContext";
import "../global.css";
import { messageService } from "../services/messageService";
import { profileService } from "../services/profileService";
import { persistor, store } from "../store/store";

// Force dark keyboard globally
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.keyboardAppearance = "dark";


SplashScreen.preventAutoHideAsync();

// Inner component that uses the ProfileContext
function RootLayoutInner() {
  const currentUser = useSelector((state) => state.auth.user);
  const { matchCelebration, setMatchCelebration } = useProfile();

  // Initialize cache manager with current user
  useEffect(() => {
    if (currentUser?.id || currentUser?._id) {
      const userId = currentUser.id || currentUser._id;
      profileService.onUserLogin(userId);
    }
  }, [currentUser?.id, currentUser?._id]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} className="bg-[#121212]">
        {/* Only keep these if you're customizing screen options */}
        <Stack.Screen name="index" />
        <Stack.Screen
          name="(root)"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="(auth)"
          options={{
            gestureEnabled: false,
            animation: "none",
          }}
        />
        <Stack.Screen
          name="root-tabs"
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack>
      {/* <OfflineBanner /> */}

      {/* Global Match Celebration Modal — accessible from anywhere */}
      <MatchCelebrationModal
        visible={!!matchCelebration}
        onClose={() => setMatchCelebration(null)}
        matchedUser={matchCelebration}
        currentUser={currentUser}
        onSendMessage={async (matchedProfile, selectedIceBreaker) => {
          if (matchedProfile?.matchId && selectedIceBreaker) {
            try {
              await messageService.sendMessage(matchedProfile.matchId, {
                content: selectedIceBreaker,
                type: "text",
              });
            } catch (error) {
              console.error("Failed to send ice breaker:", error);
            }
          }
          setMatchCelebration(null);
        }}
        onContinueSwiping={() => setMatchCelebration(null)}
      />
    </View>
  );
}

export default function RootLayout() {
  const splashHidden = useRef(false);

const [fontsLoaded, fontError] = useFonts({
  Outfit: require("../assets/fonts/Outfit_400Regular.ttf"),
  OutfitExtraLight: require("../assets/fonts/Outfit_200ExtraLight.ttf"),
  OutfitLight: require("../assets/fonts/Outfit_300Light.ttf"),
  OutfitMedium: require("../assets/fonts/Outfit_500Medium.ttf"),
  OutfitSemiBold: require("../assets/fonts/Outfit_600SemiBold.ttf"),
  OutfitBold: require("../assets/fonts/Outfit_700Bold.ttf"),
  OutfitExtraBold: require("../assets/fonts/Outfit_800ExtraBold.ttf"),
});

  const hideSplash = useCallback(async () => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    try {
      await SplashScreen.hideAsync();
    } catch (_e) {
      // Ignore — splash may already be hidden
    }
  }, []);

  // Hide splash when fonts are ready (or failed)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideSplash();
    }
  }, [fontsLoaded, fontError, hideSplash]);

  // Safety net: force-hide splash after 5 seconds no matter what
  // This prevents the app from being stuck on the native splash forever
  useEffect(() => {
    const timer = setTimeout(() => {
      hideSplash();
    }, 5000);
    return () => clearTimeout(timer);
  }, [hideSplash]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#121212' }}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
          <WalletProvider>
            <ProfileProvider>
              <DiscoveryProfilesProvider>
                <ToastProvider>
                  <AlertProvider>
                    <RootLayoutInner />
                  </AlertProvider>
                </ToastProvider>
              </DiscoveryProfilesProvider>
            </ProfileProvider>
          </WalletProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
