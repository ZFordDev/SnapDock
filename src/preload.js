const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const MarkdownIt = require("markdown-it");
const md = new MarkdownIt();

function resolveLocalAttachment(documentPath, attachmentPath) {
  if (!documentPath || !attachmentPath) return attachmentPath;

  const isRelativePath =
    !path.isAbsolute(attachmentPath) &&
    !/^(?:[a-z][a-z\d+.-]*:|\/\/|[\\/])/i.test(attachmentPath);

  if (!isRelativePath) return attachmentPath;

  return pathToFileURL(
    path.resolve(path.dirname(documentPath), attachmentPath)
  ).href;
}

// -----------------------------
// Markdown renderer
// -----------------------------
contextBridge.exposeInMainWorld("markdown", {
  render: (text) => md.render(text),
});

// -----------------------------
// Electron API
// -----------------------------
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  openFile: () => ipcRenderer.invoke("open-file"),
  openFolder: () => ipcRenderer.invoke("open-folder"),
  listFiles: (path) => ipcRenderer.invoke("list-files", path),
  openRecentFile: (path) => ipcRenderer.invoke("open-recent-file", path),
  saveFile: (path, content) =>
    ipcRenderer.invoke("save-file", path, content),
  confirmTabClose: (title) =>
    ipcRenderer.invoke("confirm-tab-close", title),
  openFileByPath: (path) =>
    ipcRenderer.invoke("open-file-by-path", path),
  resolveLocalAttachment,

  // Workspace watcher
  onWorkspaceUpdated: (callback) =>
    ipcRenderer.on("workspace-updated", () => callback()),

  // PDF export
  exportToPDF: (html) =>
    ipcRenderer.invoke("export-pdf", html),

  // Help modal
  openHelp: () =>
    ipcRenderer.invoke("dialog:openHelp"),

  // Version info
  getVersion: () =>
    ipcRenderer.invoke("get-version"),

  // -----------------------------
  // Update system
  // -----------------------------
  getInstallSource: () =>
    ipcRenderer.invoke("update:source"),   // NEW

  checkForUpdates: () =>
    ipcRenderer.invoke("update:check"),

  downloadUpdate: () =>
    ipcRenderer.invoke("update:download"),

  installUpdate: () =>
    ipcRenderer.invoke("update:install"),

  onUpdateAvailable: (callback) =>
    ipcRenderer.on("update:available", (_, info) => callback(info)),

  onUpdateNone: (callback) =>
    ipcRenderer.on("update:none", () => callback()),

  onUpdateProgress: (callback) =>
    ipcRenderer.on("update:progress", (_, progress) =>
      callback(progress)
    ),

  onUpdateReady: (callback) =>
    ipcRenderer.on("update:ready", (_, info) => callback(info)),

  onUpdateError: (callback) =>
    ipcRenderer.on("update:error", (_, err) => callback(err)),
});


// -----------------------------
// Window controls (frameless)
// -----------------------------
contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.send("window:minimize"),
  toggleMaximize: () => ipcRenderer.send("window:toggle-maximize"),
  close: () => ipcRenderer.send("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  onMaximizeChange: (cb) => ipcRenderer.on("window:is-maximized", (_, val) => cb(val)),
});

// -----------------------------
// Workspace dirty-state API
// -----------------------------
contextBridge.exposeInMainWorld("workspaceAPI", {
  onDirtyStateRequest: (callback) =>
    ipcRenderer.on("workspace:isDirty:request", () => callback()),

  sendDirtyState: (isDirty) =>
    ipcRenderer.send("workspace:isDirty:response", isDirty),
    
  onSaveAllForCloseRequest: (callback) =>
    ipcRenderer.on("workspace:save-all-for-close:request", () => callback()),

  sendSaveAllForCloseResult: (result) =>
    ipcRenderer.send("workspace:save-all-for-close:result", result),
});
