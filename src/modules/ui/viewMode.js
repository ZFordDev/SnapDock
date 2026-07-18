import { renderMarkdown } from "../markdown.js";
import { getActiveTab } from "../file/tabs.js";

const STORAGE_KEY = "snapdock:previewMode";

/**
 * Initialize the preview mode dropdown (replaces old toggle button).
 *
 * Supports three modes:
 *   - "preview": full editor / full preview toggle (current behavior, active)
 *   - "split":   side-by-side editor + preview
 *   - "live":    live preview auto-refresh (disabled, future)
 *
 * The selected mode is persisted to localStorage.
 */
export function initViewModeToggle({ toggleBtn, editor, preview }) {
  if (!toggleBtn || !editor || !preview) return;

  const editorWrapper = document.querySelector(".editor-wrapper");
  const previewWrapper = document.querySelector(".preview-wrapper");
  const workspace = document.querySelector(".workspace");
  const editorBubble = document.querySelector(".editor-bubble");
  const menu = document.getElementById("previewModeMenu");
  const label = document.getElementById("previewModeLabel");
  const container = document.getElementById("previewModeDropdown");
  const dropdownArrow = document.querySelector(".dropdown-arrow");
  const splitResizeState = {
    active: false,
    startX: 0,
    startEditorWidth: 0,
    bubbleWidth: 0,
  };

  let splitResizer = document.querySelector(".split-resizer");
  if (!splitResizer && editorBubble) {
    splitResizer = document.createElement("div");
    splitResizer.className = "split-resizer";
    splitResizer.setAttribute("role", "separator");
    splitResizer.setAttribute("aria-orientation", "vertical");
    splitResizer.setAttribute("aria-label", "Resize split view");
    splitResizer.tabIndex = 0;
    editorBubble.insertBefore(splitResizer, previewWrapper);
  }

  // Start in the normal preview toggle mode each time the app opens.
  let currentMode = "preview";

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
    const html = renderMarkdown(editor.value, {
      documentPath: getActiveTab()?.filePath,
    });
    const parsed = new DOMParser().parseFromString(html, "text/html");
    preview.replaceChildren(...parsed.body.childNodes);
  };

  // --- Mode: Preview (full toggle) ---
  function applyPreviewMode() {
    if (!previewWrapper || !editorWrapper) return;

    const showingPreview = !previewWrapper.classList.contains("hidden");

    resetSplitLayout();

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

    updateLabel();
  }

  // --- Mode: Split View ---
  function applySplitMode() {
    if (!previewWrapper || !editorWrapper || !workspace) return;

    applyPreviewContent();
    workspace.classList.add("split-view");
    editorWrapper.classList.remove("hidden");
    previewWrapper.classList.remove("hidden");

    if (!editorWrapper.style.flexBasis && !previewWrapper.style.flexBasis) {
      editorWrapper.style.flexBasis = "50%";
      previewWrapper.style.flexBasis = "50%";
    }
    updateLabel();
  }

  // --- Mode: Live View (disabled for now) ---
  function applyLiveMode() {
    // Live View is not yet implemented — silently fall back to preview mode
    currentMode = "preview";
    localStorage.setItem(STORAGE_KEY, currentMode);
    updateMenuActive();
    applyPreviewMode();
  }

  // --- Reset any split view styles when switching modes ---
  function resetSplitLayout() {
    if (workspace) workspace.classList.remove("split-view");
    if (editorWrapper) editorWrapper.style.flexBasis = "";
    if (previewWrapper) previewWrapper.style.flexBasis = "";
  }


  // --- Split view resizing ---
  function startSplitResize(e) {
    if (!workspace || !workspace.classList.contains("split-view") || !editorBubble) return;
    e.preventDefault();

    splitResizeState.active = true;
    splitResizeState.startX = e.clientX;
    splitResizeState.startEditorWidth = editorWrapper.getBoundingClientRect().width;
    splitResizeState.bubbleWidth = editorBubble.getBoundingClientRect().width;

    document.body.classList.add("is-resizing-split");
    document.addEventListener("mousemove", resizeSplit);
    document.addEventListener("mouseup", stopSplitResize);
  }


  // Calculate new widths based on mouse movement, with limits to prevent collapsing either pane too much (min 25%, max 75% for editor).
  function resizeSplit(e) {
    if (!splitResizeState.active || !splitResizeState.bubbleWidth) return;

    const delta = e.clientX - splitResizeState.startX;
    const nextEditorWidth = splitResizeState.startEditorWidth + delta;
    const editorPercent = (nextEditorWidth / splitResizeState.bubbleWidth) * 100;
    const clampedEditorPercent = Math.min(75, Math.max(25, editorPercent));

    editorWrapper.style.flexBasis = `${clampedEditorPercent}%`;
    previewWrapper.style.flexBasis = `${100 - clampedEditorPercent}%`;
  }


  // Stop resizing and clean up event listeners and classes.
  function stopSplitResize() {
    splitResizeState.active = false;
    document.body.classList.remove("is-resizing-split");
    document.removeEventListener("mousemove", resizeSplit);
    document.removeEventListener("mouseup", stopSplitResize);
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
    // If Shift+Click or the arrow is clicked, open the dropdown menu
    if (e.shiftKey || e.target.closest(".dropdown-arrow")) {
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

  if (dropdownArrow) {
    dropdownArrow.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });
  }

  // --- Close dropdown when clicking outside ---
  document.addEventListener("click", (e) => {
    if (container && !container.contains(e.target)) {
      closeMenu();
    }
  });

  if (splitResizer) {
    splitResizer.addEventListener("mousedown", startSplitResize);
  }

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
  localStorage.setItem(STORAGE_KEY, currentMode);
  previewWrapper.classList.add("hidden");
  editorWrapper.classList.remove("hidden");
  resetSplitLayout();
  updateLabel();
  updateMenuActive();

  // Expose for external use
  return { getMode: () => currentMode };
}
