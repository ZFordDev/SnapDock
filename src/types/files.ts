export type FilePath = string;
export type WorkspacePath = string;

export interface OpenedFile {
  content: string;
  filePath: FilePath;
}

export interface FileTreeEntry {
  name: string;
  type: "file" | "folder";
  fullPath: FilePath;
}

export interface SavedAsFile {
  newFilePath: FilePath;
}

export type SaveFileResult = boolean | SavedAsFile;

export interface SaveAllTabsResult {
  savedCount: number;
  failedCount: number;
  failedTabs: string[];
}

export type SaveAllForCloseResult = SaveAllTabsResult & {
  ok: boolean;
  error?: string;
};
