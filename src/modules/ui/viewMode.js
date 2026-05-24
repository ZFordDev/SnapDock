import { renderMarkdown } from "../markdown.js";

const STORAGE_KEY = "snapdock:previewMode";

/**
 * Initialize the preview mode dropdown (replaces old toggle button).
 *
 * Supports three modes:
 *   - "preview": full editor / full preview toggle (current behavior, active)
 *   - "split":   side-by-side editor + preview (disabled, future)
 *   - "live":    live preview auto-refresh (disabled, future)
 *
 * The selected mode is persisted to localStorage.
 */
export function initViewModeToggle({ toggleBtn, editor, preview }) {
  if (!toggleBtn || !editor || !preview) return;

  const editorWrapper = document.querySelector(".editor-wrapper");
  const previewWrapper = document.querySelector(".preview-wrapper");
  const workspace = document.querySelector(".workspace");
  const menu = document.getElementById("previewModeMenu");
  const label = document.getElementById("previewModeLabel");
  const container = document.getElementById("previewModeDropdown");

  // --- Mode persistence ---
  let currentMode = localStorage.getItem(STORAGE_KEY) || "preview";
  if (!["preview", "split", "live"].includes(currentMode)) {
    currentMode = "preview";
  }

  // --- Update menu active state ---
  function updateMenuActive() {
    if (!menu) return;
    menu.querySelectorAll(".preview-mode-option").forEach(opt => {
      opt.classList.toggle("active", opt.dataset.mode === currentMode);
    });
  }

  // --- Update button label ---
  function updateLabel() {
    if (!label) return;
    const modeLabels = {
      preview: "Show Preview",
      split: "Split View",
      live: "Live View",
    };
    // If preview is currently showing, show "Edit Markdown"
    const previewVisible = previewWrapper && !previewWrapper.classList.contains("hidden");
    if (currentMode === "preview" && previewVisible) {
      label.textContent = "Edit Markdown";
    } else {
      label.textContent = modeLabels[currentMode] || "Show Preview";
    }
  }

  // --- Update preview content ---
  const applyPreviewContent = () => {
    const html = renderMarkdown(editor.value);
    const parsed = new DOMParser().parseFromString(html, "text/html");
    preview.replaceChildren(...parsed.body.childNodes);
  };

  // --- Mode: Preview (full toggle) ---
  function applyPreviewMode() {
    if (!previewWrapper || !editorWrapper) return;

    const showingPreview = !previewWrapper.classList.contains("hidden");

    if (showingPreview) {
      // Switch to editor
      previewWrapper.classList.add("hidden");
      editorWrapper.classList.remove("hidden");
    } else {
      // Switch to preview
      applyPreviewContent();
      previewWrapper.classList.remove("hidden");
      editorWrapper.classList.add("hidden");
    }

    // Remove split-view class from workspace
    if (workspace) workspace.classList.remove("split-view");
    updateLabel();
  }

  // --- Mode: Split View (disabled for now) ---
  function applySplitMode() {
    // Split View is not yet implemented — silently fall back to preview mode
    currentMode = "preview";
    localStorage.setItem(STORAGE_KEY, currentMode);
    updateMenuActive();
    applyPreviewMode();
  }

  // --- Mode: Live View (disabled for now) ---
  function applyLiveMode() {
    // Live View is not yet implemented — silently fall back to preview mode
    currentMode = "preview";
    localStorage.setItem(STORAGE_KEY, currentMode);
    updateMenuActive();
    applyPreviewMode();
  }

  // --- Dropdown menu toggle ---
  const toggleMenu = () => {
    if (!menu) return;
    const isOpen = menu.classList.contains("open");
    if (isOpen) {
      menu.classList.remove("open");
    } else {
      menu.classList.add("open");
    }
  };

  const closeMenu = () => {
    if (menu) menu.classList.remove("open");
  };

  // --- Bind menu option clicks ---
  if (menu) {
    menu.querySelectorAll(".preview-mode-option").forEach(opt => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const mode = opt.dataset.mode;
        if (opt.classList.contains("disabled")) return;

        currentMode = mode;
        localStorage.setItem(STORAGE_KEY, currentMode);
        updateMenuActive();

        if (mode === "preview") applyPreviewMode();
        else if (mode === "split") applySplitMode();
        else if (mode === "live") applyLiveMode();

        closeMenu();
      });
    });
  }

  // --- Main button: toggle preview OR open dropdown ---
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    // If Shift+Click, open the dropdown menu
    if (e.shiftKey) {
      toggleMenu();
      return;
    }
    // Regular click: apply current mode action
    if (currentMode === "preview") {
      applyPreviewMode();
    } else if (currentMode === "split") {
      applySplitMode();
    } else if (currentMode === "live") {
      applyLiveMode();
    }
  });

  // --- Open dropdown on right-click or dropdown arrow click ---
  if (container) {
    container.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      toggleMenu();
    });
  }

  // --- Close dropdown when clicking outside ---
  document.addEventListener("click", (e) => {
    if (container && !container.contains(e.target)) {
      closeMenu();
    }
  });

  // --- Update preview when switching tabs ---
  document.addEventListener("snapdock:updatePreview", () => {
    if (previewWrapper && !previewWrapper.classList.contains("hidden")) {
      applyPreviewContent();
    }
  });

  // --- Live preview while typing ---
  editor.addEventListener("input", () => {
    if (previewWrapper && !previewWrapper.classList.contains("hidden")) {
      applyPreviewContent();
    }
  });

  // --- Initialize ---
  preview.classList.remove("hidden");
  previewWrapper.classList.add("hidden");
  editorWrapper.classList.remove("hidden");
  updateMenuActive();
  updateLabel();

  // Expose for external use
  return { getMode: () => currentMode };
}
