// src/modules/ui/themeMenu.js

import { applyTheme } from "./theme.js";

// Helper
function byId(id) {
  return document.getElementById(id);
}

// Elements
const themeMenu = byId("themeMenu");
const themeToggleBtn = byId("themeBtn");

// --- INITIALIZER ---
export function initThemeMenu() {

  // Toggle the menu open/closed
  themeToggleBtn.addEventListener("click", () => {
    themeMenu.classList.toggle("open");
  });

  // Apply theme when clicking a theme button
  document.querySelectorAll(".theme-menu button").forEach(btn => {
    btn.addEventListener("click", () => {
      applyTheme(btn.dataset.theme);
      themeMenu.classList.remove("open");
    });
  });
}