// scripts/build-test.js

const { execSync } = require("child_process");
const path = require("path");

console.log("\n=== SnapDock Test Build (build-test.js) ===\n");

try {
  // 1. Inject metadata
  const injector = path.join(__dirname, "inject-metadata.js");
  console.log("→ Injecting metadata (stage=test, channel=test)...");
  execSync(`node "${injector}" --stage=test --channel=test`, {
    stdio: "inherit"
  });

  // 2. Bundle renderer
  const bundler = path.join(__dirname, "bundle.js");
  console.log("\n→ Bundling renderer (esbuild)...");
  execSync(`node "${bundler}"`, {
    stdio: "inherit"
  });

  // 3. Run electron-builder in packaged mode
  console.log("\n→ Running electron-builder (packaged test build)...");
  execSync(`npx electron-builder --win nsis`, {
    stdio: "inherit"
  });

  console.log("\n✔ Test build complete.\n");
} catch (err) {
  console.error("\n✖ Test build failed.\n");
  console.error(err.message);
  process.exit(1);
}
