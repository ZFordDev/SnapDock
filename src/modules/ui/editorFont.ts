import type {
  EditorFontFamily,
  EditorFontSize,
  EditorFontState,
} from "../../types/ui";

const EDITOR_FONT_STORAGE_KEY = "snapdock_editor_font";

export const DEFAULT_EDITOR_FONT_STATE: Readonly<EditorFontState> = Object.freeze({
  family: "mono",
  size: "100%",
});

const FONT_FAMILY_MAP: Record<EditorFontFamily, string> = {
  mono: "Consolas, 'Courier New', monospace",
  sans: "Inter, 'Segoe UI', Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};

const SUPPORTED_FAMILIES: readonly EditorFontFamily[] = ["mono", "sans", "serif"];
const SUPPORTED_SIZES: readonly EditorFontSize[] = ["90%", "100%", "110%", "125%"];

interface EditorFontTarget {
  style: Pick<CSSStyleDeclaration, "fontFamily" | "fontSize">;
  dataset: {
    editorFontFamily?: string;
    editorFontSize?: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSupportedFamily(value: unknown): value is EditorFontFamily {
  return typeof value === "string" && SUPPORTED_FAMILIES.includes(value as EditorFontFamily);
}

function isSupportedSize(value: unknown): value is EditorFontSize {
  return typeof value === "string" && SUPPORTED_SIZES.includes(value as EditorFontSize);
}

export function resolveEditorFontState(savedState: unknown = null): EditorFontState {
  if (!isRecord(savedState)) return { ...DEFAULT_EDITOR_FONT_STATE };

  return {
    family: isSupportedFamily(savedState.family)
      ? savedState.family
      : DEFAULT_EDITOR_FONT_STATE.family,
    size: isSupportedSize(savedState.size)
      ? savedState.size
      : DEFAULT_EDITOR_FONT_STATE.size,
  };
}

export function applyEditorFontToElement(
  editor: EditorFontTarget | null,
  state: EditorFontState = DEFAULT_EDITOR_FONT_STATE,
): void {
  if (!editor) return;

  const resolved = resolveEditorFontState(state);
  editor.style.fontFamily = FONT_FAMILY_MAP[resolved.family];
  editor.style.fontSize = resolved.size;
  editor.dataset.editorFontFamily = resolved.family;
  editor.dataset.editorFontSize = resolved.size;
}

function readStoredState(): EditorFontState {
  // FIX L2: use localStorage instead of sessionStorage for consistency with
  // other preferences (theme, viewMode). Font choice should persist across
  // window restarts like theme does.
  try {
    const raw = window.localStorage.getItem(EDITOR_FONT_STORAGE_KEY);
    return raw ? resolveEditorFontState(JSON.parse(raw) as unknown) : { ...DEFAULT_EDITOR_FONT_STATE };
  } catch {
    return { ...DEFAULT_EDITOR_FONT_STATE };
  }
}

function writeStoredState(state: EditorFontState): void {
  try {
    window.localStorage.setItem(EDITOR_FONT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in restricted renderer contexts.
  }
}

export function initEditorFont({
  editor = document.getElementById("markdownInputMain") as HTMLTextAreaElement | null,
}: { editor?: EditorFontTarget | null } = {}): EditorFontState {
  const state = readStoredState();
  applyEditorFontToElement(editor, state);
  return state;
}

export function setEditorFont(
  editor: EditorFontTarget | null,
  updates: Partial<EditorFontState> = {},
): EditorFontState {
  const nextState = resolveEditorFontState({ ...readStoredState(), ...updates });
  applyEditorFontToElement(editor, nextState);
  writeStoredState(nextState);
  return nextState;
}
