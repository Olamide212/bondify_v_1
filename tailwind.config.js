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
        PlusJakartaSansItalic: ["PlusJakartaSansItalic", "sans-serif"],
        PlusJakartaSansExtraLightItalic: ["PlusJakartaSansExtraLightItalic", "sans-serif"],
        PlusJakartaSansLightItalic: ["PlusJakartaSansLightItalic", "sans-serif"],
        PlusJakartaSansMediumItalic: ["PlusJakartaSansMediumItalic", "sans-serif"],
        PlusJakartaSansSemiBoldItalic: ["PlusJakartaSansSemiBoldItalic", "sans-serif"],
        PlusJakartaSansBoldItalic: ["PlusJakartaSansBoldItalic", "sans-serif"],
        PlusJakartaSansExtraBoldItalic: ["PlusJakartaSansExtraBoldItalic", "sans-serif"],
      },
      colors: {
        app: "#111111",
        primary: "#371F7D",
        tertiary: "#BC96FE",
        background: "#F8F6F6",
        grayColor: "#64748B",
        secondary: "#D7FF81",
        otherColor: "#bc96ff",
        pinkColor: "#ff4365",
        ash: "#888",
      },
    },
  },
  plugins: [],
};
