// src/modules/updater/download.js
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// Logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

// Manual download mode
autoUpdater.autoDownload = false;

// -----------------------------
// Check for updates
// -----------------------------
async function checkForUpdates() {
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      updateAvailable:
        !!result.updateInfo &&
        result.updateInfo.version !== autoUpdater.currentVersion.version,
      latestVersion: result.updateInfo.version,
      currentVersion: autoUpdater.currentVersion.version
    };
  } catch (err) {
    return { error: err.message };
  }
}

// -----------------------------
// Download update
// -----------------------------
async function downloadUpdate() {
  try {
    await autoUpdater.downloadUpdate();
    return "downloading";
  } catch (err) {
    return { error: err.message };
  }
}

// -----------------------------
// Install update
// -----------------------------
function installUpdate() {
  try {
    autoUpdater.quitAndInstall();
  } catch (err) {
    log.error("[updater] Failed to install update:", err);
  }
}

// -----------------------------
// Event hooks (forwarded by index.js)
// -----------------------------
function onUpdateAvailable(cb) {
  autoUpdater.on("update-available", info => cb(info));
}

function onUpdateNone(cb) {
  autoUpdater.on("update-not-available", () => cb());
}

function onProgress(cb) {
  autoUpdater.on("download-progress", progress => cb(progress));
}

function onReady(cb) {
  autoUpdater.on("update-downloaded", info => cb(info));
}

function onError(cb) {
  autoUpdater.on("error", err => cb(err));
}

module.exports = {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  onUpdateAvailable,
  onUpdateNone,
  onProgress,
  onReady,
  onError
};
