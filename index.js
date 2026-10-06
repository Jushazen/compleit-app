/**
 * @format
 */

// Registered with plain AppRegistry (not expo's registerRootComponent) so the
// app runs both under Expo and via `react-native run-android`, where Expo's
// native modules are not linked. "main" matches MainActivity and Expo's default.
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('main', () => App);
