import type { FilePath } from "./files";

export interface EditorTab {
  id: string;
  filePath: FilePath | null;
  title: string;
  content: string;
  isDirty: boolean;
  hasEverBeenSaved: boolean;
}

export interface CreateTabOptions {
  filePath?: FilePath | null;
  content?: string;
  title?: string;
}

export interface TabDragState {
  dragging: number | null;
  dropTarget: number | null;
  startX: number;
  placeholder: HTMLElement | null;
}
