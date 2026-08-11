interface InitialStateOptions {
  editor: HTMLTextAreaElement | null;
}

interface ResetEditorOptions extends InitialStateOptions {
  preview: HTMLElement | null;
}

export function initInitialState({ editor }: InitialStateOptions): void {
  if (!editor) return;
  if (!editor.value.trim()) editor.value = "";
  editor.focus();
}

export function resetEditor({ editor, preview }: ResetEditorOptions): void {
  if (!editor || !preview) return;
  editor.value = "";
  preview.innerHTML = "";
  preview.classList.add("hidden");
  editor.style.display = "block";
}
