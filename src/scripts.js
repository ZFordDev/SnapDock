// scripts.js — SnapDock Orchestrator

import { initApp } from "./modules/ui/app.js";
import { initThemeMenu } from "./modules/ui/themeMenu.js";
import { initEditorSync } from "./modules/ui/editorSync.js";
import { initFileTree } from "./modules/file/tree.js";
import { initResizer } from "./modules/ui/resizer.js";
import { initUpdateSystem } from "./modules/system/update.js";
import { openFileDialog, openFromRecent } from "./modules/file/open.js";
import { respondToDirtyStateRequest } from "./modules/system/dirtyState.js";


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

  // UI Modules
  initThemeMenu();
  initEditorSync();
  initResizer();
  initUpdateSystem();

  // File Tree
  const fileTreeList = byId("fileTreeList");
  if (fileTreeList) initFileTree(fileTreeList);

  // File Open Buttons
  byId("openFileBtnTop")?.addEventListener("click", openFileDialog);



});