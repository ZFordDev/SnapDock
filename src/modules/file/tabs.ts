import type { SaveAllTabsResult } from "../../types/files";
import type { CreateTabOptions, EditorTab, TabDragState } from "../../types/tabs";
import { updateMetrics } from "../ui/metrics.js";
import { saveCurrentFile } from "./operations.js";

export const tabs: EditorTab[] = [];
let activeTabId: string | null = null;
let tabBarScrollSetup = false;

const dragState: TabDragState = {
  dragging: null,
  dropTarget: null,
  startX: 0,
  placeholder: null,
};

const TAB_CLASSES = [
  "tab", "relative", "flex", "min-w-[140px]", "shrink-0", "cursor-pointer",
  "items-center", "self-end", "gap-2", "rounded-t", "border", "border-b-0",
  "border-[var(--tab-border)]", "px-2.5", "transition-all", "duration-200",
  "hover:brightness-110",
].join(" ");

const INACTIVE_TAB_CLASSES = "h-[30px] bg-[var(--tab-idle-bg)] text-[var(--tab-text)]";
const ACTIVE_TAB_CLASSES = "active z-[2] h-[31px] bg-[var(--tab-active-bg)] text-[var(--editor-text)]";
const TAB_LED_CLASSES = "tab-led h-[7px] w-[7px] shrink-0 rounded-full";
const TAB_TITLE_CLASSES = "tab-title flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[.8rem] font-medium";
const TAB_CLOSE_CLASSES = "tab-close flex h-[18px] w-[18px] items-center justify-center rounded-[3px] p-0 text-sm opacity-50 transition-all duration-200 hover:bg-[rgba(125,125,125,.2)] hover:opacity-100";
const DROP_INDICATOR_CLASSES = "tab-drop-indicator mx-0.5 h-7 w-[3px] shrink-0 self-end rounded-sm bg-[var(--tab-accent,#4a9eff)]";

function getEditor(): HTMLTextAreaElement | null {
  return document.getElementById("markdownInputMain") as HTMLTextAreaElement | null;
}

function isTabBarScrollable(tabBar: HTMLElement): boolean {
  return tabBar.scrollWidth > tabBar.clientWidth + 1;
}

function updateTabBarOverflowClasses(tabBar: HTMLElement): void {
  const canScroll = isTabBarScrollable(tabBar);
  tabBar.classList.toggle("has-overflow", canScroll);
  tabBar.classList.toggle("has-left-overflow", canScroll && tabBar.scrollLeft > 1);
  tabBar.classList.toggle(
    "has-right-overflow",
    canScroll && tabBar.scrollLeft + tabBar.clientWidth < tabBar.scrollWidth - 1,
  );
}

