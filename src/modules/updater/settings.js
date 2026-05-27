// updateChannel
// 
// lastInstalledVersion
// 
// lastInstallerPath

const { app } = require("electron");
const fs = require("fs");
const path = require("path");

let cache = null;

const SETTINGS_FILE = path.join(app.getPath("userData"), "settings.json");

// Default updater settings
const DEFAULTS = {
  updateChannel: "stable",        // "stable" | "prerelease"
  lastInstalledVersion: null      // e.g. "3.1.0"
};

// -----------------------------
// Load settings from disk
// -----------------------------
function loadSettings() {
  if (cache) return cache;

  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      cache = { updater: { ...DEFAULTS } };
      saveSettings(cache);
      return cache;
    }

    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw);

    // Ensure updater section exists
    if (!parsed.updater) parsed.updater = { ...DEFAULTS };

    // Merge defaults with existing values
    cache = {
      updater: {
        ...DEFAULTS,
        ...parsed.updater
      }
    };

    return cache;

  } catch (err) {
    console.warn("[updater] Failed to load settings, using defaults.", err);
    cache = { updater: { ...DEFAULTS } };
    return cache;
  }
}

// -----------------------------
// Save settings to disk
// -----------------------------
function saveSettings(data) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Atomic write: write temp → rename
    const tmp = SETTINGS_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tmp, SETTINGS_FILE);

  } catch (err) {
    console.error("[updater] Failed to save settings:", err);
  }
}

// -----------------------------
// Public API
// -----------------------------
function getSettings() {
  return loadSettings().updater;
}

function setUpdateChannel(channel) {
  if (!["stable", "prerelease"].includes(channel)) {
    console.warn(`[updater] Invalid updateChannel: ${channel}`);
    return;
  }

  const settings = loadSettings();
  settings.updater.updateChannel = channel;
  saveSettings(settings);
}

function setLastInstalledVersion(version) {
  const settings = loadSettings();
  settings.updater.lastInstalledVersion = version || null;
  saveSettings(settings);
}

module.exports = {
  getSettings,
  setUpdateChannel,
  setLastInstalledVersion
};
