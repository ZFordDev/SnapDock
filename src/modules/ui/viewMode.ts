import type { PreviewMode, ViewModeController } from "../../types/ui";
import { renderMarkdown } from "../markdown.js";
import { getActiveTab } from "../file/tabs.js";
import { handleFileOpen } from "../file/open.js";

const STORAGE_KEY = "snapdock:previewMode";

interface ViewModeOptions {
  editor: HTMLTextAreaElement | null;
  preview: HTMLElement | null;
}

const isPreviewMode = (value: string | undefined): value is PreviewMode =>
  value === "preview" || value === "split";

export function initViewModeToggle({ editor, preview }: ViewModeOptions): ViewModeController | undefined {
  if (!editor || !preview) return;
  const editorWrapper = document.querySelector<HTMLElement>(".editor-wrapper");
  const previewWrapper = document.querySelector<HTMLElement>(".preview-wrapper");
  const workspace = document.querySelector<HTMLElement>(".workspace");
  const editorBubble = document.querySelector<HTMLElement>(".editor-bubble");
  const menu = document.querySelector<HTMLElement>("#previewModeMenu");
  const previewToggleBtn = document.querySelector<HTMLButtonElement>("#previewToggleBtn");
  if (!editorWrapper || !previewWrapper) return;

  let splitResizer = document.querySelector<HTMLElement>(".split-resizer");
  if (!splitResizer && editorBubble) {
    splitResizer = document.createElement("div");
    splitResizer.className = "split-resizer";
    splitResizer.setAttribute("role", "separator");
    splitResizer.setAttribute("aria-orientation", "vertical");
    splitResizer.setAttribute("aria-label", "Resize split view");
    splitResizer.tabIndex = 0;
    editorBubble.insertBefore(splitResizer, previewWrapper);
  }

  const savedMode = localStorage.getItem(STORAGE_KEY) ?? undefined;
  let currentMode: PreviewMode = isPreviewMode(savedMode) ? savedMode : "preview";
  const resizeState = { active: false, startX: 0, startEditorWidth: 0, bubbleWidth: 0 };

  const updateMenuActive = (): void => {
    menu?.querySelectorAll<HTMLElement>(".preview-mode-option").forEach((option) => {
      option.classList.toggle("active", option.dataset.mode === currentMode);
    });
  };

  const updateToggleButton = (): void => {
    if (!previewToggleBtn) return;
    const isRawView = currentMode === "preview";
    const isPreviewing = isRawView && !previewWrapper.classList.contains("hidden");
    const isEditing = isRawView && previewWrapper.classList.contains("hidden");
    previewToggleBtn.classList.toggle("hidden", !isRawView);
    previewToggleBtn.classList.toggle("flex", isRawView);
    previewToggleBtn.classList.toggle("opacity-0", !isRawView);
    previewToggleBtn.classList.toggle("opacity-100", isRawView);
    const label = previewToggleBtn.querySelector("span:last-child");
    if (label) label.textContent = isPreviewing ? "Edit" : "Preview";
    previewToggleBtn.setAttribute("aria-label", isPreviewing ? "Back to editor" : "Show preview");
  };

  const applyPreviewContent = (): void => {
    const html = renderMarkdown(editor.value, { documentPath: getActiveTab()?.filePath ?? null });
    const parsed = new DOMParser().parseFromString(html, "text/html");
    preview.replaceChildren(...parsed.body.childNodes);
  };

  const resetSplitLayout = (): void => {
    workspace?.classList.remove("split-view");
    editorWrapper.style.flexBasis = "";
    previewWrapper.style.flexBasis = "";
  };

  const showPreview = (): void => {
    resetSplitLayout();
    previewWrapper.classList.remove("hidden");
    editorWrapper.classList.add("hidden");
    applyPreviewContent();
    updateToggleButton();
  };

  const showEditor = (): void => {
    resetSplitLayout();
    previewWrapper.classList.add("hidden");
    editorWrapper.classList.remove("hidden");
    updateToggleButton();
  };

  const applySplitMode = (): void => {
    if (!workspace) return;
    applyPreviewContent();
    workspace.classList.add("split-view");
    editorWrapper.classList.remove("hidden");
    previewWrapper.classList.remove("hidden");
    if (!editorWrapper.style.flexBasis && !previewWrapper.style.flexBasis) {
      editorWrapper.style.flexBasis = "50%";
      previewWrapper.style.flexBasis = "50%";
    }
    updateToggleButton();
  };

  const applyCurrentMode = (): void => {
    if (currentMode === "preview") showPreview();
    else if (currentMode === "split") applySplitMode();
    else {
      currentMode = "preview";
      localStorage.setItem(STORAGE_KEY, currentMode);
      updateMenuActive();
      showPreview();
    }
  };

  const toggleRawView = (): void => {
    if (previewWrapper.classList.contains("hidden")) {
      showPreview();
    } else {
      showEditor();
    }
  };

  previewToggleBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleRawView();
  });

  menu?.querySelectorAll<HTMLElement>(".preview-mode-option").forEach((option) => {
    option.addEventListener("click", (event) => {
      const mode = option.dataset.mode;
      if (option.classList.contains("disabled") || !isPreviewMode(mode)) return;
      currentMode = mode;
      localStorage.setItem(STORAGE_KEY, currentMode);
      updateMenuActive();
      applyCurrentMode();
      // Close the parent dropdown menu after selection
      if (event.currentTarget instanceof Element) {
        event.currentTarget.closest(".dropdown-menu")?.classList.remove("open");
      }
    });
  });

  const resizeSplit = (event: MouseEvent): void => {
    if (!resizeState.active || !resizeState.bubbleWidth) return;
    const percent = ((resizeState.startEditorWidth + event.clientX - resizeState.startX) / resizeState.bubbleWidth) * 100;
    const editorPercent = Math.min(75, Math.max(25, percent));
    editorWrapper.style.flexBasis = `${editorPercent}%`;
    previewWrapper.style.flexBasis = `${100 - editorPercent}%`;
  };

  const stopSplitResize = (): void => {
    resizeState.active = false;
    document.body.classList.remove("is-resizing-split");
    document.removeEventListener("mousemove", resizeSplit);
    document.removeEventListener("mouseup", stopSplitResize);
  };

  splitResizer?.addEventListener("mousedown", (event) => {
    if (!workspace?.classList.contains("split-view") || !editorBubble) return;
    event.preventDefault();
    Object.assign(resizeState, {
      active: true,
      startX: event.clientX,
      startEditorWidth: editorWrapper.getBoundingClientRect().width,
      bubbleWidth: editorBubble.getBoundingClientRect().width,
    });
    document.body.classList.add("is-resizing-split");
    document.addEventListener("mousemove", resizeSplit);
    document.addEventListener("mouseup", stopSplitResize);
  });

  preview.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
    const href = anchor?.getAttribute("href");
    if (!href) return;
    if (window.snapdockAPI.isExternalLink(href)) {
      event.preventDefault();
      event.stopPropagation();
      await window.snapdockAPI.openExternalLink(href);
      return;
    }
    const resolvedPath = window.snapdockAPI.resolveLocalPath(getActiveTab()?.filePath ?? null, href);
    if (!resolvedPath) return;
    event.preventDefault();
    event.stopPropagation();
    await handleFileOpen(resolvedPath, resolvedPath.split(/[\\/]/).pop() ?? resolvedPath);
  });

  document.addEventListener("snapdock:updatePreview", () => {
    if (!previewWrapper.classList.contains("hidden")) applyPreviewContent();
  });

  let previewDebounce: ReturnType<typeof setTimeout> | null = null;
  editor.addEventListener("input", () => {
    if (!previewWrapper.classList.contains("hidden")) {
      if (previewDebounce) clearTimeout(previewDebounce);
      previewDebounce = setTimeout(applyPreviewContent, 150);
    }
  });

  // Initialize
  if (currentMode === "split") {
    applySplitMode();
  } else {
    preview.classList.remove("hidden");
    previewWrapper.classList.add("hidden");
    editorWrapper.classList.remove("hidden");
    resetSplitLayout();
  }
  localStorage.setItem(STORAGE_KEY, currentMode);
  updateMenuActive();
  updateToggleButton();
  return { getMode: () => currentMode };
}
