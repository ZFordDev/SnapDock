// src/modules/updater/pendingUpdate.js
//
// Persists the state of a downloaded-but-not-yet-applied update to disk
// so that it survives app restarts. Without this, a downloaded update is
// lost when the user closes SnapDock and must be re-downloaded.

const { app } = require("electron");
const fs = require("fs");
const path = require("path");
const log = require("electron-log");

const FILE_NAME = "pending-update.json";

function getFilePath() {
  return path.join(app.getPath("userData"), FILE_NAME);
}

/**
 * Write a pending update marker to disk.
 * Called after electron-updater finishes downloading an update.
 */
function savePendingUpdate({ version, currentVersion }) {
  try {
    const data = JSON.stringify({
      version,
      currentVersion,
      downloadedAt: new Date().toISOString(),
    });
    fs.writeFileSync(getFilePath(), data, "utf8");
    log.info(`[updater] Pending update saved: ${version}`);
  } catch (err) {
    log.error("[updater] Failed to save pending update:", err);
  }
}

/**
 * Read the pending update marker. Returns null if none exists or the
 * file is invalid.
 */
function getPendingUpdate() {
  try {
    const filePath = getFilePath();
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);

    if (!data || typeof data.version !== "string") return null;
    return data;
  } catch (err) {
    log.warn("[updater] Failed to read pending update:", err);
    return null;
  }
}

/**
 * Remove the pending update marker from disk.
 * Called after a successful install or when the user explicitly dismisses it.
 */
function clearPendingUpdate() {
  try {
    const filePath = getFilePath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log.info("[updater] Pending update cleared");
    }
  } catch (err) {
    log.error("[updater] Failed to clear pending update:", err);
  }
}

module.exports = { savePendingUpdate, getPendingUpdate, clearPendingUpdate };
