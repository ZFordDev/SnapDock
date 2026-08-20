const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const chokidar = require("chokidar");
const fs = require("fs");
const path = require("path");
const pkg = require("./package.json");
const pdfModule = require("./src/modules/pdf/pdf.js");
const { isExternalLink } = require("./src/modules/linkNavigation.js");

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

let workspaceWatcher = null;
let currentWorkspacePath = null;
let mainWindow;
let lastKnownDirtyState = false;
let forceClose = false;
let relaunchAfterClose = false;
let spellcheckEnabled = true;
const spellcheckConfigPath = path.join(app.getPath("userData"), "spellcheck-config.json");

function loadSpellcheckState() {
  try {
    if (fs.existsSync(spellcheckConfigPath)) {
      const raw = fs.readFileSync(spellcheckConfigPath, "utf8");
      const parsed = JSON.parse(raw);
      if (typeof parsed?.enabled === "boolean") {
        return parsed.enabled;
      }
    }
  } catch (err) {
    console.warn("Failed to load spellcheck state:", err);
  }

  return true;
}

function saveSpellcheckState(enabled) {
  try {
    fs.writeFileSync(spellcheckConfigPath, JSON.stringify({ enabled }), "utf8");
  } catch (err) {
    console.warn("Failed to save spellcheck state:", err);
  }
}

function applySpellcheckState(enabled, targetWindow = mainWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return;

  spellcheckEnabled = enabled;
  saveSpellcheckState(enabled);

  const availableLanguages = targetWindow.webContents.session.availableSpellCheckerLanguages || [];
  const preferredLanguage = availableLanguages.includes("en-US")
    ? "en-US"
    : availableLanguages[0];

  targetWindow.webContents.session.setSpellCheckerLanguages(
    enabled && preferredLanguage ? [preferredLanguage] : []
  );
}

function finishWindowClose() {
  if (relaunchAfterClose) {
    ipcMain.once("workspace:clear-for-close:result", () => {
      app.relaunch();
      app.exit(0);
    });
    mainWindow.webContents.send("workspace:clear-for-close:request");
    return;
  }

  forceClose = true;
  mainWindow.close();
}

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
    frame: false, // need to set to if dev == true else false
    // On macOS we can hint to hide the native title bar inset
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
  });

    // --- DPI SCALING FIX ---
  const { screen } = require("electron");
  const scaleFactor = screen.getPrimaryDisplay().scaleFactor;

  let zoom = 1.0;
  if (scaleFactor >= 1.25 && scaleFactor < 1.5) zoom = 1.10;
  else if (scaleFactor >= 1.5 && scaleFactor < 2.0) zoom = 1.25;
  else if (scaleFactor >= 2.0) zoom = 1.40;

  mainWindow.webContents.setZoomFactor(zoom);
  // ------------------------

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalLink(url)) {
      shell.openExternal(url);
      return { action: "deny" };
    }

    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isExternalLink(url)) {
      event.preventDefault();
      shell.openExternal(url);
      return;
    }

    event.preventDefault();
  });
  spellcheckEnabled = loadSpellcheckState();
  applySpellcheckState(spellcheckEnabled, mainWindow);

  // Remove all menus
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);

  // need  to unblock for dev builds or test builds
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

    const suggestions = params.dictionarySuggestions || [];
    const template = [];

    if (params.misspelledWord && suggestions.length > 0) {
      suggestions.slice(0, 6).forEach((suggestion) => {
        template.push({
          label: `Replace with “${suggestion}”`,
          click: () => mainWindow.webContents.replaceMisspelling(suggestion),
        });
      });
      template.push({ type: "separator" });
    }

    template.push(
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { type: "separator" },
      { role: "selectAll" }
    );

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
  });

  // Unsaved changes / workspace dirty failsafe
  mainWindow.on("close", (event) => {

    if (forceClose) return;

    // FIX H1: reset dirty state before requesting fresh value from renderer.
    // Without this, a stale true from a previous close attempt could prevent
    // closing even after the user saved all changes.
    lastKnownDirtyState = false;

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
              finishWindowClose();
            } else {
              relaunchAfterClose = false;
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
          finishWindowClose();
        }

        if (choice === 0) {
          relaunchAfterClose = false;
        }
      } else {
        // Clean workspace -> safe to close
        finishWindowClose();
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
ipcMain.handle("spellcheck:get-state", () => spellcheckEnabled);

ipcMain.handle("spellcheck:set-state", (_event, enabled) => {
  applySpellcheckState(Boolean(enabled), mainWindow);
  return spellcheckEnabled;
});

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

      // FIX C3: prevent path traversal — when a workspace is open, only allow
      // writing to files within it. Without this a compromised renderer could
      // overwrite any writable file on disk.
      if (currentWorkspacePath) {
        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(currentWorkspacePath + path.sep) && resolved !== currentWorkspacePath) {
          console.error("save-file rejected: path outside workspace", resolved);
          return false;
        }
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

    // FIX C1: prevent path traversal — resolve to absolute and verify it
    // stays within the current workspace. Without this, a compromised
    // renderer could read any directory on the filesystem.
    if (!currentWorkspacePath) {
      console.error("list-files called but no workspace is open");
      return [];
    }
    const resolvedDir = path.resolve(dirPath);
    if (!resolvedDir.startsWith(currentWorkspacePath + path.sep) && resolvedDir !== currentWorkspacePath) {
      console.error("list-files rejected: path outside workspace", resolvedDir);
      return [];
    }

    try {
      const files = fs.readdirSync(resolvedDir, { withFileTypes: true });

      return files.map((f) => ({
        name: f.name,
        type: f.isDirectory() ? "folder" : "file",
        fullPath: path.join(resolvedDir, f.name),
      }));
    } catch (err) {
      console.error("Failed to list files:", err);
      return [];
    }
  });

  ipcMain.handle("open-file-by-path", async (_, pathArg) => {
    // FIX C2: prevent path traversal — when a workspace is open, only allow
    // reading files within it. Without this a compromised renderer could read
    // any file on disk (e.g. /etc/passwd, ~/.ssh/id_rsa).
    if (currentWorkspacePath && pathArg) {
      const resolved = path.resolve(pathArg);
      if (!resolved.startsWith(currentWorkspacePath + path.sep) && resolved !== currentWorkspacePath) {
        console.error("open-file-by-path rejected: path outside workspace", resolved);
        return null;
      }
    }

    try {
      return await fs.promises.readFile(pathArg, "utf8");
    } catch {
      return null;
    }
  });

  ipcMain.handle("open-external-link", async (_, target) => {
    if (!target || !isExternalLink(target)) return false;
    shell.openExternal(target);
    return true;
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

  ipcMain.handle("shell:openExternal", async (_event, url) => {
    if (typeof url !== "string") return false;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "mailto:") {
        return false;
      }

      await shell.openExternal(url);
      return true;
    } catch {
      return false;
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

  // NOTE M4: close-project uses app.relaunch() because there is no clean way
  // to reset all in-memory state (tabs, watchers, editor) without a restart.
  // This is a known limitation — the full app restarts to clear the workspace.
  // A future improvement would be an in-memory workspace reset instead.
  ipcMain.on("workspace:close-project", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    relaunchAfterClose = true;
    mainWindow.close();
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
