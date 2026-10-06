/**
 * Metro configuration
 *
 * The React Native CLI (`react-native start` / `run-android`, and Gradle's
 * release bundling) needs a config extending '@react-native/metro-config';
 * Expo's serializer is incompatible with it. Everything else (Expo CLI) keeps
 * using expo/metro-config.
 * https://docs.expo.dev/guides/customizing-metro
 * https://reactnative.dev/docs/metro
 */
const isReactNativeCli = /react-native[\\/]cli\.js$/.test(
  process.argv[1] ?? '',
);

const config = isReactNativeCli
  ? require('@react-native/metro-config').getDefaultConfig(__dirname)
  : require('expo/metro-config').getDefaultConfig(__dirname);

module.exports = config;
