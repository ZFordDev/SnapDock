import "./modules/tauriBridge.js";
import { initApp } from "./modules/ui/app.js";
import { initEditorSync } from "./modules/ui/editorSync.js";
import { initFileTree } from "./modules/file/tree.js";
import { initResizer } from "./modules/ui/resizer.js";
import { openFileDialog } from "./modules/file/open.js";
import { respondToDirtyStateRequest } from "./modules/system/dirtyState.js";
import { saveAllTabs } from "./modules/file/tabs.js";
import { initDropdownToggles, initToolsDropdown } from "./modules/ui/dropdownMenus.js";
import { initMetrics } from "./modules/ui/metrics.js";
import { initEditorFont } from "./modules/ui/editorFont.js";
import { clearWorkspace } from "./modules/file/workspace.js";

window.workspaceAPI.onDirtyStateRequest(respondToDirtyStateRequest);
window.workspaceAPI.onSaveAllForCloseRequest(async () => {
  try {
    const result = await saveAllTabs();
    window.workspaceAPI.sendSaveAllForCloseResult({ ok: result.failedCount === 0, ...result });
  } catch (error) {
    window.workspaceAPI.sendSaveAllForCloseResult({
      ok: false,
      savedCount: 0,
      failedCount: 1,
      failedTabs: [],
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
window.workspaceAPI.onClearForCloseRequest(() => {
  clearWorkspace();
  window.workspaceAPI.sendClearForCloseResult();
});

window.addEventListener("DOMContentLoaded", () => {
  initApp();
  initDropdownToggles();
  initToolsDropdown();
  initEditorSync();
  initResizer();
  initEditorFont();

  const fileTreeList = document.querySelector<HTMLUListElement>("#fileTreeList");
  if (fileTreeList) initFileTree(fileTreeList);
  document.getElementById("openFileBtnTop")?.addEventListener("click", openFileDialog);
  initMetrics(document.querySelector<HTMLTextAreaElement>("#markdownInputMain"));
});
