// src/modules/ui/dropdownMenus.js
//
// Manages the Open / Save / Tools dropdown menus in the top bar.
// Each dropdown item invokes its action directly — no proxy clicks.

import { applyTheme } from "./theme.js";
import { openHelpModal } from "./help.js";
import { setEditorFont } from "./editorFont.mjs";
import {
  isSessionRestoreEnabled,
  setSessionRestoreEnabled,
  clearSession,
  saveSession,
} from "../file/session.js";
import { tabs, getActiveTab } from "../file/tabs.js";

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

  // Auto-close after clicking an item.
  menus.forEach((menu) => {
    const panel = menu.querySelector(".dropdown-panel");
    if (!panel) return;

    panel.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (btn) closeAll();
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

  // ── Spellcheck ──
  const spellcheckBtn = document.getElementById("spellcheckBtn");
  if (spellcheckBtn) {
    initSpellcheckButton(spellcheckBtn);
  }

  // ── Session restoration (opt-in) ──
  const restoreSessionBtn = document.getElementById("restoreSessionBtn");
  if (restoreSessionBtn) {
    initSessionRestoreButton(restoreSessionBtn);
  }

  // ── Themes ──
  document.querySelectorAll(".theme-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      if (theme) applyTheme(theme);
    });
  });

  // ── Editor Font ──
  attachEditorFontActions();

  // ── Help ──
  const helpBtn = document.getElementById("helpBtn");
  if (helpBtn) {
    helpBtn.addEventListener("click", () => openHelpModal());
  }
}

function attachEditorFontActions() {
  const editor = document.getElementById("markdownInputMain");
  const familyButtons = document.querySelectorAll(".editor-font-family");
  const sizeButtons = document.querySelectorAll(".editor-font-size");

  familyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const family = btn.dataset.family;
      if (!family) return;
      setEditorFont(editor, { family });
      familyButtons.forEach((item) => item.classList.toggle("active", item === btn));
    });
  });

  sizeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const size = btn.dataset.size;
      if (!size) return;
      setEditorFont(editor, { size });
      sizeButtons.forEach((item) => item.classList.toggle("active", item === btn));
    });
  });

  const currentFont = editor?.dataset?.editorFontFamily || "mono";
  const currentSize = editor?.dataset?.editorFontSize || "100%";

  familyButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.family === currentFont);
  });

  sizeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.size === currentSize);
  });
}

// ─── Update system (moved from system/update.js) ───────────────

function initSpellcheckButton(btn) {
  const editor = document.getElementById("markdownInputMain");

  const applyState = (enabled) => {
    btn.dataset.enabled = String(enabled);
    btn.textContent = enabled ? "Spellcheck: On" : "Spellcheck: Off";
    btn.classList.toggle("active", enabled);
    btn.setAttribute("aria-pressed", String(enabled));

    if (editor) {
      editor.spellcheck = enabled;
      editor.setAttribute("spellcheck", String(enabled));
    }
  };

  window.electronAPI.getSpellcheckState().then(applyState).catch(() => applyState(true));

  btn.addEventListener("click", async () => {
    const nextState = btn.dataset.enabled !== "true";
    const enabled = await window.electronAPI.setSpellcheckState(nextState);
    applyState(enabled);
  });
}

// Session restoration toggle (opt-in, issue #244).
//
// Turning the feature on/off is persisted. Turning it OFF clears any stored
// session metadata (per acceptance criteria), then re-records the current
// navigation state so that re-enabling is not fed stale tab data.
function initSessionRestoreButton(btn) {
  const applyState = (enabled) => {
    btn.dataset.enabled = String(enabled);
    btn.textContent = enabled ? "Restore Session: On" : "Restore Session: Off";
    btn.classList.toggle("active", enabled);
    btn.setAttribute("aria-pressed", String(enabled));
  };

  applyState(isSessionRestoreEnabled());

  btn.addEventListener("click", () => {
    const enabled = !isSessionRestoreEnabled();
    setSessionRestoreEnabled(enabled);

    if (enabled) {
      // Persist the current navigation state immediately so the session
      // reflects what is open right now.
      // note: activeFile is computed inside saveSession when not provided by
      // reading the tabs array; pass current active tab by path.
      const active = getActiveTab();
      saveSession({
        tabs,
        activeFile: active && active.filePath ? active.filePath : null,
      });
    } else {
      // Disabling clears stored session metadata.
      clearSession();
    }

    applyState(enabled);
  });
}

// Updater state machine.
//
// All update UI is driven from a single `state` value below, so the Tools
// menu button and the footer indicator never drift out of sync. Each state
// maps to a button label, footer text, and optional CSS modifiers.
const UPDATE_STATES = {
  idle: { btn: "Update", footer: "" },
  available: { btn: "Update Available", footer: "Update available" },
  checking: { btn: "Checking...", footer: "Checking for updates…" },
  downloading: { btn: "Downloading…", footer: "Downloading update…" },
  ready: { btn: "Restart to Update", footer: "Update ready — restart to apply" },
  installing: { btn: "Installing…", footer: "Installing update…" },
  upToDate: { btn: "No Updates", footer: "Up to date ✓" },
  error: { btn: "Update Failed", footer: "Update failed" },
  disabled: { btn: "Update (managed by store)", footer: "Updates are managed by your app store" },
};

