import type { OpenedFile } from "../../types/files";
import type { EditorTab } from "../../types/tabs";
import { saveToRecentFiles } from "./recent.js";
import { renderTabs } from "./tabs.js";

export async function saveCurrentFile(tab: EditorTab | null): Promise<boolean> {
  if (!tab) return false;

  const result = await window.snapdockAPI.saveFile(tab.filePath, tab.content);
  if (!result) {
    console.error("Failed to save file:", tab.filePath);
    return false;
  }

  tab.isDirty = false;
  tab.hasEverBeenSaved = true;

  if (typeof result === "object") {
    tab.filePath = result.newFilePath;
    tab.title = result.newFilePath.split(/[\\/]/).pop() ?? result.newFilePath;
  }

  if (tab.filePath) saveToRecentFiles(tab.filePath);
  renderTabs();
  return true;
}

export async function loadContent(): Promise<OpenedFile | null> {
  const result = await window.snapdockAPI.openFile();
  if (result) saveToRecentFiles(result.filePath);
  return result;
}
