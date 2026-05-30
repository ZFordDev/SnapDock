// scripts.js — SnapDock Orchestrator

import { initApp } from "./modules/ui/app.js";
import { initEditorSync } from "./modules/ui/editorSync.js";
import { initFileTree } from "./modules/file/tree.js";
import { initResizer } from "./modules/ui/resizer.js";
import { openFileDialog } from "./modules/file/open.js";
import { respondToDirtyStateRequest } from "./modules/system/dirtyState.js";
import { initDropdownToggles, initToolsDropdown } from "./modules/ui/dropdownMenus.js";

// Helper
function byId(id) {
  return document.getElementById(id);
}

// Dirty State Request Listener
window.workspaceAPI.onDirtyStateRequest(respondToDirtyStateRequest);

// --- MAIN BOOTSTRAP ---
window.addEventListener("DOMContentLoaded", () => {

  // Core App Initialization
  initApp();

  // Dropdown menus (Open, Save, Tools)
  initDropdownToggles();
  initToolsDropdown();

  // UI Modules
  initEditorSync();
  initResizer();

  // File Tree
  const fileTreeList = byId("fileTreeList");
  if (fileTreeList) initFileTree(fileTreeList);

  // File Open Button (inside the Open dropdown — same ID)
  byId("openFileBtnTop")?.addEventListener("click", openFileDialog);

});