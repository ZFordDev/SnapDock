// src/modules/updater/index.js
const { ipcMain } = require("electron");
const { getInstallSource } = require("./detectSource");
const updater = require("./download");

module.exports = function setupUpdater(mainWindow) {

  const source = getInstallSource();
  const updatesAllowed = source === "direct";

  // ---------------------------------
  // Always expose install source to UI
  // ---------------------------------
  ipcMain.handle("update:source", () => {
    return source;
  });

  // -----------------------------
  // Store builds → disable updater
  // -----------------------------
  if (!updatesAllowed) {
    console.log(`[updater] Disabled for install source: ${source}`);

    ipcMain.handle("update:check", () => ({
      updateAvailable: false,
      latestVersion: null,
      currentVersion: null,
      disabled: true,
      reason: source
    }));

    ipcMain.handle("update:download", () => ({
      error: "Updates disabled for this install source."
    }));

    ipcMain.handle("update:install", () => ({
      error: "Updates disabled for this install source."
    }));

    return; // Do NOT wire autoUpdater events
  }

  // -----------------------------
  // IPC handlers for direct installs
  // -----------------------------
  ipcMain.handle("update:check", () => updater.checkForUpdates());
  ipcMain.handle("update:download", () => updater.downloadUpdate());
  ipcMain.handle("update:install", () => updater.installUpdate());

  // -----------------------------
  // Forward updater events to renderer
  // -----------------------------
  updater.onUpdateAvailable(info => {
    mainWindow.webContents.send("update:available", info);
  });

  updater.onUpdateNone(() => {
    mainWindow.webContents.send("update:none");
  });

  updater.onProgress(progress => {
    mainWindow.webContents.send("update:progress", progress);
  });

  updater.onReady(info => {
    mainWindow.webContents.send("update:ready", info);
  });

  updater.onError(err => {
    mainWindow.webContents.send("update:error", err.message);
  });
};
