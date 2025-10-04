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
  GeneralSans: require("../assets/fonts/GeneralSans-Regular.otf"),
  GeneralSansLight: require("../assets/fonts/GeneralSans-Light.otf"),
  GeneralSansMedium: require("../assets/fonts/GeneralSans-Medium.otf"),
  GeneralSansSemiBold: require("../assets/fonts/GeneralSans-Semibold.otf"),
  GeneralSansBold: require("../assets/fonts/GeneralSans-Bold.otf"),
  Satoshi: require("../assets/fonts/Satoshi-Regular.otf"),
  SatoshiLight: require("../assets/fonts/Satoshi-Light.otf"),
  SatoshiMedium: require("../assets/fonts/Satoshi-Medium.otf"),
  SatoshiBold: require("../assets/fonts/Satoshi-Bold.otf"),
  SatoshiItalic: require("../assets/fonts/Satoshi-Italic.otf"),
  SatoshiItalicLight: require("../assets/fonts/Satoshi-LightItalic.otf"),
  SatoshiMediumItalic: require("../assets/fonts/Satoshi-MediumItalic.otf"),
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
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <StatusBar barStyle="dark-content" />
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <WalletProvider>
            <ProfileProvider>
              <ToastProvider>
                <Stack screenOptions={{ headerShown: false }}>
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
