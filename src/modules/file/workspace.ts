import type { WorkspacePath } from "../../types/files";
import { renderRecentFiles } from "./recent.js";

const WORKSPACE_KEY = "snapdock_workspace";

export function loadWorkspace(): WorkspacePath | null {
  return localStorage.getItem(WORKSPACE_KEY);
}

export function saveWorkspace(path: WorkspacePath): void {
  if (path) localStorage.setItem(WORKSPACE_KEY, path);
}

export function clearWorkspace(): void {
  localStorage.removeItem(WORKSPACE_KEY);
}

export function initWorkspaceControls(): void {
  const openFolderButton = document.getElementById("openFolderBtnTop");
  const recentList = document.getElementById("recentFilesList");
  if (!openFolderButton) return;

  openFolderButton.addEventListener("click", async () => {
    const folderPath = await window.snapdockAPI.openFolder();
    if (!folderPath) return;

    saveWorkspace(folderPath);
    updateWorkspaceName(folderPath);
    document.dispatchEvent(new CustomEvent("snapdock:workspaceLoaded", {
      detail: { path: folderPath },
    }));
    renderRecentFiles(recentList);
  });
}

export function updateWorkspaceName(folderPath: WorkspacePath): void {
  const workspaceName = folderPath.split(/[/\\]/).pop() ?? folderPath;
  const nameElement = document.getElementById("workspaceName");
  if (nameElement) nameElement.textContent = workspaceName;
}
