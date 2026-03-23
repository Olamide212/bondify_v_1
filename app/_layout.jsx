import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import { StatusBar, View } from "react-native";
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
import messageService from "../services/messageService";
import { profileService } from "../services/profileService";
import { persistor, store } from "../store/store";


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
      <Stack screenOptions={{ headerShown: false }} className="bg-white">
        {/* Only keep these if you're customizing screen options */}
        <Stack.Screen name="index" />
        <Stack.Screen name="(root)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="root-tabs" />
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
const [fontsLoaded] = useFonts({
  PlusJakartaSans: require("../assets/fonts/PlusJakartaSans_400Regular.ttf"),
  PlusJakartaSansExtraLight: require("../assets/fonts/PlusJakartaSans_200ExtraLight.ttf"),
  PlusJakartaSansLight: require("../assets/fonts/PlusJakartaSans_300Light.ttf"),
  PlusJakartaSansMedium: require("../assets/fonts/PlusJakartaSans_500Medium.ttf"),
  PlusJakartaSansSemiBold: require("../assets/fonts/PlusJakartaSans_600SemiBold.ttf"),
  PlusJakartaSansBold: require("../assets/fonts/PlusJakartaSans_700Bold.ttf"),
  PlusJakartaSansExtraBold: require("../assets/fonts/PlusJakartaSans_800ExtraBold.ttf"),
  PlusJakartaSansItalic: require("../assets/fonts/PlusJakartaSans_400Regular_Italic.ttf"),
  PlusJakartaSansExtraLightItalic: require("../assets/fonts/PlusJakartaSans_200ExtraLight_Italic.ttf"),
  PlusJakartaSansLightItalic: require("../assets/fonts/PlusJakartaSans_300Light_Italic.ttf"),
  PlusJakartaSansMediumItalic: require("../assets/fonts/PlusJakartaSans_500Medium_Italic.ttf"),
  PlusJakartaSansSemiBoldItalic: require("../assets/fonts/PlusJakartaSans_600SemiBold_Italic.ttf"),
  PlusJakartaSansBoldItalic: require("../assets/fonts/PlusJakartaSans_700Bold_Italic.ttf"),
  PlusJakartaSansExtraBoldItalic: require("../assets/fonts/PlusJakartaSans_800ExtraBold_Italic.ttf"),
});

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView} className='bg-white'>
      <StatusBar barStyle="dark-content" />
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
