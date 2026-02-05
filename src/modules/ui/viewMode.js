import { renderMarkdown } from "../markdown.js";

export function initViewModeToggle({ toggleBtn, editor, preview }) {
  if (!toggleBtn || !editor || !preview) return;

  const editorWrapper = document.querySelector(".editor-wrapper");
  const previewWrapper = document.querySelector(".preview-wrapper");

  preview.classList.remove("hidden");

  // Initial state: editor visible, preview hidden
  previewWrapper.classList.add("hidden");
  editorWrapper.classList.remove("hidden");
  toggleBtn.textContent = "Show Preview";

  const updatePreview = () => {
    const html = renderMarkdown(editor.value);
    const parsed = new DOMParser().parseFromString(html, "text/html");
    preview.replaceChildren(...parsed.body.childNodes);
  };

  // Update preview when switching tabs
  document.addEventListener("snapdock:updatePreview", () => {
    if (!previewWrapper.classList.contains("hidden")) {
      updatePreview();
    }
  });

  toggleBtn.addEventListener("click", () => {
    const showingPreview = !previewWrapper.classList.contains("hidden");

    if (showingPreview) {
      previewWrapper.classList.add("hidden");
      editorWrapper.classList.remove("hidden");
      toggleBtn.textContent = "Show Preview";
    } else {
      updatePreview();
      previewWrapper.classList.remove("hidden");
      editorWrapper.classList.add("hidden");
      toggleBtn.textContent = "Edit Markdown";
    }
  });

  editor.addEventListener("input", () => {
    if (!previewWrapper.classList.contains("hidden")) {
      updatePreview();
    }
  });
}