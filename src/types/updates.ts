export type InstallSource = "direct" | "windows-store" | "snap-store" | "snap" | "appimage";

export type UpdateChannel = "latest" | "pre-release" | "nightly";

export interface UpdateConfig {
  channel: UpdateChannel;
  autoCheck: boolean;
}

export interface VersionInfo {
  version: string;
  stage: string;
  date: string | null;
  installSource: string;
  channel: string;
  platform: string;
}

export interface UpdateEventInfo {
  version: string;
  [key: string]: unknown;
}

export interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
  delta: number;
}

export interface UpdateCheckSuccess {
  updateAvailable: boolean;
  latestVersion: string | null;
  currentVersion: string | null;
  disabled?: false;
}

export interface UpdateCheckDisabled {
  updateAvailable: false;
  latestVersion: null;
  currentVersion: null;
  disabled: true;
  reason: Exclude<InstallSource, "direct">;
}

export interface UpdateError {
  error: string;
}

export type UpdateCheckResult =
  | UpdateCheckSuccess
  | UpdateCheckDisabled
  | UpdateError;

export type UpdateDownloadResult = "downloading" | UpdateError;
export type UpdateInstallResult = void | UpdateError;
