export type ThemeName = "light" | "dark" | "solarized" | "arctic" | "forest";
export type PreviewMode = "preview" | "split" | "live";
export type EditorFontFamily = "mono" | "sans" | "serif";
export type EditorFontSize = "90%" | "100%" | "110%" | "125%";

export interface EditorFontState {
  family: EditorFontFamily;
  size: EditorFontSize;
}

export interface FindMatch {
  start: number;
  end: number;
  text: string;
}

export interface FindState {
  query: string;
  matches: FindMatch[];
  activeIndex: number;
  count: number;
  index?: number;
}

export interface FindController {
  openFind(): void;
  closeFind(): void;
  focusFind(): void;
  isVisible(): boolean;
}

export interface ViewModeController {
  getMode(): PreviewMode;
}
