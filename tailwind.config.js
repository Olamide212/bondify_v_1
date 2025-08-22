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
        GeneralSans: ["GeneralSans", "sans-serif"],
        GeneralSansLight: ["GeneralSansLight", "sans-serif"],
        GeneralSansMedium: ["GeneralSansMedium", "sans-serif"],
        GeneralSansSemiBold: ["GeneralSansSemiBold", "sans-serif"],
        GeneralSansBold: ["GeneralSansBold", "sans-serif"],
        Satoshi: ["Satoshi", "sans-serif"],
        SatoshiLight: ["SatoshiLight", "sans-serif"],
        SatoshiMedium: ["SatoshiMedium", "sans-serif"],
        SatoshiBold: ["SatoshiBold", "sans-serif"],
        SatoshiItalic: ["SatoshiItalic", "sans-serif"],
        SatoshiItalicLight: ["SatoshiItalicLight", "sans-serif"],
        SatoshiMediumItalic: ["SatoshiMediumItalic", "sans-serif"],
      },
      colors: {
        app: "#111111",
        primary: "#4B164C",
        secondary: "#6C47FF",
        otherColor: "#FF0066",
        ash: "#888",
      },
    },
  },
  plugins: [],
};
