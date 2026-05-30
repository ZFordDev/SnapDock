// src/modules/ui/dropdownMenus.js
//
// Manages the Open / Save / Tools dropdown menus in the top bar.
// Each dropdown item invokes its action directly — no proxy clicks.

import { applyTheme } from "./theme.js";
import { openHelpModal } from "./help.js";

// ─── Public API ────────────────────────────────────────────────

/**
 * Wire up all .dropdown-menu toggle buttons, outside-click closing,
 * and item auto-close behaviour.
 */
export function initDropdownToggles() {
  const menus = document.querySelectorAll(".dropdown-menu");

  // Toggle on button click
  menus.forEach((menu) => {
    const toggle = menu.querySelector(".dropdown-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = menu.classList.contains("open");
      closeAll();
      if (!wasOpen) menu.classList.add("open");
    });
  });

  // Close when clicking anywhere outside a dropdown
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-menu")) {
      closeAll();
    }
  });

  // Auto-close after clicking an item (unless it's a stub)
  menus.forEach((menu) => {
    const panel = menu.querySelector(".dropdown-panel");
    if (!panel) return;

    panel.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (btn && !btn.classList.contains("dropdown-item-stub")) {
        closeAll();
      }
    });
  });
}

/**
 * Wire the Tools dropdown items: Update, Themes, Help.
 */
export function initToolsDropdown() {
  // ── Update ──
  const updateBtn = document.getElementById("updateBtn");
  if (updateBtn) {
    initUpdateButton(updateBtn);
  }

  // ── Themes ──
  document.querySelectorAll(".theme-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      if (theme) applyTheme(theme);
    });
  });

  // ── Help ──
  const helpBtn = document.getElementById("helpBtn");
  if (helpBtn) {
    helpBtn.addEventListener("click", () => openHelpModal());
  }
}

// ─── Update system (moved from system/update.js) ───────────────

function initUpdateButton(btn) {
  // Check on launch
  checkForUpdatesOnLaunch(btn);

  // Manual check
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Checking...";
    setFooterStatus("Checking for updates…");

    const result = await window.electronAPI.checkForUpdates();

    if (!result || !result.updateAvailable) {
      btn.textContent = "No Updates";
      setFooterStatus("Up to date ✓");
      setTimeout(() => {
        btn.textContent = "Update";
        btn.disabled = false;
        setFooterStatus("");
      }, 2500);
      return;
    }

    btn.textContent = "Downloading...";
    setFooterStatus("Downloading update…");
    await window.electronAPI.downloadUpdate();
  });

  // Progress
  window.electronAPI.onUpdateProgress((progress) => {
    const pct = Math.floor(progress.percent);
    btn.textContent = `Downloading ${pct}%`;
    setFooterStatus(`Downloading update… ${pct}%`);
  });

  // Ready
  window.electronAPI.onUpdateReady(() => {
    btn.textContent = "Restart to Update";
    btn.disabled = false;
    btn.onclick = () => window.electronAPI.installUpdate();
    setFooterStatus("Update ready — restart to apply", "ready");
  });

  // Error
  window.electronAPI.onUpdateError((err) => {
    btn.textContent = "Update Failed";
    setFooterStatus("Update failed");
    console.error("Update error:", err);
  });
}

async function checkForUpdatesOnLaunch(btn) {
  const result = await window.electronAPI.checkForUpdates();
  if (result?.updateAvailable) {
    btn.classList.add("update-available");
    btn.textContent = "Update Available";
    setFooterStatus("Update available", "ready");
  }
}

/**
 * Mirror update status into the footer bar.
 * @param {string} text  – status text (empty string to clear)
 * @param {string} [state] – optional CSS modifier: "ready" | "error"
 */
function setFooterStatus(text, state) {
  const el = document.getElementById("updateStatus");
  if (!el) return;
  el.textContent = text;
  el.className = "update-status" + (state ? ` update-status--${state}` : "");
}

// ─── Helpers ───────────────────────────────────────────────────

function closeAll() {
  document.querySelectorAll(".dropdown-menu").forEach((m) => {
    m.classList.remove("open");
  });
}
