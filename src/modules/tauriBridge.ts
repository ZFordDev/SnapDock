import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";
import type { SaveAllForCloseResult } from "../types/files";
import type { UpdateEventInfo, UpdateProgress } from "../types/updates";

const appWindow = getCurrentWindow();
const updateProgressCallbacks = new Set<(progress: UpdateProgress) => void>();
const updateReadyCallbacks = new Set<(info: UpdateEventInfo) => void>();
const updateErrorCallbacks = new Set<(message: string) => void>();
const updateAvailableCallbacks = new Set<(info: { latestVersion: string; currentVersion: string }) => void>();
const updateNoneCallbacks = new Set<() => void>();
const dirtyStateCallbacks = new Set<() => void>();
const saveAllCallbacks = new Set<() => void>();
const clearCallbacks = new Set<() => void>();
let pendingUpdate: Update | null = null;
let closeRequested = false;
let closeProjectRequested = false;
let downloadedBytes = 0;
let downloadTotal = 0;

function isExternalLink(target: string): boolean {
  return /^(?:https?:|mailto:)/i.test(target.trim());
}

function resolveLocalPath(documentPath: string | null, target: string): string | null {
  if (!documentPath || !target || target.startsWith("#") || isExternalLink(target)) return null;
  const cleanTarget = target.split("#")[0]?.split("?")[0];
  if (!cleanTarget) return null;
  if (/^(?:[a-zA-Z]:[\\/]|[\\/])/.test(cleanTarget)) return cleanTarget;
  const separator = documentPath.includes("\\") ? "\\" : "/";
  const parent = documentPath.slice(0, Math.max(documentPath.lastIndexOf("/"), documentPath.lastIndexOf("\\")));
  const parts = `${parent}${separator}${cleanTarget}`.split(/[\\/]/);
  const normalized: string[] = [];
  for (const part of parts) {
    if (part === "..") normalized.pop();
    else if (part && part !== ".") normalized.push(part);
  }
  const prefix = documentPath.startsWith("/") ? "/" : "";
  return prefix + normalized.join(separator);
}

