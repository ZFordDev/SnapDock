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

/**
 * Resolve a persisted pending update against the version we actually
 * launched with, so we can recover from interrupted/aborted installs.
 *
 * Returns one of:
 *   - { status: "applied", version }   current app version matches the pending
 *     update, so the install succeeded → marker is cleared.
 *   - { status: "ready", version }     pending update still outstanding and the
 *     app is still on the old version → update can be applied.
 *   - { status: "stale", version }     app is neither the old nor the new
 *     version (e.g. partial/aborted install left an inconsistent state) →
 *     marker is cleared and the update should be re-fetched.
 *   - null                             no pending update exists.
 *
 * @param {string} currentVersion - the version SnapDock launched with.
 */
function resolvePendingUpdate(currentVersion) {
  const pending = getPendingUpdate();
  if (!pending) return null;

  if (pending.version === currentVersion) {
    // The update we downloaded is the version we're now running → applied.
    clearPendingUpdate();
    return { status: "applied", version: pending.version };
  }

  if (pending.currentVersion === currentVersion) {
    // Still on the version the update was meant to replace → installable.
    return { status: "ready", version: pending.version, currentVersion };
  }

  // Neither target version matches — the install was interrupted/corrupted.
  clearPendingUpdate();
  log.warn(
    `[updater] Pending update ${pending.version} did not match running ` +
      `${currentVersion}; cleared stale marker`
  );
  return { status: "stale", version: pending.version, currentVersion };
}

module.exports = {
  savePendingUpdate,
  getPendingUpdate,
  clearPendingUpdate,
  resolvePendingUpdate
};
