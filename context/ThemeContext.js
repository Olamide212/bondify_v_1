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
  // Backgrounds
  background: colors.background,
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",

  // Text
  textPrimary: "#111827",
  textSecondary: colors.gray,
  textTertiary: "#9CA3AF",
  textInverse: "#FFFFFF",

  // Brand
  primary: colors.primary,
  primaryLight: colors.primaryLight,
  primaryBorder: colors.primaryBorder,
  primaryDark: "#3730A3",
  primaryMuted: "#6366F1",

  // Borders & dividers
  border: "#E5E7EB",
  divider: "#F3F4F6",

  // Interactive
  backButton: "#F3F4F6",
  switchTrackOff: "#E5E7EB",
  inputBackground: "#F9FAFB",

  // Status bar
  statusBarStyle: "dark-content",
};

export const DARK_COLORS = {
  // Backgrounds
  background: "#0F0F0F",
  surface: "#1C1C1E",
  surfaceElevated: "#2C2C2E",

  // Text
  textPrimary: "#F2F2F7",
  textSecondary: "#AEAEB2",
  textTertiary: "#636366",
  textInverse: "#000000",

  // Brand  (keep brand purple consistent)
  primary: colors.primary,
  primaryLight: "#1E1B4B",
  primaryBorder: "#3730A3",
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
  theme: "system",
  resolvedScheme: "light",   // "light" | "dark" — always resolved, never "system"
  colors: LIGHT_COLORS,
  isDark: false,
  setTheme: () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState("system");
  const systemScheme = Appearance.getColorScheme() ?? "light";

  // Resolve the actual scheme
  const resolvedScheme = theme === "system" ? systemScheme : theme;
  const isDark = resolvedScheme === "dark";
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

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
    <ThemeContext.Provider value={{ theme, resolvedScheme, colors, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useTheme = () => useContext(ThemeContext);