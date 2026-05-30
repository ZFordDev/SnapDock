// src/modules/updater/download.js
// downloading installer
// 
// storing last installer path

const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

const { getFeedURL, updatesAllowed } = require("./feed");
const { setLastInstalledVersion } = require("./settings");
const { isNewerVersion } = require("./versionCompare");

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

// We control downloads manually
autoUpdater.autoDownload = false;

// -----------------------------
// Initialize updater feed
// -----------------------------
function configureFeed() {
  const feed = getFeedURL();

  if (!updatesAllowed() || !feed) {
    log.info("[updater] Updates disabled for this install source.");
    return false;
  }

  try {
    autoUpdater.setFeedURL({ url: feed });
    log.info("[updater] Feed URL set:", feed);
    return true;
  } catch (err) {
    log.error("[updater] Failed to set feed URL:", err);
    return false;
  }
}

// -----------------------------
// Check for updates
// -----------------------------
async function checkForUpdates() {
  if (!configureFeed()) {
    return { error: "Updates not allowed for this install source." };
  }

  try {
    const result = await autoUpdater.checkForUpdates();

    const latest = result?.updateInfo?.version;
    const current = autoUpdater.currentVersion.version;

    return {
      updateAvailable: latest && isNewerVersion(latest, current),
      latestVersion: latest,
      currentVersion: current
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
    return { status: "downloading" };
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
// Event wiring
// (index.js will forward these via IPC)
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
  autoUpdater.on("update-downloaded", info => {
    // Store rollback version
    const previous = autoUpdater.currentVersion.version;
    setLastInstalledVersion(previous);

    cb(info);
  });
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
