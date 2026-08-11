import {
  createTab,
  getActiveTab,
  switchToTab,
  markDirty,
  saveAllTabs,
} from "../file/tabs.js";
import { saveCurrentFile } from "../file/operations.js";

export function initEditorSync(): void {
  const editor = document.querySelector<HTMLTextAreaElement>("#markdownInputMain");
  if (!editor) return;

  editor.addEventListener("input", () => {
    const tab = getActiveTab();
    if (!tab) return;
    tab.content = editor.value;
    markDirty();
  });

  document.getElementById("newFileBtn")?.addEventListener("click", () => {
    const tab = createTab();
    switchToTab(tab.id);
  });

  document.getElementById("saveFileBtnTop")?.addEventListener("click", async () => {
    const tab = getActiveTab();
    if (tab) await saveCurrentFile(tab);
  });

  document.getElementById("saveAllBtnTop")?.addEventListener("click", async () => {
    const tab = getActiveTab();
    if (tab) tab.content = editor.value;
    await saveAllTabs();
  });
}
