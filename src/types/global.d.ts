import type {
  FilePath,
  FileTreeEntry,
  FindController,
  InstallSource,
  OpenedFile,
  SaveAllForCloseResult,
  SaveFileResult,
  UpdateCheckResult,
  UpdateDownloadResult,
  UpdateEventInfo,
  UpdateInstallResult,
  UpdateProgress,
  VersionInfo,
  WorkspacePath,
} from "./index";

declare global {
  interface SnapDockAPI {
    openFile(): Promise<OpenedFile | null>;
    openFolder(): Promise<WorkspacePath | null>;
    listFiles(path: WorkspacePath): Promise<FileTreeEntry[]>;
    openRecentFile(path: FilePath): Promise<string | null>;
    saveFile(path: FilePath | null, content: string, suggestedName?: string): Promise<SaveFileResult>;
    confirmTabClose(title: string): Promise<boolean>;
    openFileByPath(path: FilePath): Promise<string | null>;
    openExternalLink(target: string): Promise<boolean>;
    isExternalLink(target: string): boolean;
    resolveLocalPath(documentPath: FilePath | null, target: string): FilePath | null;
    resolveLocalAttachment(documentPath: FilePath | null, attachmentPath: string): string;
    closeProject(): void;
    onWorkspaceUpdated(callback: () => void): void;
    exportToPDF(html: string): Promise<void>;
    openHelp(): Promise<string>;
    openExternal(url: string): Promise<boolean>;
    getSpellcheckState(): Promise<boolean>;
    setSpellcheckState(enabled: boolean): Promise<boolean>;
    getVersion(): Promise<VersionInfo>;
    getInstallSource(): Promise<InstallSource>;
    checkForUpdates(): Promise<UpdateCheckResult>;
    downloadUpdate(): Promise<UpdateDownloadResult>;
    installUpdate(): Promise<UpdateInstallResult>;
    onUpdateAvailable(callback: (info: UpdateEventInfo) => void): void;
    onUpdateNone(callback: () => void): void;
    onUpdateProgress(callback: (progress: UpdateProgress) => void): void;
    onUpdateReady(callback: (info: UpdateEventInfo) => void): void;
    onUpdateError(callback: (message: string) => void): void;
  }

  interface WindowControlsAPI {
    minimize(): void;
    toggleMaximize(): void;
    close(): void;
    isMaximized(): Promise<boolean>;
    onMaximizeChange(callback: (isMaximized: boolean) => void): void;
  }

  interface WorkspaceAPI {
    onDirtyStateRequest(callback: () => void): void;
    sendDirtyState(isDirty: boolean): void;
    onSaveAllForCloseRequest(callback: () => void): void;
    sendSaveAllForCloseResult(result: SaveAllForCloseResult): void;
    onClearForCloseRequest(callback: () => void): void;
    sendClearForCloseResult(): void;
  }

  interface Window {
    snapdockAPI: SnapDockAPI;
    windowControls: WindowControlsAPI;
    workspaceAPI: WorkspaceAPI;
    snapdockFind?: FindController;
  }

  interface DocumentEventMap {
    "snapdock:workspaceLoaded": CustomEvent<{ path: WorkspacePath }>;
    "snapdock:fitEditor": CustomEvent<void>;
    "snapdock:updatePreview": CustomEvent<void>;
    "snapdock:find:toggle": CustomEvent<void>;
  }
}

export {};
