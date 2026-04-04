/**
 * ThemeContext.js
 *
 * Global theme provider for Bondies.
 *
 * Usage:
 *   // 1. Wrap your root layout
 *   import { ThemeProvider } from "@/context/ThemeContext";
 *   <ThemeProvider><Slot /></ThemeProvider>
 *
 *   // 2. Consume anywhere
 *   import { useTheme } from "@/context/ThemeContext";
 *   const { theme, colors, setTheme } = useTheme();
 *
 * theme values: "light" | "dark" | "system"
 * colors: the resolved palette for the active scheme
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { colors } from "../constant/colors";

// ─── Palettes ────────────────────────────────────────────────────────────────

export const LIGHT_COLORS = {
  // Backgrounds (all dark — permanent dark mode)
  background: "#121212",
  surface: "#1E1E1E",
  surfaceElevated: "#2A2A2A",

  // Text
  textPrimary: "#F2F2F7",
  textSecondary: "#9CA3AF",
  textTertiary: "#6B7280",
  textInverse: "#000000",

  // Brand
  primary: colors.primary,
  primaryLight: colors.primaryLight,
  primaryBorder: colors.primaryBorder,
  primaryDark: "#C7D2FE",
  primaryMuted: "#A5B4FC",

  // Borders & dividers
  border: "#333333",
  divider: "#2A2A2A",

  // Interactive
  backButton: "#2A2A2A",
  switchTrackOff: "#39393D",
  inputBackground: "#1E1E1E",

  // Status bar
  statusBarStyle: "light-content",
};

export const DARK_COLORS = {
  // Backgrounds
  background: "#121212",
  surface: "#1E1E1E",
  surfaceElevated: "#2A2A2A",

  // Text
  textPrimary: "#F2F2F7",
  textSecondary: "#AEAEB2",
  textTertiary: "#636366",
  textInverse: "#000000",

  // Brand  (keep brand purple consistent)
  primary: colors.primary,
  primaryLight: "#1E1A2E",
  primaryBorder: "#4A3D6E",
  primaryDark: "#C7D2FE",
  primaryMuted: "#A5B4FC",

  // Borders & dividers
  border: "#38383A",
  divider: "#2C2C2E",

  // Interactive
  backButton: "#2C2C2E",
  switchTrackOff: "#39393D",
  inputBackground: "#1C1C1E",

  // Status bar
  statusBarStyle: "light-content",
};

// ─── Context ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "@bondies/theme";

const ThemeContext = createContext({
  theme: "dark",
  resolvedScheme: "dark",   // "light" | "dark" — always resolved, never "system"
  colors: DARK_COLORS,
  isDark: true,
  setTheme: () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState("dark");
  const systemScheme = Appearance.getColorScheme() ?? "dark";

  // Resolve the actual scheme — always dark in permanent dark mode
  const resolvedScheme = "dark";
  const isDark = true;
  const activeColors = DARK_COLORS;

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (val === "light" || val === "dark" || val === "system") {
          setThemeState(val);
        }
      })
      .catch(() => {});
  }, []);

  // Listen to OS-level changes when theme is "system"
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      // Force re-render so resolvedScheme recalculates
      if (theme === "system") setThemeState((prev) => prev);
    });
    return () => sub.remove();
  }, [theme]);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedScheme, colors: activeColors, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useTheme = () => useContext(ThemeContext);