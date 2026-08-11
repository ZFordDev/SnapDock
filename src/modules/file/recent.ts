import type { FilePath } from "../../types/files";
import { loadWorkspace } from "./workspace.js";
import { openFromRecent } from "./open.js";

const RECENT_FILE_CLASSES = [
  "flex", "w-fit", "min-w-full", "cursor-pointer", "items-center", "gap-2",
  "whitespace-nowrap", "rounded", "bg-transparent", "px-2.5", "py-[5px]",
  "my-px", "text-[.85rem]", "text-[var(--tab-text)]", "transition-colors",
  "duration-150", "hover:bg-[var(--tab-idle-bg)]", "hover:text-[var(--editor-text)]",
].join(" ");

const initializedContainers = new WeakSet<HTMLElement>();

function getRecentKey(): string {
  const workspace = loadWorkspace();
  return workspace ? `snapdock_recent_${workspace}` : "snapdock_recent_global";
}

function readRecentFiles(): FilePath[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(getRecentKey()) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function saveToRecentFiles(path: FilePath): void {
  if (!path) return;
  const updated = [path, ...readRecentFiles().filter((item) => item !== path)];
  localStorage.setItem(getRecentKey(), JSON.stringify(updated.slice(0, 20)));
}

export function clearRecentFiles(): void {
  localStorage.removeItem(getRecentKey());
}

export function renderRecentFiles(container: HTMLElement | null): void {
  if (!container) return;
  container.replaceChildren();

  for (const path of readRecentFiles()) {
    const item = document.createElement("li");
    item.className = RECENT_FILE_CLASSES;
    item.textContent = path.split(/[\\/]/).pop() ?? path;
    item.dataset.path = path;
    container.appendChild(item);
  }

  if (!initializedContainers.has(container)) {
    container.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const item = target?.closest<HTMLElement>("li[data-path]");
      if (item?.dataset.path) void openFromRecent(item.dataset.path);
    });
    initializedContainers.add(container);
  }
}

export function getRecent(): FilePath[] {
  return readRecentFiles();
}
