import type {
  FilePath,
  FileTreeEntry,
  OpenedFile,
  SaveAllForCloseResult,
  SaveFileResult,
  WorkspacePath,
} from "./files";
import type {
  InstallSource,
  UpdateCheckResult,
  UpdateDownloadResult,
  UpdateEventInfo,
  UpdateInstallResult,
  UpdateProgress,
  VersionInfo,
} from "./updates";

export interface InvokeChannelMap {
  "open-file": { args: []; result: OpenedFile | null };
  "open-folder": { args: []; result: WorkspacePath | null };
  "list-files": { args: [path: WorkspacePath]; result: FileTreeEntry[] };
  "open-recent-file": { args: [path: FilePath]; result: string | null };
  "save-file": {
    args: [path: FilePath | null, content: string, suggestedName?: string];
    result: SaveFileResult;
  };
  "confirm-tab-close": { args: [title: string]; result: boolean };
  "open-file-by-path": { args: [path: FilePath]; result: string | null };
  "open-external-link": { args: [target: string]; result: boolean };
  "export-pdf": { args: [html: string]; result: void };
  "dialog:openHelp": { args: []; result: string };
  "shell:openExternal": { args: [url: string]; result: boolean };
  "spellcheck:get-state": { args: []; result: boolean };
  "spellcheck:set-state": { args: [enabled: boolean]; result: boolean };
  "get-version": { args: []; result: VersionInfo };
  "update:source": { args: []; result: InstallSource };
  "update:check": { args: []; result: UpdateCheckResult };
  "update:download": { args: []; result: UpdateDownloadResult };
  "update:install": { args: []; result: UpdateInstallResult };
  "window:isMaximized": { args: []; result: boolean };
}

export interface RendererToMainChannelMap {
  "window:minimize": [];
  "window:toggle-maximize": [];
  "window:close": [];
  "workspace:close-project": [];
  "workspace:isDirty:response": [isDirty: boolean];
  "workspace:save-all-for-close:result": [result: SaveAllForCloseResult];
  "workspace:clear-for-close:result": [];
}

export interface MainToRendererChannelMap {
  "workspace-updated": [];
  "window:is-maximized": [isMaximized: boolean];
  "workspace:isDirty:request": [];
  "workspace:save-all-for-close:request": [];
  "workspace:clear-for-close:request": [];
  "update:available": [info: UpdateEventInfo];
  "update:none": [];
  "update:progress": [progress: UpdateProgress];
  "update:ready": [info: UpdateEventInfo];
  "update:error": [message: string];
}

export type InvokeChannel = keyof InvokeChannelMap;
export type InvokeArgs<C extends InvokeChannel> = InvokeChannelMap[C]["args"];
export type InvokeResult<C extends InvokeChannel> = InvokeChannelMap[C]["result"];
