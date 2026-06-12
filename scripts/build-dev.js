// scripts/build-dev.js

const { execSync } = require("child_process");
const path = require("path");

console.log("\n=== SnapDock Dev Build (build-dev.js) ===\n");

try {
  // 1. Inject metadata
  const injector = path.join(__dirname, "inject-metadata.js");
  console.log("→ Injecting metadata...");
  execSync(`node "${injector}" --stage=dev --channel=dev`, {
    stdio: "inherit"
  });

  // 2. Bundle renderer code
  const bundler = path.join(__dirname, "bundle.js");
  console.log("\n→ Bundling renderer (esbuild)...");
  execSync(`node "${bundler}"`, {
    stdio: "inherit"
  });

  // 3. Run electron-builder in dev mode
  console.log("\n→ Running electron-builder (dir mode)...");
  execSync(`npx electron-builder --dir`, {
    stdio: "inherit"
  });

  console.log("\n✔ Dev build complete.\n");
} catch (err) {
  console.error("\n✖ Dev build failed.\n");
  console.error(err.message);
  process.exit(1);
}
