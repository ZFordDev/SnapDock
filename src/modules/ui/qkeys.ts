import type { EditorTab } from "../../types/tabs";
import { toggleFindBox } from "./find.js";

interface ShortcutDependencies {
  createTab(): EditorTab;
  switchToTab(tabId: string): void;
  renderTabs(): void;
  saveCurrentFile(tab: EditorTab): Promise<boolean>;
  closeTab(tabId: string): Promise<void>;
  getActiveTab(): EditorTab | null;
  tabs: EditorTab[];
}

export function initShortcuts(deps: ShortcutDependencies): void {
  const { createTab, switchToTab, saveCurrentFile, closeTab, getActiveTab, tabs } = deps;
  document.addEventListener("keydown", async (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toLowerCase();

    if (event.shiftKey && (key === "arrowright" || key === "arrowleft")) {
      event.preventDefault();
      if (tabs.length < 2) return;
      const active = getActiveTab();
      const currentIndex = active ? tabs.findIndex((tab) => tab.id === active.id) : 0;
      const offset = key === "arrowright" ? 1 : -1;
      const target = tabs[(currentIndex + offset + tabs.length) % tabs.length];
      if (target) switchToTab(target.id);
      return;
    }

    if (event.shiftKey && key === "p") {
      event.preventDefault();
      document.getElementById("previewToggleBtn")?.click();
      return;
    }
    if (event.shiftKey && key === "o") {
      event.preventDefault();
      document.getElementById("openFolderBtnTop")?.click();
      return;
    }
    if (key === "/") {
      event.preventDefault();
      document.getElementById("helpBtn")?.click();
      return;
    }
    if (key === "f") {
      event.preventDefault();
      toggleFindBox();
      return;
    }

    if (key === "s") {
      event.preventDefault();
      const active = getActiveTab();
      if (active) await saveCurrentFile(active);
    } else if (key === "n") {
      event.preventDefault();
      switchToTab(createTab().id);
    } else if (key === "w") {
      event.preventDefault();
      const active = getActiveTab();
      if (active) await closeTab(active.id);
    } else if (key === "o") {
      event.preventDefault();
      document.getElementById("openFileBtnTop")?.click();
    }
  });
}
