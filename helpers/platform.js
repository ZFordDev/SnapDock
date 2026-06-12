// helpers/platform.js

const os = require("os");

//
// -----------------------------
// PLATFORM DETECTION
// -----------------------------
//

function isWindows() {
  return process.platform === "win32";
}

function isLinux() {
  return process.platform === "linux";
}

function isMac() {
  return process.platform === "darwin";
}

//
// -----------------------------
// ENVIRONMENT DETECTION
// -----------------------------
//

// GitHub Actions / CI
function isCI() {
  return Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
}

// Snap sandbox detection
function isSnap() {
  return Boolean(process.env.SNAP || process.env.SNAP_NAME);
}

// WSL detection (useful for build scripts)
function isWSL() {
  return os.release().toLowerCase().includes("microsoft");
}

//
// -----------------------------
// ARCHITECTURE
// -----------------------------
//

function arch() {
  return process.arch; // x64, arm64, etc.
}

//
// -----------------------------
// EXPORT API
// -----------------------------
//

module.exports = {
  isWindows,
  isLinux,
  isMac,
  isCI,
  isSnap,
  isWSL,
  arch,
};
