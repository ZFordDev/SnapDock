const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const chokidar = require("chokidar");
const fs = require("fs");
const path = require("path");
const pkg = require("./package.json");
const pdfModule = require("./src/modules/pdf/pdf.js");

/* Metadata loading with fallback:
- During development, we read directly from package.json for simplicity.
- For production builds, we attempt to load build/metadata.json which includes additional build info.
- If metadata.json is missing or fails to load, we fallback to package.json to ensure version info is always available.
*/
function loadMetadata() {
  const metaPath = path.join(__dirname, "build", "metadata.json");

  try {
    if (fs.existsSync(metaPath)) {
      return require(metaPath);
    }
  } catch (_) {}

  // fallback for safety
  return require("./package.json");
}

// Load metadata once at startup
const metadata = loadMetadata();

// Prime install source for updater (critical)
const { getInstallSource } = require("./src/modules/updater/detectSource");
getInstallSource(metadata.installSource);

// Updater
const setupUpdater = require("./src/modules/updater/index.js");

// Disable sandbox only for AppImage builds
if (process.env.APPIMAGE) {
  app.commandLine.appendSwitch("no-sandbox");
}

let workspaceWatcher = null;
let currentWorkspacePath = null;
let mainWindow;
let lastKnownDirtyState = false;
let forceClose = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "src", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true, // enables right click window
    },
    // Use a frameless window so we can render a custom SnapDock titlebar
    frame: false,
    // On macOS we can hint to hide the native title bar inset
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
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
  // NEW: right click window
  const { Menu } = require("electron");

  mainWindow.webContents.on("context-menu", (_event, params) => {
    // Only show menu for editable elements (textarea, input)
    if (!params.isEditable) return;

    const menu = Menu.buildFromTemplate([
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { type: "separator" },
      { role: "selectAll" },
    ]);

    menu.popup({ window: mainWindow });
  });

  // Unsaved changes / workspace dirty failsafe
  mainWindow.on("close", (event) => {

    if (forceClose) return;
    // Ask renderer for dirty state
    mainWindow.webContents.send("workspace:isDirty:request");

    // Prevent the window from closing until we decide
    event.preventDefault();

    // Give the renderer a moment to respond
    setTimeout(() => {
      if (lastKnownDirtyState) {
        const choice = dialog.showMessageBoxSync(mainWindow, {
          type: "warning",
          buttons: ["Cancel", "Save All", "Discard Changes"],
          defaultId: 0,
          cancelId: 0,
          title: "Unsaved Changes",
          message: "You have unsaved changes. Close SnapDock anyway?",
        });

        if (choice === 1) {
          // User chose "Save All"
          const onResult = (_event, result) => {
            if (result?.ok) {
              forceClose = true;
              mainWindow.close();
            } else {
              dialog.showMessageBox(mainWindow, {
                type: "error",
                buttons: ["OK"],
                defaultId: 0,
                title: "Save All Failed",
                message: "Some tabs could not be saved. SnapDock will remain open.",
              });
            }
          };

          ipcMain.once("workspace:save-all-for-close:result", onResult);
          mainWindow.webContents.send("workspace:save-all-for-close:request");
          return;
        }

        if (choice === 2) {
          // User chose "Discard Changes"
          forceClose = true;
          mainWindow.close();
        }

        // choice === 0 (Cancel): do nothing, keep app open
      } else {
        // Clean workspace -> safe to close
        forceClose = true;
        mainWindow.close();
      }
    }, 50);
  });
  setupUpdater(mainWindow);
  mainWindow.loadFile("index.html");

  
  // Forward maximize/unmaximize events to renderer so UI can update
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window:is-maximized", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window:is-maximized", false);
  });
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
    const workspacePath = filePaths[0];

    // Close previous watcher if exists
    if (workspaceWatcher) {
      workspaceWatcher.close();
    }

    currentWorkspacePath = workspacePath;

    workspaceWatcher = chokidar.watch(workspacePath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
    });

    let ready = false;
    let refreshTimeout = null;

    workspaceWatcher
      .on("ready", () => {
        ready = true;
      })
      .on("all", () => {
        if (!ready) return; // ignore initial scan events

        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          if (mainWindow) {
            mainWindow.webContents.send("workspace-updated");
          }
        }, 100); // debounce to avoid double-refresh on Windows
      });

    return workspacePath;
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
  const info = loadMetadata();

  return {
    version: info.version,
    stage: info.buildStage,
    date: info.releaseDate,
    installSource: info.installSource,   // the new meta that allows updater to know stores vs direct not needed here but might as well provide it for future use
    channel: info.channel,               // for future use
    platform: info.platform              // not yet needed in renderer but might as well provide it for future use
  };
});


  // -----------------------------
  // WINDOW CONTROLS (frameless)
  // -----------------------------

  ipcMain.on("window:minimize", () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on("window:toggle-maximize", () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
    // send current state
    mainWindow.webContents.send("window:is-maximized", mainWindow.isMaximized());
  });

  ipcMain.on("window:close", () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle("window:isMaximized", () => {
    return mainWindow ? mainWindow.isMaximized() : false;
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
