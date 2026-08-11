import type { FilePath } from "../../types/files";
import { loadContent } from "./operations.js";
import { saveToRecentFiles } from "./recent.js";
import { createTab, switchToTab, switchToTabByPath } from "./tabs.js";

export async function handleFileOpen(path: FilePath, name: string): Promise<void> {
  if (switchToTabByPath(path)) {
    dispatchFitEditor();
    return;
  }

  const content = await window.snapdockAPI.openFileByPath(path);
  if (content === null) return;

  const tab = createTab({ filePath: path, content, title: name });
  switchToTab(tab.id);
  saveToRecentFiles(path);
  dispatchFitEditor();
}

export async function openFileDialog(): Promise<void> {
  const result = await loadContent();
  if (!result) return;
  const fileName = result.filePath.split(/[\\/]/).pop() ?? result.filePath;
  await handleFileOpen(result.filePath, fileName);
}

export async function openFromRecent(path: FilePath): Promise<void> {
  const name = path.split(/[\\/]/).pop() ?? path;
  await handleFileOpen(path, name);
}

function dispatchFitEditor(): void {
  document.dispatchEvent(new CustomEvent("snapdock:fitEditor"));
}
