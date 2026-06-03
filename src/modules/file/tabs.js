// src/modules/file/tabs.js
import { saveCurrentFile } from "./operations.js";

let tabs = [];
let activeTabId = null;

const getEditor = () => document.getElementById("markdownInputMain");
let tabBarScrollSetup = false;

function isTabBarScrollable(tabBar) {
  return tabBar.scrollWidth > tabBar.clientWidth + 1;
}

function updateTabBarOverflowClasses(tabBar) {
  const canScroll = isTabBarScrollable(tabBar);
  tabBar.classList.toggle("has-overflow", canScroll);
  tabBar.classList.toggle("has-left-overflow", canScroll && tabBar.scrollLeft > 1);
  tabBar.classList.toggle("has-right-overflow", canScroll && tabBar.scrollLeft + tabBar.clientWidth < tabBar.scrollWidth - 1);
}

function ensureTabBarScrollBehavior() {
  const tabBar = document.getElementById("tabBar");
  if (!tabBar || tabBarScrollSetup) return;
  tabBarScrollSetup = true;

  tabBar.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
      tabBar.scrollBy({ left: event.deltaY, behavior: "smooth" });
      event.preventDefault();
    }
  }, { passive: false });

  tabBar.addEventListener("scroll", () => updateTabBarOverflowClasses(tabBar));
  window.addEventListener("resize", () => updateTabBarOverflowClasses(tabBar));
  updateTabBarOverflowClasses(tabBar);
}

