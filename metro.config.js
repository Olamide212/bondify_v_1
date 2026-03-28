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
  minifierConfig: {
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  },
};
config.resolver = {
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

// Enable tree shaking and minification
config.transformer.optimize = true;

// --- resolve workaround for react-async-hook package ---
const path = require('path');

// extraNodeModules ensures metro treats imports as pointing to a concrete file
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-async-hook': path.resolve(__dirname, 'node_modules/react-async-hook/dist/index.js'),
};

// override resolveRequest to bypass the broken "module" field
const originalResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-async-hook') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react-async-hook/dist/index.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolve) {
    return originalResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
