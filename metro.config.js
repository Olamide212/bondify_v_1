// const { getDefaultConfig } = require("expo/metro-config");
// const { withNativeWind } = require("nativewind/metro");

// const config = getDefaultConfig(__dirname);


// // Add support for SVG
// config.resolver.assetExts = config.resolver.assetExts.filter(
//   (ext) => ext !== "svg"
// );
// config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];
// config.transformer.babelTransformerPath = require.resolve(
//   "react-native-svg-transformer"
// );

// module.exports = withNativeWind(config, { input: "./global.css" });

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("png");

config.transformer = {
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
     experimentalImportSupport: false,
       inlineRequires: true,
};
config.resolver = {
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

module.exports = withNativeWind(config, { input: "./global.css" });