function scrollActiveTabIntoView(tabBar) {
  const activeTab = tabBar.querySelector(".tab.active");
  if (!activeTab) return;

  const tabRect = activeTab.getBoundingClientRect();
  const barRect = tabBar.getBoundingClientRect();

  if (tabRect.left < barRect.left || tabRect.right > barRect.right) {
    activeTab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
}

/**
 * Switch to a tab by file path if it already exists
 */
export function switchToTabByPath(path) {
  if (!path) return null;
  const existing = tabs.find(t => t.filePath === path);
  if (existing) {
    switchToTab(existing.id);
    return existing;
  }
  return null;
}

/**
 * Create a new tab
 */
export function createTab({ filePath = null, content = "", title = "Untitled" } = {}) {
  const tab = {
    id: crypto.randomUUID(),
    filePath,
    title,
    content,
    isDirty: false,
    hasEverBeenSaved: !!filePath,
  };

  tabs.push(tab);
  return tab;
}

/**
 * Remove all tabs
 */
export function clearTabs() {
  tabs.length = 0;
  activeTabId = null;
  renderTabs();
}

/**
 * Switch active tab
 */
export function switchToTab(tabId) {
  const editor = getEditor();

  // Save outgoing tab content
  const current = getActiveTab();
  if (current && editor) {
    current.content = editor.value;
  }

  activeTabId = tabId;
  const next = getActiveTab();

  if (!next || !editor) return;

  editor.value = next.content;

  const filenameEl = document.getElementById("filenameDisplay");
  if (filenameEl) filenameEl.textContent = next.title;

  // If preview mode is active, refresh it
  if (!document.querySelector(".preview-wrapper").classList.contains("hidden")) {
      const event = new CustomEvent("snapdock:updatePreview");
      document.dispatchEvent(event);
  }

  renderTabs();
}

/**
 * Close a tab (now async + safe)
 */
export async function closeTab(tabId) {
  const index = tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;

  const tab = tabs[index];

  // SAFE: Replace blocking confirm with async IPC dialog
  if (tab.isDirty) {
    const ok = await window.electronAPI.confirmTabClose(tab.title);
    if (!ok) return;
  }

  const wasActive = tab.id === activeTabId;
  tabs.splice(index, 1);

  if (wasActive) {
    if (tabs.length) {
      const next = tabs[Math.max(0, index - 1)];
      switchToTab(next.id);
    } else {
      const newTab = createTab();
      switchToTab(newTab.id);
    }
  } else {
    renderTabs();
  }
}

/**
 * Move a tab from one index to another (drag & drop)
 */
export function moveTab(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  if (fromIndex < 0 || fromIndex >= tabs.length) return;
  if (toIndex < 0 || toIndex >= tabs.length) return;

  const [moved] = tabs.splice(fromIndex, 1);
  tabs.splice(toIndex, 0, moved);
  renderTabs();
}

// --- Drag & Drop state ---
let dragState = {
  dragging: null,     // index of tab being dragged
  dropTarget: null,   // index of drop position
  startX: 0,
  placeholder: null,
};

/**
 * Create a visual placeholder element for drop position
 */
function createDropPlaceholder() {
  const el = document.createElement("div");
  el.className = "tab-drop-indicator";
  return el;
}

/**
 * Get tab index from a mouse event by finding the nearest tab element
 */
function getTabIndexFromEvent(e, tabBar) {
  const tabEls = Array.from(tabBar.querySelectorAll(".tab"));
  if (tabEls.length === 0) return -1;

  const mouseX = e.clientX;
  let targetIndex = 0;

  for (let i = 0; i < tabEls.length; i++) {
    const rect = tabEls[i].getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    if (mouseX < midX) {
      targetIndex = i;
      break;
    }
    targetIndex = i + 1;
  }

  return targetIndex;
}

/**
 * Render tab bar
 */
export function renderTabs() {
  const tabBar = document.getElementById("tabBar");
  if (!tabBar) return;

  tabBar.innerHTML = "";

  tabs.forEach((tab, index) => {
    const isActive = tab.id === activeTabId;

    const el = document.createElement("div");
    el.className = `tab ${isActive ? "active" : ""} ${tab.isDirty ? "dirty" : ""}`;
    el.dataset.tabId = tab.id;
    el.draggable = true;

    // Status LED
    const led = document.createElement("div");
    led.className = "tab-led";
    led.style.background =
      !tab.hasEverBeenSaved ? "#ff4444" :
      tab.isDirty ? "#ffbb00" :
      "#4caf50";

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.title;

    const close = document.createElement("button");
    close.className = "tab-close";
    close.innerHTML = "×";
    close.addEventListener("click", e => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    // --- Drag & Drop event handlers ---
    el.addEventListener("dragstart", (e) => {
      dragState.dragging = index;
      el.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", tab.id);
      // Hide default drag image
      const ghost = document.createElement("div");
      ghost.style.position = "absolute";
      ghost.style.top = "-9999px";
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => ghost.remove(), 0);
    });

    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      // Remove all indicators
      tabBar.querySelectorAll(".tab-drop-indicator").forEach(el => el.remove());
      dragState.dragging = null;
      dragState.dropTarget = null;
    });

    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (dragState.dragging === null || dragState.dragging === index) return;

      e.dataTransfer.dropEffect = "move";

      // Remove old indicators
      tabBar.querySelectorAll(".tab-drop-indicator").forEach(el => el.remove());

      // Determine drop side based on cursor position relative to tab center
      const rect = el.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const dropAfter = e.clientX > midX;

      const indicator = createDropPlaceholder();
      if (dropAfter) {
        el.insertAdjacentElement("afterend", indicator);
      } else {
        el.insertAdjacentElement("beforebegin", indicator);
      }
    });

    el.addEventListener("dragleave", () => {
      // Keep indicator visible — let dragover on other tabs handle cleanup
    });

    el.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (dragState.dragging === null) return;

      const fromIndex = dragState.dragging;

      // Determine target index
      const rect = el.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const dropAfter = e.clientX > midX;
      let toIndex = index;
      if (dropAfter) toIndex++;

      // Adjust for removing from array
      if (fromIndex < toIndex) toIndex--;

      moveTab(fromIndex, toIndex);

      // Cleanup
      tabBar.querySelectorAll(".tab-drop-indicator").forEach(el => el.remove());
      dragState.dragging = null;
      dragState.dropTarget = null;
    });

    el.append(led, title, close);
    el.addEventListener("click", () => switchToTab(tab.id));
    tabBar.appendChild(el);
  });

  ensureTabBarScrollBehavior();
  updateTabBarOverflowClasses(tabBar);
  scrollActiveTabIntoView(tabBar);
}

/**
 * Get current active tab
 */
export function getActiveTab() {
  if (!tabs.length) {
    const tab = createTab();
    activeTabId = tab.id;
    return tab;
  }
  return tabs.find(t => t.id === activeTabId) || null;
}

/**
 * Mark active tab as dirty
 */
export function markDirty() {
  const tab = getActiveTab();
  if (!tab || tab.isDirty) return;

  tab.isDirty = true;
  renderTabs();
}

export async function save_all_tabs(){
  const dirtyTabs = tabs.filter(tab => tab.isDirty);
  if(!dirtyTabs.length){
    return {savedCount:0,failedCount:0,failedTabs:[]};
  }


  let savedCount = 0;
  const failedTabs = [];

  for(const tab of dirtyTabs){
    const ok = await saveCurrentFile(tab);
    if(ok) {
      savedCount++;
    } else {
      failedTabs.push(tab.title);
    }
  }

  return {
    savedCount,
    failedCount: failedTabs.length,
    failedTabs
  };
}
export { tabs };
