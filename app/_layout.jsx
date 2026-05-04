import { DarkTheme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import MatchCelebrationModal from "../components/modals/MatchCelebrationModal";
import { NotificationBanner } from "../components/ui/NotificationBanner";
import { AlertProvider } from "../context/AlertContext";
import { DiscoveryProfilesProvider } from "../context/DiscoveryProfilesContext";
import { ProfileProvider, useProfile } from "../context/ProfileContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ToastProvider } from "../context/ToastContext";
import { WalletProvider } from "../context/WalletContext";
import "../global.css";
import { useAuthRestore } from "../hooks/useAuthRestore"; // ✅ Import here
import { messageService } from "../services/messageService";
import { profileService } from "../services/profileService";
import PushNotificationService from "../services/pushNotificationService";
import { persistor, store } from "../store/store";

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.keyboardAppearance = "dark";

SplashScreen.preventAutoHideAsync();

// ✅ This component is inside <Provider>, so useAuthRestore works safely here
function RootLayoutInner() {
  const router = useRouter();
  const currentUser = useSelector((state) => state.auth.user);
  const { matchCelebration, setMatchCelebration } = useProfile();
  const [activeBanner, setActiveBanner] = useState(null);

  // ✅ Moved from (root)/_layout.jsx — safe here because we're inside <Provider>
  useAuthRestore();

  useEffect(() => {
    PushNotificationService.handleInitialNotificationResponse({ router });

    const removeListeners = PushNotificationService.addNotificationListeners({
      onNotificationReceived: (notification) => {
        const content = notification?.request?.content ?? {};
        const data = content?.data ?? {};
        setActiveBanner({
          title: content.title || "",
          body: content.body || "",
          type: data?.type || "notification",
          image: data?.senderImage || null,
          _raw: notification,
        });
      },
      onNotificationResponse: (response) => {
        PushNotificationService.handleNotificationResponse({ response, router });
      },
    });

    return removeListeners;
  }, [router]);

  useEffect(() => {
    if (currentUser?.id || currentUser?._id) {
      const userId = currentUser.id || currentUser._id;
      profileService.onUserLogin(userId);
    }
  }, [currentUser?.id, currentUser?._id]);

  useEffect(() => {
    const userId = currentUser?.id || currentUser?._id;
    if (!userId) return;
    PushNotificationService.registerForPushNotifications({ userId });
  }, [currentUser?.id, currentUser?._id]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} className="bg-[#121212]">
        <Stack.Screen name="index" />
        <Stack.Screen name="(root)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      <NotificationBanner
        notification={activeBanner}
        onDismiss={() => setActiveBanner(null)}
        onPress={(banner) => {
          if (banner?._raw) {
            const action = PushNotificationService.buildNavigationAction(banner._raw);
            router.push(action);
          }
        }}
      />

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
    PlusJakartaSans: require("../assets/fonts/PlusJakartaSans_400Regular.ttf"),
    PlusJakartaSansExtraLight: require("../assets/fonts/PlusJakartaSans_200ExtraLight.ttf"),
    PlusJakartaSansLight: require("../assets/fonts/PlusJakartaSans_300Light.ttf"),
    PlusJakartaSansMedium: require("../assets/fonts/PlusJakartaSans_500Medium.ttf"),
    PlusJakartaSansSemiBold: require("../assets/fonts/PlusJakartaSans_600SemiBold.ttf"),
    PlusJakartaSansBold: require("../assets/fonts/PlusJakartaSans_700Bold.ttf"),
    PlusJakartaSansExtraBold: require("../assets/fonts/PlusJakartaSans_800ExtraBold.ttf"),
    Outfit: require("../assets/fonts/PlusJakartaSans_400Regular.ttf"),
    OutfitExtraLight: require("../assets/fonts/PlusJakartaSans_200ExtraLight.ttf"),
    OutfitLight: require("../assets/fonts/PlusJakartaSans_300Light.ttf"),
    OutfitMedium: require("../assets/fonts/PlusJakartaSans_500Medium.ttf"),
    OutfitSemiBold: require("../assets/fonts/PlusJakartaSans_600SemiBold.ttf"),
    OutfitBold: require("../assets/fonts/PlusJakartaSans_700Bold.ttf"),
    OutfitExtraBold: require("../assets/fonts/PlusJakartaSans_800ExtraBold.ttf"),
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideSplash();
    }
  }, [fontsLoaded, fontError, hideSplash]);

  useEffect(() => {
    const timer = setTimeout(() => {
      hideSplash();
    }, 5000);
    return () => clearTimeout(timer);
  }, [hideSplash]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#121212" }}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <NavigationThemeProvider value={DarkTheme}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider>
              <WalletProvider>
                <ProfileProvider>
                  <DiscoveryProfilesProvider>
                    <ToastProvider>
                      <AlertProvider>
                        {/* ✅ RootLayoutInner is inside Provider — useAuthRestore is safe */}
                        <RootLayoutInner />
                      </AlertProvider>
                    </ToastProvider>
                  </DiscoveryProfilesProvider>
                </ProfileProvider>
              </WalletProvider>
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}