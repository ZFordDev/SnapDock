// src/modules/file/operations.js

import { renderTabs } from "./tabs.js";
import { saveToRecentFiles } from "./recent.js";

/**
 * Save the given tab to disk.
 *
 * IPC contract:
 *   saveFile(path, content) →
 *     false            (failure)
 *     true             (saved to existing path)
 *     { newFilePath }  (saved via Save As)
 */
export async function saveCurrentFile(tab) {
  if (!tab) return false;

  const isNewFile = !tab.filePath;

  const result = await window.electronAPI.saveFile(
    isNewFile ? null : tab.filePath,
    tab.content
  );

  if (!result) {
    console.error("Failed to save file:", tab.filePath);
    return false;
  }

  tab.isDirty = false;
  tab.hasEverBeenSaved = true;

  if (typeof result === "object" && result.newFilePath) {
    tab.filePath = result.newFilePath;
    tab.title = result.newFilePath.split(/[\\/]/).pop();
  }

  if (tab.filePath) {
    saveToRecentFiles(tab.filePath);
  }

  renderTabs();
  return true;
}

/**
 * Open a file via system dialog.
 * Returns { content, filePath } or null.
 */
export async function loadContent() {
  const result = await window.electronAPI.openFile();
  if (!result) return null;

  saveToRecentFiles(result.filePath);
  return result;
}
