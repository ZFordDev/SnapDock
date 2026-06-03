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

import { renderRecentFiles, clearRecentFiles } from "../file/recent.js";
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

  const clearRecentBtn = byId("clearRecentBtn");
  if (clearRecentBtn) {
    clearRecentBtn.addEventListener("click", () => {
      clearRecentFiles();
      renderRecentFiles(recentList);
    });
  }

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

  // 8️⃣ Window controls (frameless window)
  try {
    const minimizeBtn = document.getElementById("minimizeBtn");
    const maximizeBtn = document.getElementById("maximizeBtn");
    const closeBtn = document.getElementById("closeBtn");

    const updateMaxIcon = (isMax) => {
      if (!maximizeBtn) return;
      maximizeBtn.textContent = isMax ? '❐' : '▢';
    };

    if (minimizeBtn) {
      minimizeBtn.addEventListener("click", () => {
        window.windowControls.minimize();
      });
    }

    if (maximizeBtn) {
      maximizeBtn.addEventListener("click", () => {
        window.windowControls.toggleMaximize();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        window.windowControls.close();
      });
    }

    // initialize state
    window.windowControls.isMaximized().then((isMax) => updateMaxIcon(isMax));
    window.windowControls.onMaximizeChange((isMax) => updateMaxIcon(isMax));
  } catch (err) {
    // noop if windowControls not available (e.g., non-Electron environment)
  }
}

// --- VERSION TAG ---
async function setVersionTag(versionTag) {
  if (!versionTag) return;

  const info = await window.electronAPI.getVersion();
  versionTag.textContent =
    `SnapDock ${info.version} (${info.stage}) — ${info.date}`;
}
