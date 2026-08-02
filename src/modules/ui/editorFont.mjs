const EDITOR_FONT_STORAGE_KEY = "snapdock_editor_font";

export const DEFAULT_EDITOR_FONT_STATE = Object.freeze({
  family: "mono",
  size: "100%",
});

const FONT_FAMILY_MAP = {
  mono: "Consolas, 'Courier New', monospace",
  sans: "Inter, 'Segoe UI', Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};

const SUPPORTED_FAMILIES = Object.keys(FONT_FAMILY_MAP);
const SUPPORTED_SIZES = ["90%", "100%", "110%", "125%"];

function isSupportedFamily(value) {
  return typeof value === "string" && SUPPORTED_FAMILIES.includes(value);
}

function isSupportedSize(value) {
  return typeof value === "string" && SUPPORTED_SIZES.includes(value);
}

export function resolveEditorFontState(savedState = null) {
  if (!savedState || typeof savedState !== "object") {
    return { ...DEFAULT_EDITOR_FONT_STATE };
  }

  const family = isSupportedFamily(savedState.family)
    ? savedState.family
    : DEFAULT_EDITOR_FONT_STATE.family;
  const size = isSupportedSize(savedState.size)
    ? savedState.size
    : DEFAULT_EDITOR_FONT_STATE.size;

  return { family, size };
}

export function applyEditorFontToElement(editor, state = DEFAULT_EDITOR_FONT_STATE) {
  if (!editor) return;

  const resolved = resolveEditorFontState(state);
  if (editor.style) {
    editor.style.fontFamily = FONT_FAMILY_MAP[resolved.family] || FONT_FAMILY_MAP.mono;
    editor.style.fontSize = resolved.size;
  }

  if (editor.dataset) {
    editor.dataset.editorFontFamily = resolved.family;
    editor.dataset.editorFontSize = resolved.size;
  }
}

function readStoredState() {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return { ...DEFAULT_EDITOR_FONT_STATE };
  }

  try {
    const raw = window.sessionStorage.getItem(EDITOR_FONT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EDITOR_FONT_STATE };
    return resolveEditorFontState(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_EDITOR_FONT_STATE };
  }
}

function writeStoredState(state) {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return;
  }

  try {
    window.sessionStorage.setItem(EDITOR_FONT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors in non-persistent environments.
  }
}

export function initEditorFont({ editor = document.getElementById("markdownInputMain") } = {}) {
  const state = readStoredState();
  applyEditorFontToElement(editor, state);
  return state;
}

export function setEditorFont(editor, updates = {}) {
  const currentState = readStoredState();
  const nextState = resolveEditorFontState({ ...currentState, ...updates });
  applyEditorFontToElement(editor, nextState);
  writeStoredState(nextState);
  return nextState;
}
