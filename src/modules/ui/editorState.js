export function initInitialState({ editor }) {
  if (!editor) return;

  if (!editor.value.trim()) {
    editor.value = "# SnapDock Start typing...";
  }

  editor.focus();
}

export function resetEditor({ editor, preview }) {
  if (!editor || !preview) return;
  editor.value = "";
  preview.innerHTML = "";
  preview.classList.add("hidden");
  editor.style.display = "block";
}