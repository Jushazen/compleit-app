This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

#### Without Expo

If the Expo CLI can't be used, build and run with the plain React Native CLI instead:

```sh
# Terminal 1: start Metro
npm run start-rn

# Terminal 2: build, install and launch on the emulator/device
npm run run-android
```

If everything is set up correctly, you should see your new app running in the Android Emulator or your connected device.

This is one way to run your app — you can also build it directly from Android Studio.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Release build (Google Play)

Release bundles are signed with your private **upload key**, never the debug key. If the key is not configured, `npm run build:release` fails with a message pointing here.

1. Create the upload key once, **outside the repository** (for example in a password manager vault or an encrypted folder):

   ```sh
   keytool -genkeypair -v -storetype PKCS12 -keystore compleit-upload.keystore -alias compleit-upload -keyalg RSA -keysize 2048 -validity 10000
   ```

   Back up the keystore and its passwords. If you lose them you cannot update the app, unless Play App Signing resets the upload key through Google Play support. Enable **Play App Signing** when you create the app in the Play Console.

2. Give Gradle the credentials, either with environment variables (these win) ...

   ```sh
   # PowerShell: $env:COMPLEIT_UPLOAD_STORE_FILE = 'C:\keys\compleit-upload.keystore'
   export COMPLEIT_UPLOAD_STORE_FILE=/path/to/compleit-upload.keystore
   export COMPLEIT_UPLOAD_STORE_PASSWORD=...
   export COMPLEIT_UPLOAD_KEY_ALIAS=compleit-upload
   export COMPLEIT_UPLOAD_KEY_PASSWORD=...
   ```

   ... or with a git-ignored `android/keystore.properties` (`storeFile` may be absolute or relative to `android/`):

   ```properties
   storeFile=C:/keys/compleit-upload.keystore
   storePassword=...
   keyAlias=compleit-upload
   keyPassword=...
   ```

   Never commit the keystore or these passwords.

3. Build the bundle:

   ```sh
   npm run build:release
   ```

   The signed bundle is `android/app/build/outputs/bundle/release/app-release.aab`. Upload it in the Play Console.

4. For every upload, increase `versionCode` (and update `versionName`) in `android/app/build.gradle`; Play rejects a `versionCode` it has already seen.

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
