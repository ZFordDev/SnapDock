// scripts/build-release.js

const { execSync } = require("child_process");
const path = require("path");

console.log("\n=== SnapDock Release Build (build-release.js) ===\n");

try {
  // 1. Inject metadata (stable channel)
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

  // 3. Run electron-builder with publish enabled
  console.log("\n→ Running electron-builder (release build + publish)...");
  execSync(`npx electron-builder --win nsis --publish always`, {
    stdio: "inherit"
  });

  console.log("\n✔ Release build complete and published.\n");
} catch (err) {
  console.error("\n✖ Release build failed.\n");
  console.error(err.message);
  process.exit(1);
}
