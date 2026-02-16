// src/modules/file/open.js

import {
  createTab,
  switchToTab,
  switchToTabByPath
} from "./tabs.js";

import { saveToRecentFiles } from "./recent.js";
import { loadContent } from "./operations.js";

// --- CENTRALIZED FILE OPEN LOGIC ---
export async function handleFileOpen(path, name) {

  // 1. Prevent duplicate tabs
  const existing = switchToTabByPath(path);
  if (existing) {
    dispatchFitEditor();
    return;
  }

  // 2. Load file content via Electron
  const content = await window.electronAPI.openFileByPath(path);
  if (content === null) return;

  // 3. Create new tab
  const tab = createTab({
    filePath: path,
    content,
    title: name
  });

  switchToTab(tab.id);

  // 4. Save to recent files
  saveToRecentFiles(path);

  // 5. Fit editor after tab switch
  dispatchFitEditor();
}

// --- OPEN FILE VIA DIALOG ---
export async function openFileDialog() {
  const result = await loadContent();
  if (!result) return;

  const fileName = result.filePath.split(/[\\/]/).pop();
  await handleFileOpen(result.filePath, fileName);
}

// --- RECENT FILE CLICK HANDLER ---
export async function openFromRecent(path) {
  const name = path.split(/[\\/]/).pop();
  await handleFileOpen(path, name);
}

// --- EVENT DISPATCHER FOR EDITOR RESIZE ---
function dispatchFitEditor() {
  document.dispatchEvent(
    new CustomEvent("snapdock:fitEditor")
  );
}
