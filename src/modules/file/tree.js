// src/modules/file/tree.js
let activeWorkspacePath = null;
let activeContainer = null;

import { handleFileOpen } from "./open.js";

const TREE_ITEM_CLASSES = [
  "relative", "block", "w-full", "cursor-pointer", "whitespace-nowrap",
  "bg-transparent", "py-1", "pr-2", "pl-5", "text-[.85rem]",
  "text-[var(--tab-text)]", "transition-colors", "duration-100",
  "hover:bg-[var(--tab-idle-bg)]", "hover:text-[var(--editor-text)]"
].join(" ");

const NESTED_TREE_CLASSES = [
  "nested", "ml-2.5", "w-fit", "min-w-[calc(100%-10px)]", "list-none",
  "border-l", "border-[var(--tab-border)]", "p-0"
].join(" ");

// Helper
function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

// ------------------------------------------------------------------
// Initialise tree when workspace loads
export function initFileTree(container) {
  activeContainer = container;

  document.addEventListener("snapdock:workspaceLoaded", async (e) => {
    const path = e.detail.path;
    activeWorkspacePath = path;

    container.innerHTML = "";
    await renderFileTree(container, path);
  });
}

// ------------------------------------------------------------------
// Render directory contents (container MUST be a <ul>)
export async function renderFileTree(container, dirPath) {
  const emptyState = document.getElementById("fileTreeEmptyState");
  const entries = await window.electronAPI.listFiles(dirPath);

  for (const entry of entries) {
    const typeClasses = entry.type === "folder" ? "folder pl-6" : "file";
    const li = createElement("li", `${typeClasses} ${TREE_ITEM_CLASSES}`, entry.name);
    li.dataset.path = entry.fullPath;

    if (entry.type === "folder") {
      const nested = createElement("ul", NESTED_TREE_CLASSES);
      nested.style.display = "none";
      li.appendChild(nested);

      li.addEventListener("click", async (e) => {
        e.stopPropagation();
        li.classList.toggle("open");
        nested.style.display = li.classList.contains("open") ? "block" : "none";

        if (nested.childElementCount === 0) {
          await renderFileTree(nested, entry.fullPath);
        }
      });
    } else {
      li.addEventListener("click", async (e) => {
        e.stopPropagation();
        await handleFileOpen(entry.fullPath, entry.name);
      });
    }

    container.appendChild(li);
  }

  // Empty-state toggle
  if (container.childElementCount === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }
}

window.electronAPI.onWorkspaceUpdated(async () => {
  if (activeWorkspacePath && activeContainer) {
    activeContainer.innerHTML = "";
    await renderFileTree(activeContainer, activeWorkspacePath);
  }
});
