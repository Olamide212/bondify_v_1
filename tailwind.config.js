/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        PlusJakartaSans: ["PlusJakartaSans", "sans-serif"],
        PlusJakartaSansExtraLight: ["PlusJakartaSansExtraLight", "sans-serif"],
        PlusJakartaSansLight: ["PlusJakartaSansLight", "sans-serif"],
        PlusJakartaSansMedium: ["PlusJakartaSansMedium", "sans-serif"],
        PlusJakartaSansSemiBold: ["PlusJakartaSansSemiBold", "sans-serif"],
        PlusJakartaSansBold: ["PlusJakartaSansBold", "sans-serif"],
        PlusJakartaSansExtraBold: ["PlusJakartaSansExtraBold", "sans-serif"],
        Outfit: ["PlusJakartaSans", "sans-serif"],
        OutfitExtraLight: ["PlusJakartaSansExtraLight", "sans-serif"],
        OutfitLight: ["PlusJakartaSansLight", "sans-serif"],
        OutfitMedium: ["PlusJakartaSansMedium", "sans-serif"],
        OutfitSemiBold: ["PlusJakartaSansSemiBold", "sans-serif"],
        OutfitBold: ["PlusJakartaSansBold", "sans-serif"],
        OutfitExtraBold: ["PlusJakartaSansExtraBold", "sans-serif"],
      },
      colors: {
        primary: "#FE01AA",
    background: "#121212",
    secondary: "#412599",
    white: "#fff",
    tertiary: "#BC96FE",
    gray: "#64748B",
    activePrimary: "#371F7D",
    inactiveTab: "#9CA3AF",
    primaryLight: "#1E1A2E",
    primaryBorder: "#4A3D6E",
    pinkColor: "#ff4365",
    surface: "#1E1E1E",
    surfaceLight: "#2A2A2A",
        whiteLight: 'rgba(255,255,255,0.1)'
      },
    },
  },
  plugins: [],
};
