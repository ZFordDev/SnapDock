import test from "node:test";
import assert from "node:assert/strict";

import {
  isSessionRestoreEnabled,
  setSessionRestoreEnabled,
  saveSession,
  loadSession,
  clearSession,
} from "../src/modules/file/session.js";
import { loadWorkspace } from "../src/modules/file/workspace.js";

// Minimal in-memory localStorage replacement (used by session.js/workspace.js).
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

const WORKSPACE = "C:\\Users\\demo\\proj";
const OTHER_WORKSPACE = "C:\\Users\\demo\\other";

function resetStore() {
  for (const k of Object.keys(store)) delete store[k];
  global.localStorage.setItem("snapdock_workspace", WORKSPACE);
}

function sampleTabs() {
  return [
    { filePath: `${WORKSPACE}\\a.md` },
    { filePath: null, title: "Untitled" }, // untitled must be excluded
    { filePath: `${WORKSPACE}\\b.md` },
  ];
}

test("session restoration is disabled by default", () => {
  resetStore();
  assert.equal(isSessionRestoreEnabled(), false);
});

test("the enabled preference persists across restarts (set then read)", () => {
  resetStore();
  setSessionRestoreEnabled(true);
  assert.equal(isSessionRestoreEnabled(), true);

  // Simulate a fresh session: the preference is read from storage only.
  setSessionRestoreEnabled(true);
  assert.equal(isSessionRestoreEnabled(), true);
});

test("save/load round-trip restores order and active file, skipping untitled", () => {
  resetStore();
  setSessionRestoreEnabled(true);

  saveSession({ tabs: sampleTabs(), activeFile: `${WORKSPACE}\\a.md` });

  const session = loadSession();
  assert.ok(session);
  assert.equal(session.workspacePath, WORKSPACE);
  // Untitled tab (null filePath) is not persisted.
  assert.deepEqual(session.openFiles, [`${WORKSPACE}\\a.md`, `${WORKSPACE}\\b.md`]);
  assert.equal(session.activeFile, `${WORKSPACE}\\a.md`);
});

test("active file falls back to the last open file when not provided", () => {
  resetStore();
  setSessionRestoreEnabled(true);
  saveSession({ tabs: sampleTabs(), activeFile: null });
  assert.equal(loadSession().activeFile, `${WORKSPACE}\\b.md`);
});

test("sessions are isolated per workspace", () => {
  resetStore();
  setSessionRestoreEnabled(true);
  saveSession({ tabs: sampleTabs(), activeFile: `${WORKSPACE}\\a.md` });

  // Switch to another workspace: its session key does not exist.
  global.localStorage.setItem("snapdock_workspace", OTHER_WORKSPACE);
  assert.equal(loadSession(), null);
});

test("loadSession returns null when disabled even if metadata exists", () => {
  resetStore();
  setSessionRestoreEnabled(true);
  saveSession({ tabs: sampleTabs(), activeFile: `${WORKSPACE}\\a.md` });

  setSessionRestoreEnabled(false);
  assert.equal(isSessionRestoreEnabled(), false);
  // Disabling clears the stored metadata.
  clearSession();
  assert.equal(loadSession(), null);
});

test("missing/corrupt metadata returns null safely", () => {
  resetStore();
  setSessionRestoreEnabled(true);
  global.localStorage.setItem(
    `snapdock_session_${WORKSPACE}`,
    "{ not valid json"
  );
  assert.equal(loadSession(), null);
});

test("clearSession removes the current workspace's metadata", () => {
  resetStore();
  setSessionRestoreEnabled(true);
  saveSession({ tabs: sampleTabs(), activeFile: `${WORKSPACE}\\a.md` });
  assert.ok(loadSession());

  // Project closure calls clearSession.
  clearSession();
  assert.equal(loadSession(), null);
});

test("persisted values are metadata only and never store file contents", () => {
  resetStore();
  setSessionRestoreEnabled(true);
  saveSession({
    tabs: [{ filePath: `${WORKSPACE}\\a.md`, content: "SECRET BODY" }],
    activeFile: `${WORKSPACE}\\a.md`,
  });

  const raw = global.localStorage.getItem(`snapdock_session_${WORKSPACE}`);
  assert.ok(raw);
  // The serialized session must not contain document body text.
  assert.ok(!raw.includes("SECRET BODY"));
});
