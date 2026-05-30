// src/modules/updater/index.js
// Orchestrates updater modules, IPC, and event forwarding

const { ipcMain } = require("electron");

const {
  checkForUpdates,
  downloadUpdate,
  installUpdate
} = require("./download");

const { setupUpdateEvents } = require("./events");
const { rollbackAllowed, runRollback } = require("./rollback");
const { prereleaseAllowed } = require("./feed");
const { getSettings, setUpdateChannel } = require("./settings");

// -----------------------------
// Initialize updater system
// -----------------------------
function setupUpdater(mainWindow) {

  // Forward autoUpdater events to renderer
  setupUpdateEvents(mainWindow);

  // -----------------------------
  // IPC: Check for updates
  // -----------------------------
  ipcMain.handle("update:check", async () => {
    return await checkForUpdates();
  });

  // -----------------------------
  // IPC: Download update
  // -----------------------------
  ipcMain.handle("update:download", async () => {
    return await downloadUpdate();
  });

  // -----------------------------
  // IPC: Install update
  // -----------------------------
  ipcMain.handle("update:install", () => {
    installUpdate();
  });

  // -----------------------------
  // IPC: Rollback
  // -----------------------------
  ipcMain.handle("update:rollback", async () => {
    if (!rollbackAllowed()) {
      return { error: "Rollback not allowed for this install source." };
    }
    return await runRollback();
  });

  // -----------------------------
  // IPC: Get updater settings
  // -----------------------------
  ipcMain.handle("update:getSettings", () => {
    return {
      ...getSettings(),
      prereleaseAllowed: prereleaseAllowed(),
      rollbackAllowed: rollbackAllowed()
    };
  });

  // -----------------------------
  // IPC: Set update channel
  // -----------------------------
  ipcMain.handle("update:setChannel", (event, channel) => {
    if (!prereleaseAllowed() && channel === "prerelease") {
      return { error: "Prerelease channel not allowed for this install source." };
    }

    setUpdateChannel(channel);
    return { status: "ok" };
  });
}

module.exports = { setupUpdater };
