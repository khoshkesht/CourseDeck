const fs = require("fs");
const path = require("path");

const root = process.cwd();
const outputDir = path.join(root, "www");
const androidPublicDir = path.join(root, "android", "app", "src", "main", "assets", "public");
const entries = [
  "index.html",
  "styles.css",
  "app.js",
  "course.json",
  "assets",
];
const excludedFiles = new Set([
  path.normalize("assets/branding/app-icon-ff3a-1024.png"),
]);

function removeDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyEntry(source, destination) {
  const relativeSource = path.relative(root, source);
  if (excludedFiles.has(path.normalize(relativeSource))) return;

  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const child of fs.readdirSync(source)) {
      copyEntry(path.join(source, child), path.join(destination, child));
    }
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

removeDirectory(outputDir);
fs.mkdirSync(outputDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(root, entry);
  if (fs.existsSync(source)) {
    copyEntry(source, path.join(outputDir, entry));
  }
}

console.log(`Prepared Capacitor web assets in ${outputDir}`);

removeDirectory(androidPublicDir);
fs.mkdirSync(androidPublicDir, { recursive: true });
for (const child of fs.readdirSync(outputDir)) {
  copyEntry(path.join(outputDir, child), path.join(androidPublicDir, child));
}
removeDirectory(outputDir);

console.log(`Prepared Android web assets in ${androidPublicDir}`);