/**
 * Phoenix #1: Sanitize HTML before injecting into PDF print iframe.
 * Strips script tags, iframes, event handlers, and dangerous URLs
 * (javascript:, data:text/html) to prevent XSS from malicious markdown files.
 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s>]+)/gi, "")
    .replace(/href\s*=\s*(?:"(?:javascript|data):[^"]*"|'(?:javascript|data):[^']*')/gi, "")
    .replace(/src\s*=\s*(?:"(?:javascript|data):[^"]*"|'(?:javascript|data):[^']*')/gi, "");
}

function printHtml(html: string): void {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const printDocument = frame.contentDocument;
  if (!printDocument) return frame.remove();
  const styles = Array.from(document.styleSheets).map((sheet) => {
    try { return Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n"); }
    catch { return ""; }
  }).join("\n");
  printDocument.open();
  // Phoenix #1: sanitize HTML before injection to prevent XSS
  printDocument.write(`<!doctype html><html><head><style>${styles}\nbody{margin:40px;color:#000;background:#fff}.page-break{break-after:page;page-break-after:always}</style></head><body class="markdown-preview">${sanitizeHtml(html)}</body></html>`);
  printDocument.close();
  window.setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1000);
  }, 100);
}

async function finishClose(): Promise<void> {
  closeRequested = true;
  clearCallbacks.forEach((callback) => callback());
  if (closeProjectRequested) await relaunch();
  else await appWindow.close();
}

async function respondToDirtyState(isDirty: boolean): Promise<void> {
  if (!isDirty) return finishClose();
  const choice = await invoke<string>("prompt_app_close");
  if (choice === "discard") await finishClose();
  else if (choice === "save") saveAllCallbacks.forEach((callback) => callback());
  else closeProjectRequested = false;
}

function handleDownloadEvent(event: DownloadEvent): void {
  if (event.event === "Started") {
    downloadedBytes = 0;
    downloadTotal = event.data.contentLength ?? 0;
  } else if (event.event === "Progress") {
    downloadedBytes += event.data.chunkLength;
    const percent = downloadTotal ? downloadedBytes / downloadTotal * 100 : 0;
    updateProgressCallbacks.forEach((callback) => callback({
      bytesPerSecond: 0, percent, transferred: downloadedBytes, total: downloadTotal, delta: event.data.chunkLength,
    }));
  }
}

window.snapdockAPI = {
  openFile: () => invoke("open_file"),
  openFolder: () => invoke("open_folder"),
  listFiles: (path) => invoke("list_files", { dirPath: path }),
  openRecentFile: (path) => invoke("read_text_file", { filePath: path }),
  saveFile: (path, content, suggestedName) => invoke("save_file", { filePath: path, content, suggestedName }),
  confirmTabClose: (title) => invoke("confirm_tab_close", { title }),
  openFileByPath: (path) => invoke("read_text_file", { filePath: path }),
  openExternalLink: async (target) => {
    if (!isExternalLink(target)) return false;
    await openUrl(target);
    return true;
  },
  isExternalLink,
  resolveLocalPath,
  resolveLocalAttachment: (documentPath, attachmentPath) => {
    const path = resolveLocalPath(documentPath, attachmentPath);
    return path ? convertFileSrc(path) : attachmentPath;
  },
  closeProject: () => {
    closeProjectRequested = true;
    void appWindow.close();
  },
  onWorkspaceUpdated: (callback) => { void listen("workspace-updated", callback); },
  exportToPDF: async (html) => printHtml(html),
  openHelp: () => invoke("open_help"),
  openExternal: async (url) => {
    if (!isExternalLink(url)) return false;
    await openUrl(url);
    return true;
  },
  getSpellcheckState: () => invoke("get_spellcheck_state"),
  setSpellcheckState: (enabled) => invoke("set_spellcheck_state", { enabled }),
  getVersion: () => invoke("get_version"),
  getInstallSource: () => invoke("get_install_source"),
  checkForUpdates: async () => {
    try {
      pendingUpdate = await check();
      // FIX Phoenix #6: wire update available/none callbacks
      if (pendingUpdate) {
        const info = { latestVersion: pendingUpdate.version, currentVersion: pendingUpdate.currentVersion };
        updateAvailableCallbacks.forEach((callback) => callback(info));
      } else {
        updateNoneCallbacks.forEach((callback) => callback());
      }
      return {
        updateAvailable: Boolean(pendingUpdate),
        latestVersion: pendingUpdate?.version ?? null,
        currentVersion: pendingUpdate?.currentVersion ?? null,
      };
    } catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
  },
  downloadUpdate: async () => {
    if (!pendingUpdate) return { error: "No update is available." };
    try {
      await pendingUpdate.download(handleDownloadEvent);
      updateReadyCallbacks.forEach((callback) => callback({ version: pendingUpdate?.version ?? "unknown" }));
      return "downloading";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateErrorCallbacks.forEach((callback) => callback(message));
      return { error: message };
    }
  },
  installUpdate: async () => {
    if (!pendingUpdate) return { error: "No downloaded update is available." };
    try { await pendingUpdate.install(); await relaunch(); }
    catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
  },
  onUpdateAvailable: (callback) => { updateAvailableCallbacks.add(callback); },
  onUpdateNone: (callback) => { updateNoneCallbacks.add(callback); },
  onUpdateProgress: (callback) => { updateProgressCallbacks.add(callback); },
  onUpdateReady: (callback) => { updateReadyCallbacks.add(callback); },
  onUpdateError: (callback) => { updateErrorCallbacks.add(callback); },
};

window.windowControls = {
  minimize: () => { void appWindow.minimize(); },
  toggleMaximize: () => { void appWindow.toggleMaximize(); },
  close: () => { void appWindow.close(); },
  isMaximized: () => appWindow.isMaximized(),
  onMaximizeChange: (callback) => { void listen<boolean>("window-is-maximized", (event) => callback(event.payload)); },
};

window.workspaceAPI = {
  onDirtyStateRequest: (callback) => { dirtyStateCallbacks.add(callback); },
  sendDirtyState: (isDirty) => { void respondToDirtyState(isDirty); },
  onSaveAllForCloseRequest: (callback) => { saveAllCallbacks.add(callback); },
  sendSaveAllForCloseResult: (result: SaveAllForCloseResult) => {
    if (result.ok) void finishClose(); else closeProjectRequested = false;
  },
  onClearForCloseRequest: (callback) => { clearCallbacks.add(callback); },
  sendClearForCloseResult: () => {},
};

void appWindow.onCloseRequested((event) => {
  if (closeRequested) return;
  event.preventDefault();
  dirtyStateCallbacks.forEach((callback) => callback());
});
