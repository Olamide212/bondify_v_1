import { Stack } from "expo-router";
import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect, useCallback } from "react";
import { StatusBar } from "react-native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../store/store";
import { ToastProvider } from "../context/ToastContext";
import { ProfileProvider } from "../context/ProfileContext";
import { WalletProvider } from "../context/WalletContext";


SplashScreen.preventAutoHideAsync();

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
          <WalletProvider>
            <ProfileProvider>
              <ToastProvider>
                <Stack screenOptions={{ headerShown: false }} className='bg-white'>
                  {/* Only keep these if you’re customizing screen options */}
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(root)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="root-tabs" />
                </Stack>
              </ToastProvider>
            </ProfileProvider>
          </WalletProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
