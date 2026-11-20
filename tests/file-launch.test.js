const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");

// Exercise the real main-process handlers without launching Electron or touching disk.
async function launch({ packaged = true, locked = true, files = [], args = [] } = {}) {
  const handlers = {};
  const sent = [], reads = [], writes = [], dialogs = [], focused = [];
  const app = new EventEmitter();
  let ready;
  Object.assign(app, {
    isPackaged: packaged,
    getPath: () => __dirname,
    requestSingleInstanceLock: () => locked,
    quit: () => { app.quitCalled = true; },
    whenReady: () => new Promise(resolve => { ready = resolve; }),
  });
  const ipcMain = new EventEmitter();
  ipcMain.handle = (name, handler) => { handlers[name] = handler; };
  const window = {
    webContents: { send: (...args) => sent.push(args) },
    isDestroyed: () => false, isMinimized: () => true,
    restore: () => focused.push("restore"),
    show: () => focused.push("show"), focus: () => focused.push("focus"),
  };
  const mocks = {
    electron: { app, ipcMain, dialog: {
      showMessageBox: async (_, options) => dialogs.push(options),
    } },
    chokidar: {},
    fs: {
      existsSync: () => false,
      statSync: file => ({ isFile: () => files.includes(file) }),
      promises: { readFile: async file => { reads.push(file); return "document"; } },
      writeFileSync: file => writes.push(file),
    },
    "./package.json": {},
    "./src/modules/pdf/pdf.js": {},
    "./src/modules/linkNavigation.js": {},
    "./src/modules/updater/detectSource": { getInstallSource() {} },
    "./src/modules/updater/index.js": () => {},
  };
  const context = vm.createContext({
    require: name => name in mocks ? mocks[name] : require(name),
    __dirname: path.resolve(__dirname, ".."),
    process: { argv: ["snapdock", ...(!packaged ? ["."] : []), ...args], cwd: () => __dirname },
    console: { error() {} }, testWindow: window,
  });
  vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../main.js"), "utf8"), context);
  vm.runInContext("createWindow = () => { mainWindow = testWindow; };", context);
  if (ready) { ready(); await Promise.resolve(); }
  return { app, ipcMain, handlers, sent, reads, writes, dialogs, focused, context, window };
}

test("cold launch queues paths and file URLs until the editor signals readiness", async () => {
  const first = path.resolve(__dirname, "notes with spaces.MD");
  const second = path.resolve(__dirname, "other.markdown");
  const h = await launch({ files: [first, second], args: ["--no-sandbox", first, pathToFileURL(second).href] });
  assert.deepEqual(h.sent, []);
  h.ipcMain.emit("files:ready", { sender: {} });
  assert.deepEqual(h.sent, []);
  h.ipcMain.emit("files:ready", { sender: h.window.webContents });
  assert.deepEqual(h.sent, [["files:open", first], ["files:open", second]]);
  h.ipcMain.emit("files:ready", { sender: h.window.webContents });
  assert.equal(h.sent.length, 2);
});

test("a second launch forwards a relative file and brings the existing window forward", async () => {
  const file = path.resolve(__dirname, "another.txt");
  const h = await launch({ files: [file] });
  h.ipcMain.emit("files:ready", { sender: h.window.webContents });
  h.app.emit("second-instance", {}, ["snapdock", "--original-process-start-time=1", "another.txt"], __dirname);
  assert.deepEqual(h.sent, [["files:open", file]]);
  assert.deepEqual(h.focused, ["restore", "show", "focus"]);
});

test("development arguments skip the app entry point; secondary processes quit", async () => {
  const file = path.resolve(__dirname, "notes.md");
  const h = await launch({ packaged: false, files: [file], args: [file] });
  h.ipcMain.emit("files:ready", { sender: h.window.webContents });
  assert.deepEqual(h.sent, [["files:open", file]]);
  const secondary = await launch({ locked: false });
  assert.equal(secondary.app.quitCalled, true);
});

test("OS-opened files can be read and saved outside the workspace, without granting adjacent paths", async () => {
  const file = path.resolve(__dirname, "external.md");
  const other = path.resolve(__dirname, "unrequested.md");
  const h = await launch({ files: [file], args: [file] });
  vm.runInContext('currentWorkspacePath = require("path").resolve(__dirname, "workspace");', h.context);
  assert.equal(await h.handlers["open-file-by-path"](null, file), "document");
  assert.equal(await h.handlers["save-file"](null, file, "edited"), true);
  assert.equal(await h.handlers["open-file-by-path"](null, other), null);
  assert.equal(await h.handlers["save-file"](null, other, "edited"), false);
  assert.deepEqual(h.reads, [file]);
  assert.deepEqual(h.writes, [file]);
});

test("unsupported OS files show the existing rejection dialog without reading content", async () => {
  const file = path.resolve(__dirname, "image.png");
  const h = await launch({ files: [file], args: [file, "missing.md", "https://example.com"] });
  h.ipcMain.emit("files:ready", { sender: h.window.webContents });
  assert.deepEqual(h.sent, [["files:open", file]]);
  assert.equal(await h.handlers["open-file-by-path"](null, file), null);
  assert.equal(h.dialogs.length, 1);
  assert.deepEqual(h.reads, []);
});

test("renderer waits for restored tabs and opens OS requests in order", async () => {
  let finishRestore, finishFirstOpen, bootstrap, onOpen;
  let ready = false;
  const opened = [];
  const restore = new Promise(resolve => { finishRestore = resolve; });
  const firstOpen = new Promise(resolve => { finishFirstOpen = resolve; });
  const noop = () => {};
  const context = vm.createContext({
    console,
    document: { getElementById: () => null },
    window: {
      addEventListener: (_, callback) => { bootstrap = callback; },
      workspaceAPI: {
        onDirtyStateRequest: noop, onSaveAllForCloseRequest: noop, onClearForCloseRequest: noop,
      },
      electronAPI: {
        onOpenFile: callback => { onOpen = callback; },
        filesReady: () => { ready = true; },
      },
    },
    ...Object.fromEntries([
      "respondToDirtyStateRequest", "initSessionRestore", "initApp", "initDropdownToggles",
      "initToolsDropdown", "initEditorSync", "initResizer", "initEditorFont", "initEditorIndent", "initMetrics",
    ].map(name => [name, noop])),
    waitForSessionRestore: () => restore,
    handleFileOpen: async (file, name) => {
      opened.push([file, name]);
      if (opened.length === 1) await firstOpen;
    },
  });
  const source = fs.readFileSync(path.resolve(__dirname, "../src/scripts.js"), "utf8");
  vm.runInContext(source.replace(/^import .*;\r?$/gm, ""), context);
  bootstrap();
  assert.equal(ready, false);
  finishRestore();
  await new Promise(setImmediate);
  assert.equal(ready, true);
  onOpen("C:\\Documents\\first.md");
  onOpen("/home/user/second.txt");
  await new Promise(setImmediate);
  assert.deepEqual(opened, [["C:\\Documents\\first.md", "first.md"]]);
  finishFirstOpen();
  await new Promise(setImmediate);
  assert.deepEqual(opened, [
    ["C:\\Documents\\first.md", "first.md"], ["/home/user/second.txt", "second.txt"],
  ]);
});