function ensureTabBarScrollBehavior(): void {
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

function scrollActiveTabIntoView(tabBar: HTMLElement): void {
  const activeTab = tabBar.querySelector<HTMLElement>(".tab.active");
  if (!activeTab) return;

  const tabRect = activeTab.getBoundingClientRect();
  const barRect = tabBar.getBoundingClientRect();
  if (tabRect.left < barRect.left || tabRect.right > barRect.right) {
    activeTab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
}

export function switchToTabByPath(path: string): EditorTab | null {
  if (!path) return null;
  const existing = tabs.find((tab) => tab.filePath === path) ?? null;
  if (existing) switchToTab(existing.id);
  return existing;
}

export function createTab({
  filePath = null,
  content = "",
  title = "Untitled",
}: CreateTabOptions = {}): EditorTab {
  const tab: EditorTab = {
    id: crypto.randomUUID(),
    filePath,
    title,
    content,
    isDirty: false,
    hasEverBeenSaved: Boolean(filePath),
  };
  tabs.push(tab);
  return tab;
}

export function switchToTab(tabId: string): void {
  const editor = getEditor();
  const current = getActiveTab();
  if (current && editor) current.content = editor.value;

  activeTabId = tabId;
  const next = getActiveTab();
  if (!next || !editor) return;

  editor.value = next.content;
  updateMetrics();

  const filenameElement = document.getElementById("filenameDisplay");
  if (filenameElement) filenameElement.textContent = next.title;

  const previewWrapper = document.querySelector(".preview-wrapper");
  if (previewWrapper && !previewWrapper.classList.contains("hidden")) {
    document.dispatchEvent(new CustomEvent("snapdock:updatePreview"));
  }
  renderTabs();
}

export async function closeTab(tabId: string): Promise<void> {
  const index = tabs.findIndex((tab) => tab.id === tabId);
  const tab = tabs[index];
  if (index === -1 || !tab) return;

  if (tab.isDirty && !(await window.snapdockAPI.confirmTabClose(tab.title))) return;

  const wasActive = tab.id === activeTabId;
  tabs.splice(index, 1);

  if (!wasActive) {
    renderTabs();
    return;
  }

  const next = tabs[Math.max(0, index - 1)] ?? createTab();
  switchToTab(next.id);
}

export function moveTab(fromIndex: number, toIndex: number): void {
  if (fromIndex === toIndex) return;
  if (fromIndex < 0 || fromIndex >= tabs.length) return;
  if (toIndex < 0 || toIndex >= tabs.length) return;

  const [moved] = tabs.splice(fromIndex, 1);
  if (!moved) return;
  tabs.splice(toIndex, 0, moved);
  renderTabs();
}

function createDropPlaceholder(): HTMLDivElement {
  const element = document.createElement("div");
  element.className = DROP_INDICATOR_CLASSES;
  return element;
}

function removeDropIndicators(tabBar: HTMLElement): void {
  tabBar.querySelectorAll(".tab-drop-indicator").forEach((element) => element.remove());
}

export function renderTabs(): void {
  const tabBar = document.getElementById("tabBar");
  if (!tabBar) return;
  tabBar.replaceChildren();

  tabs.forEach((tab, index) => {
    const isActive = tab.id === activeTabId;
    const element = document.createElement("div");
    element.className = `${TAB_CLASSES} ${isActive ? ACTIVE_TAB_CLASSES : INACTIVE_TAB_CLASSES} ${tab.isDirty ? "dirty" : ""}`;
    element.dataset.tabId = tab.id;
    element.draggable = true;

    const led = document.createElement("div");
    led.className = TAB_LED_CLASSES;
    led.style.background = !tab.hasEverBeenSaved
      ? "#ff4444"
      : tab.isDirty ? "#ffbb00" : "#4caf50";

    const title = document.createElement("span");
    title.className = TAB_TITLE_CLASSES;
    title.textContent = tab.title;

    const closeButton = document.createElement("button");
    closeButton.className = TAB_CLOSE_CLASSES;
    closeButton.textContent = "×";
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void closeTab(tab.id);
    });

    element.addEventListener("dragstart", (event) => {
      if (!event.dataTransfer) return;
      dragState.dragging = index;
      element.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", tab.id);

      const ghost = document.createElement("div");
      ghost.style.position = "absolute";
      ghost.style.top = "-9999px";
      document.body.appendChild(ghost);
      event.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(() => ghost.remove(), 0);
    });

    element.addEventListener("dragend", () => {
      element.classList.remove("dragging");
      removeDropIndicators(tabBar);
      dragState.dragging = null;
      dragState.dropTarget = null;
    });

    element.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!event.dataTransfer || dragState.dragging === null || dragState.dragging === index) return;
      event.dataTransfer.dropEffect = "move";
      removeDropIndicators(tabBar);

      const dropAfter = event.clientX > element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2;
      element.insertAdjacentElement(dropAfter ? "afterend" : "beforebegin", createDropPlaceholder());
    });

    element.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (dragState.dragging === null) return;

      const fromIndex = dragState.dragging;
      const rect = element.getBoundingClientRect();
      const dropAfter = event.clientX > rect.left + rect.width / 2;
      let toIndex = index + (dropAfter ? 1 : 0);
      if (fromIndex < toIndex) toIndex -= 1;
      moveTab(fromIndex, toIndex);

      removeDropIndicators(tabBar);
      dragState.dragging = null;
      dragState.dropTarget = null;
    });

    element.append(led, title, closeButton);
    element.addEventListener("click", () => switchToTab(tab.id));
    tabBar.appendChild(element);
  });

  ensureTabBarScrollBehavior();
  updateTabBarOverflowClasses(tabBar);
  scrollActiveTabIntoView(tabBar);
}

export function getActiveTab(): EditorTab | null {
  if (!tabs.length) {
    const tab = createTab();
    activeTabId = tab.id;
    return tab;
  }
  return tabs.find((tab) => tab.id === activeTabId) ?? null;
}

export function markDirty(): void {
  const tab = getActiveTab();
  if (!tab || tab.isDirty) return;
  tab.isDirty = true;
  renderTabs();
}

export async function saveAllTabs(): Promise<SaveAllTabsResult> {
  const dirtyTabs = tabs.filter((tab) => tab.isDirty);
  let savedCount = 0;
  const failedTabs: string[] = [];

  for (const tab of dirtyTabs) {
    if (await saveCurrentFile(tab)) savedCount += 1;
    else failedTabs.push(tab.title);
  }

  return { savedCount, failedCount: failedTabs.length, failedTabs };
}
