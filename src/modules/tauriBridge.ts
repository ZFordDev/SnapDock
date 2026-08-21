import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { relaunch } from "@tauri-apps/plugin-process";
import type { SaveAllForCloseResult } from "../types/files";
import type { UpdateChannel, UpdateConfig, UpdateEventInfo, UpdateProgress } from "../types/updates";
import { isExternalLink, resolveLocalPath } from "./linkUtils";

const appWindow = getCurrentWindow();
const updateProgressCallbacks = new Set<(progress: UpdateProgress) => void>();
const updateReadyCallbacks = new Set<(info: UpdateEventInfo) => void>();
const updateErrorCallbacks = new Set<(message: string) => void>();
const updateAvailableCallbacks = new Set<(info: UpdateEventInfo) => void>();
const updateNoneCallbacks = new Set<() => void>();
const dirtyStateCallbacks = new Set<() => void>();
const saveAllCallbacks = new Set<() => void>();
const clearCallbacks = new Set<() => void>();
let closeRequested = false;
let closeProjectRequested = false;
let dirtyStateResponseTimeout: ReturnType<typeof setTimeout> | null = null;

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

/**
 * FIX Phoenix #18: respond to dirty state with timeout safety net.
 * If renderer is unresponsive, assume dirty to prevent data loss.
 */
async function respondToDirtyState(isDirty: boolean): Promise<void> {
  if (dirtyStateResponseTimeout) {
    clearTimeout(dirtyStateResponseTimeout);
    dirtyStateResponseTimeout = null;
  }
  if (!isDirty) return finishClose();
  const choice = await invoke<string>("prompt_app_close");
  if (choice === "discard") await finishClose();
  else if (choice === "save") saveAllCallbacks.forEach((callback) => callback());
  else closeProjectRequested = false;
}

/**
 * FIX Phoenix #18: timeout safety net for dirty state check.
 * If renderer doesn't respond within 2s, assume dirty to prevent data loss.
 */
function requestDirtyStateWithTimeout(): void {
  dirtyStateResponseTimeout = setTimeout(() => {
    dirtyStateResponseTimeout = null;
    void respondToDirtyState(true);
  }, 2000);
  dirtyStateCallbacks.forEach((callback) => callback());
}

window.snapdockAPI = {
  openFile: () => invoke("open_file"),
  openFolder: () => invoke("open_folder"),
  listFiles: (path) => invoke("list_files", { dirPath: path }),
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
  getUpdateConfig: () => invoke<UpdateConfig>("get_update_config"),
  setUpdateConfig: (channel: UpdateChannel, autoCheck: boolean) =>
    invoke<UpdateConfig>("set_update_config", { channel, autoCheck }),
  checkForUpdates: async () => {
    try {
      const result = await invoke<{
        updateAvailable: boolean;
        latestVersion: string | null;
        currentVersion: string | null;
        disabled?: boolean;
        reason?: string;
      }>("check_for_updates");
      if (result.disabled) {
        return {
          updateAvailable: false,
          latestVersion: null,
          currentVersion: null,
          disabled: true,
          reason: result.reason as "snap" | "appimage",
        };
      }
      if (result.updateAvailable) {
        const info: UpdateEventInfo = { version: result.latestVersion ?? "unknown" };
        updateAvailableCallbacks.forEach((callback) => callback(info));
      } else {
        updateNoneCallbacks.forEach((callback) => callback());
      }
      return {
        updateAvailable: result.updateAvailable,
        latestVersion: result.latestVersion,
        currentVersion: result.currentVersion,
      };
    } catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
  },
  downloadUpdate: async () => {
    try {
      // Listen for progress events from Rust
      const unlisten = await listen<{ chunkLength: number; total: number | null }>(
        "updater://progress",
        (event) => {
          const { chunkLength, total } = event.payload;
          const percent = total ? (chunkLength / total) * 100 : 0;
          updateProgressCallbacks.forEach((callback) => callback({
            bytesPerSecond: 0, percent, transferred: chunkLength, total: total ?? 0, delta: chunkLength,
          }));
        },
      );
      const version = await invoke<string>("download_update");
      unlisten();
      updateReadyCallbacks.forEach((callback) => callback({ version }));
      return "downloading";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateErrorCallbacks.forEach((callback) => callback(message));
      return { error: message };
    }
  },
  installUpdate: async () => {
    try { await invoke("install_update"); }
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
  // FIX Phoenix #18: use timeout safety net for dirty state check
  requestDirtyStateWithTimeout();
});
