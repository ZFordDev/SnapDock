const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const pkg = require("./package.json");

// Import updater module
const setupUpdater = require("./src/modules/update");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "src", "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");

  // initialize the updater
  setupUpdater(mainWindow);
}

app.whenReady().then(createWindow);

// File + Folder Dialog Handlers

ipcMain.handle("dialog:openFile", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });

  if (canceled || filePaths.length === 0) return null;

  const filePath = filePaths[0];
  const content = fs.readFileSync(filePath, "utf-8");
  return { content, filePath };
});

ipcMain.handle("dialog:openFolder", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

ipcMain.handle("dialog:saveFile", async (event, content) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });

  if (canceled || !filePath) return false;

  fs.writeFileSync(filePath, content, "utf-8");
  return true;
});

ipcMain.handle("dialog:openRecentFile", async (event, filePath) => {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error("Failed to open recent file:", err);
    return null;
  }
});

ipcMain.handle("dialog:openHelp", async () => {
  try {
    const helpPath = path.join(__dirname, "assets", "resources", "docs", "user_guide.md");
    return fs.readFileSync(helpPath, "utf-8");
  } catch (err) {
    console.error("Failed to load help doc:", err);
    return "# Help file not found";
  }
});

ipcMain.handle("dialog:listFiles", async (event, dirPath) => {
  if (!dirPath || typeof dirPath !== "string") {
    console.error("listFiles called without a valid directory path");
    return [];
  }

  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    return files.map(f => ({
      name: f.name,
      type: f.isDirectory() ? "folder" : "file",
      fullPath: path.join(dirPath, f.name),
    }));
  } catch (err) {
    console.error("Failed to list files:", err);
    return [];
  }
});

// Version Info

ipcMain.handle("dialog:getVersion", async () => {
  return {
    version: pkg.version,
    stage: pkg.buildStage,
    date: pkg.releaseDate,
  };
});