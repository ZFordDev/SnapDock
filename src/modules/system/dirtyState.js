// src/modules/system/dirtyState.js

import { tabs } from "../file/tabs.js";

/**
 * Returns true if any tab has unsaved changes.
 */
export function isWorkspaceDirty() {
  return tabs.some(tab => tab.isDirty);
}

/**
 * Returns an array of tabs that have unsaved changes.
 */
export function getDirtyTabs() {
  return tabs.filter(tab => tab.isDirty);
}

/**
 * Respond to main process dirty-state request.
 */
export function respondToDirtyStateRequest() {
  const dirty = isWorkspaceDirty();
  window.workspaceAPI.sendDirtyState(dirty);
}