function initUpdateButton(btn) {
  let state = "idle";

  // Apply the given state to both button and footer from one source of truth.
  const applyState = (next, extra) => {
    state = next;
    const spec = UPDATE_STATES[next];

    btn.textContent = spec.btn;
    btn.disabled = next === "checking" || next === "downloading";

    // Wire the button action based on state.
    btn.onclick = null;
    if (next === "ready" || next === "installing") {
      btn.onclick = () => {
        applyState("installing", "BEFORE_QUIT");
        window.electronAPI.installUpdate();
      };
    } else if (next === "available") {
      btn.onclick = async () => {
        applyState("downloading");
        await window.electronAPI.downloadUpdate();
      };
    } else if (next !== "checking" && next !== "downloading") {
      btn.onclick = () => manualCheck(btn, applyState);
    }

    // Sync button modifier classes (used by header.css).
    btn.classList.remove(
      "update-available",
      "update-checking",
      "update-downloading",
      "update-ready",
      "update-installing",
      "update-error",
      "update-disabled"
    );
    if (next === "available") btn.classList.add("update-available");
    else if (next === "checking") btn.classList.add("update-checking");
    else if (next === "downloading") btn.classList.add("update-downloading");
    else if (next === "ready") btn.classList.add("update-ready");
    else if (next === "installing") btn.classList.add("update-installing");
    else if (next === "error") btn.classList.add("update-error");
    else if (next === "disabled") btn.classList.add("update-disabled");

    // Update footer indicator. Browser window always shows a raw status; when
    // the state is "ready" we also make the footer clickable to apply.
    let footerText = spec.footer;
    if (next === "downloading" && extra) {
      footerText = `Downloading update… ${extra}%`;
      btn.textContent = `Downloading ${extra}%`;
    }
    setFooterStatus(footerText, next, () => {
      if (state === "ready" || state === "installing") {
        applyState("installing", "BEFORE_QUIT");
        window.electronAPI.installUpdate();
      } else if (state === "available") {
        applyState("downloading");
        window.electronAPI.downloadUpdate();
      }
    });
  };

  // Startup: check if a download was left pending from a previous session.
  // The main process resolves it against the running version (see
  // pendingUpdate.resolvePendingUpdate) so we know whether it is ready to
  // apply, was already applied, or is stale after an interrupted install.
  window.electronAPI.getPendingUpdate().then((pending) => {
    if (pending && pending.status === "ready") {
      applyState("ready");
    } else if (pending && pending.status === "stale") {
      applyState("error");
      setFooterStatus("Previous update was interrupted — check for updates", "error");
      setTimeout(() => applyState("idle"), 5000);
    } else {
      checkForUpdatesOnLaunch(btn, applyState);
    }
  });

  // Progress
  window.electronAPI.onUpdateProgress((progress) => {
    applyState("downloading", Math.floor(progress.percent));
  });

  // Ready
  window.electronAPI.onUpdateReady(() => {
    applyState("ready");
  });

  // Error
  window.electronAPI.onUpdateError((err) => {
    applyState("error");
    console.error("Update error:", err);
  });

  // No update found (either on launch check or after a manual check).
  window.electronAPI.onUpdateNone(() => {
    if (state !== "downloading" && state !== "ready") {
      applyState("upToDate");
      setTimeout(() => applyState("idle"), 2500);
    }
  });

  // Guard against timeout/double-click by keeping a disabled state while the
  // manual check is in flight; re-enable via applyState.
  async function manualCheck(btn, apply) {
    apply("checking");
    const result = await window.electronAPI.checkForUpdates();
    if (!result) return;

    if (result.disabled) {
      apply("disabled");
      setTimeout(() => apply("idle"), 2500);
      return;
    }

    if (!result.updateAvailable) {
      apply("upToDate");
      setTimeout(() => apply("idle"), 2500);
      return;
    }

    apply("downloading");
    await window.electronAPI.downloadUpdate();
  }
}

async function checkForUpdatesOnLaunch(btn, applyState) {
  const result = await window.electronAPI.checkForUpdates();
  if (!result || result.disabled) {
    applyState("disabled");
    setTimeout(() => applyState("idle"), 5000);
    return;
  }
  if (result.updateAvailable) {
    applyState("available");
  }
}

/**
 * Mirror update status into the footer bar.
 * @param {string} text – status text (empty string to clear)
 * @param {string} [state] – optional updater state ("ready", "error", ...)
 * @param {Function} [onClick] – optional click handler (e.g. apply update)
 */
function setFooterStatus(text, state, onClick) {
  const el = document.getElementById("updateStatus");
  if (!el) return;
  el.textContent = text;
  el.className = "update-status" + (state ? ` update-status--${state}` : "");

  // Make the footer indicator clickable when an action is available (e.g.
  // "ready" -> apply update). Avoids relying on the Tools->Update route.
  el.onclick = onClick || null;
  el.classList.toggle("update-status--clickable", !!onClick);
}

// ─── Helpers ───────────────────────────────────────────────────

function closeAll() {
  document.querySelectorAll(".dropdown-menu").forEach((m) => {
    m.classList.remove("open");
  });
}
