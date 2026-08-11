import { initInitialState } from "./editorState.js";
import { initTheme } from "./theme.js";
import { initViewModeToggle } from "./viewMode.js";
import { renderTabs, getActiveTab, tabs, switchToTab, createTab, closeTab } from "../file/tabs.js";
import { renderRecentFiles, clearRecentFiles } from "../file/recent.js";
import { initHelp } from "./help.js";
import { initShortcuts } from "./qkeys.js";
import { loadWorkspace, initWorkspaceControls } from "../file/workspace.js";
import { saveCurrentFile } from "../file/operations.js";
import { initFindBox } from "./find.js";

export function initApp(): void {
  const editor = document.querySelector<HTMLTextAreaElement>("#markdownInputMain");
  const preview = document.querySelector<HTMLElement>("#previewMain");
  const previewToggleBtn = document.querySelector<HTMLElement>("#previewToggleBtn");
  const recentList = document.querySelector<HTMLElement>("#recentFilesList");

  initInitialState({ editor });
  initTheme();
  initHelp();
  initViewModeToggle({ toggleBtn: previewToggleBtn, editor, preview });
  renderRecentFiles(recentList);
  window.snapdockFind = initFindBox({
    editor,
    host: document.querySelector<HTMLElement>("#findBarHost"),
  });

  document.getElementById("clearRecentBtn")?.addEventListener("click", () => {
    clearRecentFiles();
    renderRecentFiles(recentList);
  });

  initWorkspaceControls();
  initShortcuts({ createTab, switchToTab, closeTab, renderTabs, saveCurrentFile, getActiveTab, tabs });

  const lastWorkspace = loadWorkspace();
  if (lastWorkspace) {
    document.dispatchEvent(new CustomEvent("snapdock:workspaceLoaded", {
      detail: { path: lastWorkspace },
    }));
  }

  document.getElementById("exportPdfBtn")?.addEventListener("click", () => {
    if (preview) void window.snapdockAPI.exportToPDF(preview.innerHTML);
  });
  document.getElementById("closeProjectBtn")?.addEventListener("click", () => {
    window.snapdockAPI.closeProject();
  });

  void setVersionTag(document.getElementById("versionTag"));
  initWindowControls();
}

function initWindowControls(): void {
  const minimizeBtn = document.getElementById("minimizeBtn");
  const maximizeBtn = document.getElementById("maximizeBtn");
  const closeBtn = document.getElementById("closeBtn");
  const updateMaxIcon = (isMaximized: boolean): void => {
    if (maximizeBtn) maximizeBtn.textContent = isMaximized ? "❐" : "▢";
  };

  minimizeBtn?.addEventListener("click", () => window.windowControls.minimize());
  maximizeBtn?.addEventListener("click", () => window.windowControls.toggleMaximize());
  closeBtn?.addEventListener("click", () => window.windowControls.close());
  document.querySelector<HTMLElement>(".title-row")?.addEventListener("dblclick", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest(".window-controls")) {
      window.windowControls.toggleMaximize();
    }
  });
  void window.windowControls.isMaximized().then(updateMaxIcon);
  window.windowControls.onMaximizeChange(updateMaxIcon);
}

async function setVersionTag(versionTag: HTMLElement | null): Promise<void> {
  if (!versionTag) return;
  const info = await window.snapdockAPI.getVersion();
  const formattedDate = info.date ? new Date(info.date).toISOString().slice(0, 10) : "unknown";
  versionTag.textContent = `SnapDock ${info.version} (${info.stage}) — ${formattedDate}`;
}
