// src/modules/ui/app.js

import { initInitialState } from "../ui/editorState.js";
import { initTheme } from "../ui/theme.js";
import { initViewModeToggle } from "../ui/viewMode.js";

import {
  renderTabs,
  getActiveTab,
  tabs,
  switchToTab,
  createTab,
  closeTab
} from "../file/tabs.js";

import { renderRecentFiles } from "../file/recent.js";
import { initHelp} from "../ui/help.js";
import { initShortcuts } from "../ui/qkeys.js";
import { loadWorkspace, initWorkspaceControls } from "../file/workspace.js";
import { saveCurrentFile } from "../file/operations.js";

// --- HELPERS ---
function byId(id) {
  return document.getElementById(id);
}

// --- MAIN INITIALIZER ---
export function initApp() {
  // Elements
  const editor = byId("markdownInputMain");
  const preview = byId("previewMain");
  const previewToggleBtn = byId("previewToggleBtn");
  const recentList = byId("recentFilesList");
  const themeMenu = byId("themeMenu");
  const themeToggleBtn = byId("themeBtn");
  const versionTag = byId("versionTag");

  // 1️⃣ Editor + UI state
  initInitialState({ editor });
  initTheme({});
  initHelp();
  initViewModeToggle({
    toggleBtn: previewToggleBtn,
    editor,
    preview
  });

  // 2️⃣ Recent files
  renderRecentFiles(recentList);

  // 3️⃣ Workspace controls
  initWorkspaceControls();

  // 4️⃣ Keyboard shortcuts
  initShortcuts({
    createTab,
    switchToTab,
    closeTab,
    renderTabs,
    saveCurrentFile,
    getActiveTab,
    tabs
  });

  // 5️⃣ Load last workspace (if any)
  const lastWorkspace = loadWorkspace();
  if (lastWorkspace) {
    document.dispatchEvent(
      new CustomEvent("snapdock:workspaceLoaded", {
        detail: { path: lastWorkspace }
      })
    );
  }
  // 6️⃣ Export to PDF
  const exportBtn = document.getElementById("exportPdfBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const preview = document.getElementById("previewMain");
      if (!preview) return;
    
      const html = preview.innerHTML;
      window.electronAPI.exportToPDF(html);
    });
  }


  // 7️⃣ Version tag
  setVersionTag(versionTag);
}

// --- VERSION TAG ---
async function setVersionTag(versionTag) {
  if (!versionTag) return;

  const info = await window.electronAPI.getVersion();
  versionTag.textContent =
    `SnapDock ${info.version} (${info.stage}) — ${info.date}`;
}
