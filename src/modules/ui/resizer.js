// src/modules/ui/resizer.js

// Helper
function byId(id) {
  return document.getElementById(id);
}

// Elements
const sidebar = byId("sidebar");
const resizer = byId("resizer");

// --- INITIALIZER ---
export function initResizer() {
  if (!sidebar || !resizer) return;

  resizer.addEventListener("mousedown", startResize);
}

// --- START RESIZE ---
function startResize() {
  document.addEventListener("mousemove", resizeSidebar);
  document.addEventListener("mouseup", stopResize);
}

// --- RESIZE LOGIC ---
function resizeSidebar(e) {
  const newWidth = e.clientX;

  // Prevent collapsing or exploding the sidebar
  if (newWidth > 180 && newWidth < 400) {
    sidebar.style.width = `${newWidth}px`;
  }
}

// --- STOP RESIZE ---
function stopResize() {
  document.removeEventListener("mousemove", resizeSidebar);
  document.removeEventListener("mouseup", stopResize);
}