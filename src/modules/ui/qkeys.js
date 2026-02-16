/**
 * SnapDock Quick Keys Module
 * Handles global keyboard shortcuts
 */
export function initShortcuts({
  createTab,
  switchToTab,
  renderTabs,
  saveCurrentFile,
  closeTab,
  getActiveTab,
  tabs
}) {
  document.addEventListener("keydown", async (e) => {
    const modifier = e.ctrlKey || e.metaKey;
    if (!modifier) return;

    const key = e.key.toLowerCase();

    //
    // --- Ctrl/Cmd + Shift + Arrow Keys (NEW TAB SWITCHING) ---
    //
    if (e.shiftKey && key === "arrowright") {
      e.preventDefault();
      if (tabs.length < 2) return;

      const active = getActiveTab();
      const currentIndex = active
        ? tabs.findIndex(t => t.id === active.id)
        : 0;

      const nextIndex = (currentIndex + 1) % tabs.length;
      switchToTab(tabs[nextIndex].id);
      return;
    }

    if (e.shiftKey && key === "arrowleft") {
      e.preventDefault();
      if (tabs.length < 2) return;

      const active = getActiveTab();
      const currentIndex = active
        ? tabs.findIndex(t => t.id === active.id)
        : 0;

      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      switchToTab(tabs[prevIndex].id);
      return;
    }

    // Ctrl / Cmd + Shift + P — Toggle Preview
    if (e.shiftKey && key === "p") {
      e.preventDefault();
      document.getElementById("previewToggleBtn")?.click();
      return;
    }

    if (modifier && e.shiftKey && key === "o") {
      e.preventDefault();
      document.getElementById("openFolderBtnTop")?.click();
      return;
    }

    if (modifier && key === "/") {
      e.preventDefault();
      document.getElementById("helpBtn")?.click();
      return;
    }

    //
    // --- Standard Ctrl/Cmd Shortcuts ---
    //
    switch (key) {
      // Ctrl / Cmd + S — Save
      case "s": {
        e.preventDefault();
        const active = getActiveTab();
        if (active) await saveCurrentFile(active);
        break;
      }

      // Ctrl / Cmd + N — New tab
      case "n": {
        e.preventDefault();
        const tab = createTab();
        switchToTab(tab.id);
        break;
      }

      // Ctrl / Cmd + W — Close tab
      case "w": {
        e.preventDefault();
        const active = getActiveTab();
        if (active) closeTab(active.id);
        break;
      }

      // Ctrl / Cmd + O — Open file dialog
      case "o": {
        e.preventDefault();
        document.getElementById("openFileBtnTop")?.click();
        break;
      }

      

      // Ctrl/Cmd + Tab — Removed due to OS conflicts
    }
  });
}