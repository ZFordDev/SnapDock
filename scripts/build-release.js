// scripts/build-release.js

const { execSync } = require("child_process");
const path = require("path");
const platform = require("./helpers/platform");

console.log("\n=== SnapDock Release Wrapper (build-release.js) ===\n");

if (platform.isCI()) {
  console.log("Running in CI mode...");
}

// Forward all args after this script
const extraArgs = process.argv.slice(2).join(" ");

try {
  if (platform.isWindows()) {
    console.log("→ Detected Windows. Delegating to build-win.js...");
    execSync(`npm run build:win -- ${extraArgs}`, { stdio: "inherit" });
  } else if (platform.isLinux()) {
    console.log("→ Detected Linux. Delegating to build-linux.js...");
    execSync(`npm run build:linux -- ${extraArgs}`, { stdio: "inherit" });
  } else {
    console.error("✖ Unsupported platform for release builds.");
    process.exit(1);
  }

  console.log("\n✔ Release build complete.\n");
} catch (err) {
  console.error("\n✖ Release build failed.\n");
  console.error(err.message);
  process.exit(1);
}
