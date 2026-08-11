import type { WorkspacePath } from "../../types/files";
import { handleFileOpen } from "./open.js";

let activeWorkspacePath: WorkspacePath | null = null;
let activeContainer: HTMLUListElement | null = null;

const TREE_ITEM_CLASSES = [
  "relative", "block", "w-full", "cursor-pointer", "whitespace-nowrap",
  "bg-transparent", "py-1", "pr-2", "pl-5", "text-[.85rem]",
  "text-[var(--tab-text)]", "transition-colors", "duration-100",
  "hover:bg-[var(--tab-idle-bg)]", "hover:text-[var(--editor-text)]",
].join(" ");

const NESTED_TREE_CLASSES = [
  "nested", "ml-2.5", "w-fit", "min-w-[calc(100%-10px)]", "list-none",
  "border-l", "border-[var(--tab-border)]", "p-0",
].join(" ");

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text) element.textContent = text;
  return element;
}

export function initFileTree(container: HTMLUListElement): void {
  activeContainer = container;

  document.addEventListener("snapdock:workspaceLoaded", async (event) => {
    activeWorkspacePath = event.detail.path;
    container.replaceChildren();
    await renderFileTree(container, activeWorkspacePath);
  });
}

export async function renderFileTree(
  container: HTMLUListElement,
  directoryPath: WorkspacePath,
): Promise<void> {
  const emptyState = document.getElementById("fileTreeEmptyState");
  const entries = await window.snapdockAPI.listFiles(directoryPath);

  for (const entry of entries) {
    const typeClasses = entry.type === "folder" ? "folder pl-6" : "file";
    const item = createElement("li", `${typeClasses} ${TREE_ITEM_CLASSES}`, entry.name);
    item.dataset.path = entry.fullPath;

    if (entry.type === "folder") {
      const nested = createElement("ul", NESTED_TREE_CLASSES);
      nested.style.display = "none";
      item.appendChild(nested);

      item.addEventListener("click", async (event) => {
        event.stopPropagation();
        item.classList.toggle("open");
        nested.style.display = item.classList.contains("open") ? "block" : "none";
        if (nested.childElementCount === 0) {
          await renderFileTree(nested, entry.fullPath);
        }
      });
    } else {
      item.addEventListener("click", async (event) => {
        event.stopPropagation();
        await handleFileOpen(entry.fullPath, entry.name);
      });
    }

    container.appendChild(item);
  }

  if (emptyState) {
    emptyState.style.display = container.childElementCount === 0 ? "block" : "none";
  }
}

window.snapdockAPI.onWorkspaceUpdated(() => {
  if (!activeWorkspacePath || !activeContainer) return;
  activeContainer.replaceChildren();
  void renderFileTree(activeContainer, activeWorkspacePath);
});
