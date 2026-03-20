module.exports = function (api) {
  api.cache(true);

  // Load and modify the nativewind preset function
  const nativewindPreset = require("nativewind/babel");
  const nativewindConfig = nativewindPreset(api);

  // Filter out the missing worklets plugin from the results
  if (nativewindConfig.plugins) {
    nativewindConfig.plugins = nativewindConfig.plugins.filter(
      (plugin) => plugin !== "react-native-worklets/plugin"
    );
  }

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      nativewindConfig,
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};
