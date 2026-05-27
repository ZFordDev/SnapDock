// src/modules/updater/events.js
// update-available
// 
// update-none
// 
// update-progress
// 
// update-ready
// 
// update-error

const {
  onUpdateAvailable,
  onUpdateNone,
  onProgress,
  onReady,
  onError
} = require("./download");

// Forward updater events to renderer via IPC
function setupUpdateEvents(mainWindow) {

  onUpdateAvailable(info => {
    mainWindow.webContents.send("update:available", info);
  });

  onUpdateNone(() => {
    mainWindow.webContents.send("update:none");
  });

  onProgress(progress => {
    mainWindow.webContents.send("update:progress", progress);
  });

  onReady(info => {
    mainWindow.webContents.send("update:ready", info);
  });

  onError(err => {
    mainWindow.webContents.send("update:error", err.message || String(err));
  });
}

module.exports = { setupUpdateEvents };
