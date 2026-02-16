// src/modules/ui/editorSync.js

import {
  createTab,
  getActiveTab,
  switchToTab,
  markDirty,
  renderTabs
} from "../file/tabs.js";

import { saveCurrentFile } from "../file/operations.js";

const editor = document.getElementById("markdownInputMain");

export function initEditorSync() {
  if (!editor) return;

  // Editor input → active tab
  editor.addEventListener("input", () => {
    const tab = getActiveTab();
    if (!tab) return;

    tab.content = editor.value;
    markDirty();
  });

  // New file
  document.getElementById("newFileBtn")?.addEventListener("click", () => {
    const tab = createTab();
    switchToTab(tab.id);
  });

  // Save file
  document.getElementById("saveFileBtnTop")?.addEventListener("click", async () => {
    const tab = getActiveTab();
    if (!tab) return;

    await saveCurrentFile(tab);
  });
}
