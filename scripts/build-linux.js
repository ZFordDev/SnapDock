// scripts/build-linux.js

const { execSync } = require("child_process");
const path = require("path");
const platform = require("./helpers/platform");

console.log("\n=== SnapDock Linux Build (build-linux.js) ===\n");

if (platform.isWSL()) {
  console.warn("⚠ WSL detected — AppImage builds may fail on NTFS mounts.");
}

// Detect store build flag
const isStore = process.argv.includes("--release");
const installSource = isStore ? "snap-store" : "direct";

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

  // 3. Build Linux artifacts
  console.log("\n→ Running electron-builder (Linux targets)...");

  // AppImage + deb are the safest defaults
  execSync(`npx electron-builder --linux AppImage deb --publish never`, {
    stdio: "inherit"
  });

  console.log("\n✔ Linux build complete.\n");
} catch (err) {
  console.error("\n✖ Linux build failed.\n");
  console.error(err.message);
  process.exit(1);
}
