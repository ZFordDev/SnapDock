import { tabs } from "../file/tabs.js";

export function isWorkspaceDirty(): boolean {
  return tabs.some((tab) => tab.isDirty);
}

export function getDirtyTabs() {
  return tabs.filter((tab) => tab.isDirty);
}

export function respondToDirtyStateRequest(): void {
  window.workspaceAPI.sendDirtyState(isWorkspaceDirty());
}
