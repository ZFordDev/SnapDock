// src/modules/file/tree.js

import { handleFileOpen } from "./open.js";

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
  document.addEventListener("snapdock:workspaceLoaded", async (e) => {
    const path = e.detail.path;
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
    const li = createElement("li", entry.type, entry.name);
    li.dataset.path = entry.fullPath;

    if (entry.type === "folder") {
      const nested = createElement("ul", "nested");
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
