// src/modules/file/session.js
//
// Session restoration (opt-in, issue #244).
//
// Persists only navigation metadata — the last open workspace, the ordered
// list of saved-file tab paths, and the active saved-file tab — so that the
// tabs can be reopened on the next launch. File *content* is deliberately
// NOT stored here; it is always reloaded from disk. This is scoped to a
// workspace, mirroring the recent-files pattern, so sessions from different
// folders do not leak into one another.

import { loadWorkspace } from "./workspace.js";

const ENABLED_KEY = "snapdock_session_enabled";
const SESSION_PREFIX = "snapdock_session_";

// ------------------------------------------------------------------
// Enabled preference (opt-in, off by default)
export function isSessionRestoreEnabled() {
  return localStorage.getItem(ENABLED_KEY) === "true";
}

export function setSessionRestoreEnabled(enabled) {
  localStorage.setItem(ENABLED_KEY, String(enabled));
}

// ------------------------------------------------------------------
// Session metadata key (workspace-scoped)
function keyForWorkspace(workspace) {
  return workspace ? `${SESSION_PREFIX}${workspace}` : null;
}

function getSessionKey() {
  return keyForWorkspace(loadWorkspace());
}

// ------------------------------------------------------------------
// Persist the session metadata from the current tab state.
// Only saved-file tabs (with a filePath) are recorded; untitled tabs are
// excluded by design.
export function saveSession({ tabs, activeFile }) {
  if (!isSessionRestoreEnabled()) return;

  const key = getSessionKey();
  if (!key) return;

  const openFiles = (tabs || [])
    .map((t) => t.filePath)
    .filter((p) => typeof p === "string" && p.length > 0);

  const data = {
    workspacePath: loadWorkspace() || null,
    openFiles,
    activeFile: typeof activeFile === "string" ? activeFile : openFiles[openFiles.length - 1] || null,
  };

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (_) {
    // Ignore serialization/storage failures; session restore is best-effort.
  }
}

// ------------------------------------------------------------------
// Load the stored session metadata. Pass an explicit workspace path to read
// a specific session (used at startup and to enforce workspace isolation);
// when omitted, the current persisted workspace is used. Returns null when
// disabled, no session exists, or the data is corrupt.
export function loadSession(workspacePath) {
  if (!isSessionRestoreEnabled()) return null;

  const key = keyForWorkspace(workspacePath || loadWorkspace());
  if (!key) return null;

  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(key) || "null");
  } catch (_) {
    return null;
  }

  if (!data || !Array.isArray(data.openFiles)) return null;
  return data;
}

// ------------------------------------------------------------------
// Clear the current workspace's session metadata. Also called when the
// feature is disabled so stored session data is not left behind.
export function clearSession() {
  const key = getSessionKey();
  if (key) {
    try {
      localStorage.removeItem(key);
    } catch (_) {
      // best-effort
    }
  }
}

// ------------------------------------------------------------------
// Reopen the saved-file tabs for a workspace, in order, and restore the
// previously active tab. Files are (re)loaded from disk — never from
// localStorage — and anything missing/inaccessible is skipped. This must be
// called after the workspace is loaded (see app.js / tree.js event).
export function initSessionRestore() {
  document.addEventListener("snapdock:workspaceLoaded", async (e) => {
    const workspace = e.detail.path;
    if (!workspace) return;

    const session = loadSession(workspace);
    if (!session || !Array.isArray(session.openFiles)) return;

    // Enforce workspace isolation: only restore files that live under the
    // triggered workspace so a stale/foreign session cannot leak in.
    const { handleFileOpen } = await import("./open.js");
    const { switchToTabByPath } = await import("./tabs.js");
    const sep = workspace.includes("\\") ? "\\" : "/";
    const prefix = workspace.endsWith(sep) ? workspace : workspace + sep;

    for (const filePath of session.openFiles) {
      if (typeof filePath !== "string") continue;
      if (!filePath.startsWith(prefix)) continue; // isolation guard
      const name = filePath.split(/[\\/]/).pop();
      // handleFileOpen loads from disk and returns early on missing files.
      await handleFileOpen(filePath, name);
    }

    // Restore the previously active saved-file tab, if it was reopened.
    if (session.activeFile) {
      switchToTabByPath(session.activeFile);
    }
  });
}

