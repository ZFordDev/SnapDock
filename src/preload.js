const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  saveFile: (content) => ipcRenderer.invoke("dialog:saveFile", content),
  openRecentFile: (filePath) => ipcRenderer.invoke("dialog:openRecentFile", filePath),
  openHelp: () => ipcRenderer.invoke("dialog:openHelp"),
  listFiles: (dirPath) => ipcRenderer.invoke("dialog:listFiles", dirPath),

  // Version info
  getVersion: () => ipcRenderer.invoke("dialog:getVersion"),

  // Update System (NEW)

  // Ask to check for updates
  checkForUpdates: () => ipcRenderer.invoke("update:check"),

  // Ask to download the update
  downloadUpdate: () => ipcRenderer.invoke("update:download"),

  // Ask to install the update
  installUpdate: () => ipcRenderer.invoke("update:install"),

  // Event listeners 
  onUpdateAvailable: (callback) => ipcRenderer.on("update:available", (_, info) => callback(info)),
  onUpdateNone: (callback) => ipcRenderer.on("update:none", () => callback()),
  onUpdateProgress: (callback) => ipcRenderer.on("update:progress", (_, progress) => callback(progress)),
  onUpdateReady: (callback) => ipcRenderer.on("update:ready", (_, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on("update:error", (_, err) => callback(err)),
});