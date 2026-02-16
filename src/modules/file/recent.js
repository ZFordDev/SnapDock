import { loadWorkspace } from "./workspace.js";
import { openFromRecent } from "./open.js";

function getRecentKey() {
  const workspace = loadWorkspace();
  return workspace
    ? `snapdock_recent_${workspace}`
    : "snapdock_recent_global";
}

// ------------------------------------------------------------------
// Save a file path to recent files (workspace-scoped)
export function saveToRecentFiles(path) {
  if (!path) return;

  const key = getRecentKey();
  const list = JSON.parse(localStorage.getItem(key) || "[]");

  const updated = list.filter(p => p !== path);
  updated.unshift(path);

  localStorage.setItem(key, JSON.stringify(updated.slice(0, 20)));
}

// ------------------------------------------------------------------
// Render recent files list
export function renderRecentFiles(container) {
  if (!container) return;

  const key = getRecentKey();
  const list = JSON.parse(localStorage.getItem(key) || "[]");

  container.innerHTML = "";

  for (const path of list) {
    const li = document.createElement("li");
    li.textContent = path.split(/[\\/]/).pop();
    li.dataset.path = path;
    container.appendChild(li);
  }

  // Attach once
  if (!container._recentListenerAttached) {
    container.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-path]");
      if (li) openFromRecent(li.dataset.path);
    });
    container._recentListenerAttached = true;
  }
}

// ------------------------------------------------------------------
// Get raw recent files list (no DOM)
export function getRecent() {
  const key = getRecentKey();
  return JSON.parse(localStorage.getItem(key) || "[]");
}
