// Builds the signed Play bundle (android/app/build/outputs/bundle/release/app-release.aab).
// Runs the platform's Gradle wrapper by absolute path, so it also works where
// cmd.exe does not search the current directory, and shows Gradle's output
// (including the "Release signing is not configured" hint) unfiltered.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const androidDir = path.resolve(__dirname, '..', 'android');
const isWindows = process.platform === 'win32';
const wrapper = path.join(androidDir, isWindows ? 'gradlew.bat' : 'gradlew');

// .bat files need a shell on Windows; quote the path in case it contains spaces.
const result = spawnSync(
  isWindows ? `"${wrapper}"` : wrapper,
  ['bundleRelease'],
  {
    cwd: androidDir,
    stdio: 'inherit',
    shell: isWindows,
  },
);
process.exit(result.status ?? 1);
