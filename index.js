/**
 * @format
 */

// Registered with plain AppRegistry (not expo's registerRootComponent) so the
// same entry works under Expo CLI and the React Native CLI (`react-native
// start` / `run-android`). Expo modules are linked natively via
// MainApplication. "main" matches MainActivity and Expo's default.
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('main', () => App);
