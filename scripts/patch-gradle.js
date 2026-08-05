const fs = require("fs");
const path = require("path");

const files = [
  "android/build.gradle",
  "android/capacitor-cordova-android-plugins/build.gradle",
  "node_modules/@capacitor/android/capacitor/build.gradle",
];

for (const file of files) {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) continue;

  const current = fs.readFileSync(fullPath, "utf8");
  const next = current.replace(/com\.android\.tools\.build:gradle:8\.\d+\.\d+/g, "com.android.tools.build:gradle:8.4.1");

  if (next !== current) {
    fs.writeFileSync(fullPath, next, "utf8");
    console.log(`Patched ${file}`);
  }
}
