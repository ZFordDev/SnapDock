const { contextBridge, ipcRenderer } = require("electron");
const MarkdownIt = require("markdown-it");
const md = new MarkdownIt();

// Expose markdown renderer
contextBridge.exposeInMainWorld("markdown", {
    render: (text) => md.render(text)
});

// Expose Electron API
contextBridge.exposeInMainWorld("electronAPI", {
    // File operations
    openFile: () => ipcRenderer.invoke("dialog:openFile"),
    openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
    saveFile: (content) => ipcRenderer.invoke("dialog:saveFile", content),
    openRecentFile: (filePath) => ipcRenderer.invoke("dialog:openRecentFile", filePath),
    openHelp: () => ipcRenderer.invoke("dialog:openHelp"),
    listFiles: (dirPath) => ipcRenderer.invoke("dialog:listFiles", dirPath),

    // PDF export
    exportToPDF: (htmlContent) => {
        console.log("preload: exportToPDF called");
        ipcRenderer.send("export-pdf", htmlContent);
    },

    // Version info
    getVersion: () => ipcRenderer.invoke("dialog:getVersion"),

    // Update system
    checkForUpdates: () => ipcRenderer.invoke("update:check"),
    downloadUpdate: () => ipcRenderer.invoke("update:download"),
    installUpdate: () => ipcRenderer.invoke("update:install"),

    onUpdateAvailable: (callback) => ipcRenderer.on("update:available", (_, info) => callback(info)),
    onUpdateNone: (callback) => ipcRenderer.on("update:none", () => callback()),
    onUpdateProgress: (callback) => ipcRenderer.on("update:progress", (_, progress) => callback(progress)),
    onUpdateReady: (callback) => ipcRenderer.on("update:ready", (_, info) => callback(info)),
    onUpdateError: (callback) => ipcRenderer.on("update:error", (_, err) => callback(err)),

});
