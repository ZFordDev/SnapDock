// scripts/build-win.js

const { execSync } = require("child_process");
const path = require("path");
const platform = require("./helpers/platform");

console.log("\n=== SnapDock Windows Build (build-win.js) ===\n");

if (platform.isCI()) {
  console.log("Running in CI mode...");
}

// Detect store build flag
const isStore = process.argv.includes("--release");
const installSource = isStore ? "windows-store" : "direct";

try {
  // 1. Inject metadata
  const injector = path.join(__dirname, "inject-metadata.js");
  console.log(
    `→ Injecting metadata (stage=release, channel=stable, installSource=${installSource})...`
  );

  execSync(
    `node "${injector}" --stage=release --channel=stable --installSource=${installSource}`,
    { stdio: "inherit" }
  );

  // 2. Bundle renderer
  const bundler = path.join(__dirname, "bundle.js");
  console.log("\n→ Bundling renderer (esbuild)...");
  execSync(`node "${bundler}"`, { stdio: "inherit" });

  // 3. Build Windows NSIS installer
  console.log("\n→ Running electron-builder (Windows NSIS)...");
  execSync(`npx electron-builder --win nsis --publish never`, { stdio: "inherit" });

  console.log("\n✔ Windows build complete.\n");
} catch (err) {
  console.error("\n✖ Windows build failed.\n");
  console.error(err.message);
  process.exit(1);
}
