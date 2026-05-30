// scripts.js — SnapDock Orchestrator

import { initApp } from "./modules/ui/app.js";
import { initEditorSync } from "./modules/ui/editorSync.js";
import { initFileTree } from "./modules/file/tree.js";
import { initResizer } from "./modules/ui/resizer.js";
import { openFileDialog } from "./modules/file/open.js";
import { respondToDirtyStateRequest } from "./modules/system/dirtyState.js";
import { save_all_tabs } from "./modules/file/tabs.js";
import { initDropdownToggles, initToolsDropdown } from "./modules/ui/dropdownMenus.js";

// Helper
function byId(id) {
  return document.getElementById(id);
}

// Dirty State Request Listener
window.workspaceAPI.onDirtyStateRequest(respondToDirtyStateRequest);

// close-flow save all request frm main process
window.workspaceAPI.onSaveAllForCloseRequest(async() => {
  try{
    const result = await save_all_tabs();
    window.workspaceAPI.sendSaveAllForCloseResult({
      ok:result.failedCount === 0,
      ...result
    })
  }catch(err){
    window.workspaceAPI.sendSaveAllForCloseResult({
      ok:false,
      savedCount:0,
      failedCount:1,
      failedTabs:[],
      error: err.message || String(err)
    });
  }
})

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