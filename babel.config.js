module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // plugins: [
    //   "react-native-reanimated/plugin", // if using Reanimated
    //   "react-native-worklets/plugin", // 👈 add this if not auto-detected
    // ],
  };
};
