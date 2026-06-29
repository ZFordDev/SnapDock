// src/modules/ui/metrics.js

let editorRef = null;
let elRef = null;

export function initMetrics(editor) {
  editorRef = editor;
  elRef = document.getElementById("metricStats");

  if (!editorRef || !elRef) return;

  // Attach listeners
  editorRef.addEventListener("input", updateMetrics);
  editorRef.addEventListener("click", updateMetrics);
  editorRef.addEventListener("keyup", updateMetrics);

  updateMetrics(); // initial render
}

export function updateMetrics() {
  if (!editorRef || !elRef) return;

  const value = editorRef.value;

  const totalChars = value.length;
  const totalWords = value.trim().split(/\s+/).filter(Boolean).length;

  const cursorPos = editorRef.selectionStart;
  const textBeforeCursor = value.slice(0, cursorPos);

  const line = textBeforeCursor.split("\n").length;
  const column = cursorPos - textBeforeCursor.lastIndexOf("\n");

  elRef.textContent = `Ln ${line}, Col ${column} • ${totalWords} words • ${totalChars} chars`;
}
