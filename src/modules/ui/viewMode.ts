import type { PreviewMode, ViewModeController } from "../../types/ui";
import { renderMarkdown } from "../markdown.js";
import { getActiveTab } from "../file/tabs.js";
import { handleFileOpen } from "../file/open.js";

const STORAGE_KEY = "snapdock:previewMode";

interface ViewModeOptions {
  toggleBtn: HTMLElement | null;
  editor: HTMLTextAreaElement | null;
  preview: HTMLElement | null;
}

const isPreviewMode = (value: string | undefined): value is PreviewMode =>
  value === "preview" || value === "split" || value === "live";

export function initViewModeToggle({ toggleBtn, editor, preview }: ViewModeOptions): ViewModeController | undefined {
  if (!toggleBtn || !editor || !preview) return;
  const editorWrapper = document.querySelector<HTMLElement>(".editor-wrapper");
  const previewWrapper = document.querySelector<HTMLElement>(".preview-wrapper");
  const workspace = document.querySelector<HTMLElement>(".workspace");
  const editorBubble = document.querySelector<HTMLElement>(".editor-bubble");
  const menu = document.querySelector<HTMLElement>("#previewModeMenu");
  const label = document.querySelector<HTMLElement>("#previewModeLabel");
  const container = document.querySelector<HTMLElement>("#previewModeDropdown");
  const dropdownArrow = document.querySelector<HTMLElement>(".dropdown-arrow");
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

  // FIX H3: restore view mode from localStorage instead of always starting
  // in preview mode. Without this, user's mode preference is never restored.
  const savedMode = localStorage.getItem(STORAGE_KEY) ?? undefined;
  let currentMode: PreviewMode = isPreviewMode(savedMode) ? savedMode : "preview";
  const resizeState = { active: false, startX: 0, startEditorWidth: 0, bubbleWidth: 0 };
  const updateMenuActive = (): void => {
    menu?.querySelectorAll<HTMLElement>(".preview-mode-option").forEach((option) => {
      option.classList.toggle("active", option.dataset.mode === currentMode);
    });
  };
  const updateLabel = (): void => {
    if (!label) return;
    const labels: Record<PreviewMode, string> = { preview: "Show Preview", split: "Split View", live: "Live View" };
    label.textContent = currentMode === "preview" && !previewWrapper.classList.contains("hidden")
      ? "Edit Markdown" : labels[currentMode];
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
  const applyPreviewMode = (): void => {
    const showingPreview = !previewWrapper.classList.contains("hidden");
    resetSplitLayout();
    previewWrapper.classList.toggle("hidden", showingPreview);
    editorWrapper.classList.toggle("hidden", !showingPreview);
    if (!showingPreview) applyPreviewContent();
    updateLabel();
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
    updateLabel();
  };
  const applyLiveMode = (): void => {
    currentMode = "preview";
    localStorage.setItem(STORAGE_KEY, currentMode);
    updateMenuActive();
    applyPreviewMode();
  };
  const applyCurrentMode = (): void => {
    if (currentMode === "preview") applyPreviewMode();
    else if (currentMode === "split") applySplitMode();
    else applyLiveMode();
  };
  const toggleMenu = (): void => {
    menu?.classList.toggle("open");
  };
  const closeMenu = (): void => {
    menu?.classList.remove("open");
  };

  menu?.querySelectorAll<HTMLElement>(".preview-mode-option").forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      const mode = option.dataset.mode;
      if (option.classList.contains("disabled") || !isPreviewMode(mode)) return;
      currentMode = mode;
      localStorage.setItem(STORAGE_KEY, currentMode);
      updateMenuActive();
      applyCurrentMode();
      closeMenu();
    });
  });
  toggleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const arrowClicked = event.target instanceof Element && Boolean(event.target.closest(".dropdown-arrow"));
    if (event.shiftKey || arrowClicked) toggleMenu(); else applyCurrentMode();
  });
  container?.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    toggleMenu();
  });
  dropdownArrow?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu();
  });
  document.addEventListener("click", (event) => {
    if (!container || !(event.target instanceof Node) || !container.contains(event.target)) closeMenu();
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
  editor.addEventListener("input", () => {
    if (!previewWrapper.classList.contains("hidden")) applyPreviewContent();
  });

  // --- Initialize --- apply saved mode or default to preview
  if (currentMode === "split") {
    applySplitMode();
  } else {
    preview.classList.remove("hidden");
    previewWrapper.classList.add("hidden");
    editorWrapper.classList.remove("hidden");
    resetSplitLayout();
  }
  localStorage.setItem(STORAGE_KEY, currentMode);
  updateLabel();
  updateMenuActive();
  return { getMode: () => currentMode };
}
