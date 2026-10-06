/**
 * React Native CLI configuration.
 *
 * The bare Android project does not set up Expo modules (no `useExpoModules`
 * in settings.gradle), and the app never loads Expo's native runtime: index.js
 * registers the root component with plain AppRegistry. Expo's own
 * react-native.config.js is meant to skip autolinking in that case, but it
 * mis-detects this project as managed, so the CLI links `:expo` and the Gradle
 * build fails ("Plugin with id 'expo-module-gradle-plugin' not found").
 * Disable it explicitly for Android.
 */
module.exports = {
  dependencies: {
    expo: {
      platforms: {
        android: null,
      },
    },
  },
};
