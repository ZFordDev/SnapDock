// src/modules/update.js
const { autoUpdater } = require("electron-updater");
const { ipcMain } = require("electron");


autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";


autoUpdater.autoDownload = false;

module.exports = function setupUpdater(mainWindow) {


  ipcMain.handle("update:check", async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        updateAvailable: !!result.updateInfo && result.updateInfo.version !== autoUpdater.currentVersion.version,
        latestVersion: result.updateInfo.version,
        currentVersion: autoUpdater.currentVersion.version
      };
    } catch (err) {
      return { error: err.message };
    }
  });


  ipcMain.handle("update:download", async () => {
    try {
      await autoUpdater.downloadUpdate();
      return "downloading";
    } catch (err) {
      return { error: err.message };
    }
  });

 
  ipcMain.handle("update:install", () => {
    autoUpdater.quitAndInstall();
  });


  autoUpdater.on("update-available", info => {
    mainWindow.webContents.send("update:available", info);
  });

  autoUpdater.on("update-not-available", () => {
    mainWindow.webContents.send("update:none");
  });

  autoUpdater.on("download-progress", progress => {
    mainWindow.webContents.send("update:progress", progress);
  });

  autoUpdater.on("update-downloaded", info => {
    mainWindow.webContents.send("update:ready", info);
  });

  autoUpdater.on("error", err => {
    mainWindow.webContents.send("update:error", err.message);
  });
};