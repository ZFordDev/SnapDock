export function initInitialState({ editor }) {
  if (!editor) return;

  if (!editor.value.trim()) {
    editor.value = "";
  }

  editor.focus();
}
