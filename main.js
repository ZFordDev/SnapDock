const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const pkg = require("./package.json");
const pdfModule = require("./src/modules/pdf/pdf.js");

// Updater
const setupUpdater = require("./src/modules/update");

let mainWindow;
let lastKnownDirtyState = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "src", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Remove all menus
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);

  // Block DevTools shortcuts
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      (input.key === "I" && input.control && input.shift) ||
      input.key === "F12"
    ) {
      event.preventDefault();
    }
  });

  // Unsaved changes / workspace dirty failsafe
  mainWindow.on("close", (event) => {
    // Ask renderer for dirty state
    mainWindow.webContents.send("workspace:isDirty:request");

    // Prevent the window from closing until we decide
    event.preventDefault();

    // Give the renderer a moment to respond
    setTimeout(() => {
      if (lastKnownDirtyState) {
        const choice = dialog.showMessageBoxSync(mainWindow, {
          type: "warning",
          buttons: ["Cancel", "Discard Changes"],
          defaultId: 0,
          cancelId: 0,
          title: "Unsaved Changes",
          message: "You have unsaved changes. Close SnapDock anyway?",
        });

        if (choice === 1) {
          // User chose "Discard Changes"
          mainWindow.destroy();
        }
      } else {
        // Clean workspace → safe to close
        mainWindow.destroy();
      }
    }, 50);
  });

  mainWindow.loadFile("index.html");
  setupUpdater(mainWindow);
}

app.whenReady().then(createWindow);

// -----------------------------
// FILE OPERATIONS
// -----------------------------

ipcMain.handle("open-file", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });

  if (canceled || filePaths.length === 0) return null;

  const filePath = filePaths[0];
  const content = fs.readFileSync(filePath, "utf-8");

  return { content, filePath };
});

ipcMain.handle("open-folder", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (canceled || filePaths.length === 0) return null;

  return filePaths[0];
});

ipcMain.handle("save-file", async (event, filePath, content, suggestedName) => {
  try {
    if (!filePath) {
      const { canceled, filePath: newFilePath } = await dialog.showSaveDialog({
        title: "Save File",
        defaultPath: suggestedName || "untitled",
      });

      if (canceled || !newFilePath) return false;

      let finalPath = newFilePath;

      // If user didn't provide any extension, add .md
      if (!path.extname(finalPath)) {
        finalPath += ".md";
      }

      fs.writeFileSync(finalPath, content, "utf-8");
      return { newFilePath: finalPath };
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to save file:", err);
    return false;
  }
});

ipcMain.handle("open-recent-file", async (event, filePath) => {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error("Failed to open recent file:", err);
    return null;
  }
});

ipcMain.handle("list-files", async (event, dirPath) => {
  if (!dirPath || typeof dirPath !== "string") {
    console.error("list-files called without valid path");
    return [];
  }

  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    return files.map((f) => ({
      name: f.name,
      type: f.isDirectory() ? "folder" : "file",
      fullPath: path.join(dirPath, f.name),
    }));
  } catch (err) {
    console.error("Failed to list files:", err);
    return [];
  }
});

ipcMain.handle("open-file-by-path", async (_, pathArg) => {
  try {
    return await fs.promises.readFile(pathArg, "utf8");
  } catch {
    return null;
  }
});

ipcMain.handle("confirm-tab-close", async (event, title) => {
  const choice = await dialog.showMessageBox({
    type: "warning",
    buttons: ["Cancel", "Discard Changes"],
    defaultId: 0,
    cancelId: 0,
    title: "Unsaved Changes",
    message: `"${title}" has unsaved changes. Close anyway?`,
  });

  return choice.response === 1;
});

// -----------------------------
// HELP DOCUMENT
// -----------------------------

ipcMain.handle("dialog:openHelp", async () => {
  try {
    const helpPath = path.join(
      __dirname,
      "assets",
      "resources",
      "docs",
      "user_guide.md",
    );
    return fs.readFileSync(helpPath, "utf-8");
  } catch (err) {
    console.error("Failed to load help doc:", err);
    return "# Help file not found";
  }
});

// -----------------------------
// VERSION INFO
// -----------------------------

ipcMain.handle("get-version", async () => {
  return {
    version: pkg.version,
    stage: pkg.buildStage,
    date: pkg.releaseDate,
  };
});

// -----------------------------
// PDF EXPORT
// -----------------------------

ipcMain.handle("export-pdf", (event, htmlContent) => {
  pdfModule.exportCurrentMarkdown(htmlContent);
});

// -----------------------------
// WORKSPACE DIRTY STATE IPC
// -----------------------------

ipcMain.on("workspace:isDirty:response", (event, isDirty) => {
  lastKnownDirtyState = isDirty;
});
