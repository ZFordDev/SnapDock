let editorRef: HTMLTextAreaElement | null = null;
let metricElement: HTMLElement | null = null;

export function initMetrics(editor: HTMLTextAreaElement | null): void {
  editorRef = editor;
  metricElement = document.getElementById("metricStats");

  if (!editorRef || !metricElement) return;

  editorRef.addEventListener("input", updateMetrics);
  editorRef.addEventListener("click", updateMetrics);
  editorRef.addEventListener("keyup", updateMetrics);
  updateMetrics();
}

export function updateMetrics(): void {
  if (!editorRef || !metricElement) return;

  const value = editorRef.value;
  const cursorPosition = editorRef.selectionStart;
  const textBeforeCursor = value.slice(0, cursorPosition);
  const line = textBeforeCursor.split("\n").length;
  const column = cursorPosition - textBeforeCursor.lastIndexOf("\n");
  const words = value.trim().split(/\s+/).filter(Boolean).length;

  metricElement.textContent =
    `Ln ${line}, Col ${column} • ${words} words • ${value.length} chars`;
}
