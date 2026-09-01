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
function getSessionKey() {
  const workspace = loadWorkspace();
  return workspace ? `${SESSION_PREFIX}${workspace}` : null;
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
// Load the stored session metadata for the current workspace.
// Returns null when disabled, no session exists, or the data is corrupt.
export function loadSession() {
  if (!isSessionRestoreEnabled()) return null;

  const key = getSessionKey();
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
