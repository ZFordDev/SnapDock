import { renderRecentFiles } from "./recent.js";

const WORKSPACE_KEY = "snapdock_workspace";

// ------------------------------------------------------------------
// Workspace persistence
export function loadWorkspace() {
  return localStorage.getItem(WORKSPACE_KEY);
}

export function saveWorkspace(path) {
  if (!path) return;
  localStorage.setItem(WORKSPACE_KEY, path);
}

export function clearWorkspace() {
  localStorage.removeItem(WORKSPACE_KEY);
}

// ------------------------------------------------------------------
// Workspace UI controls
export function initWorkspaceControls() {
  const openFolderBtn = document.getElementById("openFolderBtnTop");
  const recentList = document.getElementById("recentFilesList");

  if (!openFolderBtn) return;

  openFolderBtn.addEventListener("click", async () => {
    const folderPath = await window.electronAPI.openFolder();
    if (!folderPath) return;

    saveWorkspace(folderPath);
    updateWorkspaceName(folderPath);

    // 🔑 single source of truth
    document.dispatchEvent(
      new CustomEvent("snapdock:workspaceLoaded", {
        detail: { path: folderPath }
      })
    );

    renderRecentFiles(recentList);
  });
}

// ------------------------------------------------------------------
// Workspace name display
export function updateWorkspaceName(folderPath) {
  const workspaceName = folderPath.split(/[/\\]/).pop();
  const nameEl = document.getElementById("workspaceName");
  if (nameEl) nameEl.textContent = workspaceName;
}
