// src/modules/updater/feed.js
// stable feed
// 
// prerelease feed
// 
// switching feeds

const pkg = require("../../../package.json");
const { getInstallSource } = require("./detectSource");
const { getSettings } = require("./settings");

// Base GitHub repo URL from package.json
const BASE = pkg.homepage.replace(/\/$/, ""); // remove trailing slash

// Feed URLs
const FEEDS = {
  stable: `${BASE}/releases/latest/download/latest.yml`,
  prerelease: `${BASE}/releases/download/prerelease/latest.yml`
};

// -----------------------------
// Determine which feed to use
// -----------------------------
function getFeedURL() {
  const source = getInstallSource();
  const settings = getSettings();

  // Store installs must NOT use custom feeds
  if (source === "windows-store" || source === "snap-store") {
    return null; // updater disabled
  }

  // Direct installs → choose feed based on channel
  return settings.updateChannel === "prerelease"
    ? FEEDS.prerelease
    : FEEDS.stable;
}

// -----------------------------
// Determine if updates are allowed
// -----------------------------
function updatesAllowed() {
  const source = getInstallSource();
  return source === "direct"; // only direct installs can update
}

// -----------------------------
// Determine if prerelease is allowed
// -----------------------------
function prereleaseAllowed() {
  const source = getInstallSource();
  return source === "direct"; // store installs cannot opt-in
}

module.exports = {
  getFeedURL,
  updatesAllowed,
  prereleaseAllowed
};
