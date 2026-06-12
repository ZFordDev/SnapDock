// scripts/build-linux.js

const { execSync } = require("child_process");
const path = require("path");

console.log("\n=== SnapDock Linux Build (build-linux.js) ===\n");

try {
  // 1. Inject metadata (Linux release channel)
  const injector = path.join(__dirname, "inject-metadata.js");
  console.log("→ Injecting metadata (stage=release, channel=stable)...");
  execSync(`node "${injector}" --stage=release --channel=stable`, {
    stdio: "inherit"
  });

  // 2. Bundle renderer
  const bundler = path.join(__dirname, "bundle.js");
  console.log("\n→ Bundling renderer (esbuild)...");
  execSync(`node "${bundler}"`, {
    stdio: "inherit"
  });

  // 3. Run electron-builder for Linux targets
  console.log("\n→ Running electron-builder (Linux targets)...");

  // AppImage + deb are the safest defaults
  execSync(`npx electron-builder --linux AppImage deb`, {
    stdio: "inherit"
  });

  console.log("\n✔ Linux build complete.\n");
} catch (err) {
  console.error("\n✖ Linux build failed.\n");
  console.error(err.message);
  process.exit(1);
}
