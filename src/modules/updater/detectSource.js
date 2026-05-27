// src/modules/updater/detectSource.js
// Robust detection of installation source
// Returns: "direct" | "windows-store" | "snap-store"

let cached = null;

function getInstallSource() {
  // Only cache successful detections
  if (cached) return cached;

  try {
    const exe = (process.execPath || "").replace(/\\/g, "/");
    const env = process.env;

    // -----------------------------
    // WINDOWS STORE (MSIX / WindowsApps)
    // -----------------------------
    const isWindowsStore =
      Boolean(process.windowsStore) ||
      /Program Files\/WindowsApps\//i.test(exe) ||
      /WindowsApps/i.test(exe);

    if (isWindowsStore) {
      cached = "windows-store";
      return cached;
    }

    // -----------------------------
    // SNAP STORE
    // -----------------------------
    const isSnap =
      Boolean(env.SNAP) ||
      Boolean(env.SNAP_REVISION) ||
      /(^|\/)snap\//i.test(exe);

    // BUT: AppImage also sets SNAP-like paths sometimes
    const isAppImage =
      Boolean(env.APPIMAGE) ||
      exe.endsWith(".AppImage") ||
      /AppImage/.test(exe);

    if (isSnap && !isAppImage) {
      cached = "snap-store";
      return cached;
    }

    // -----------------------------
    // DIRECT INSTALL (default)
    // -----------------------------
    cached = "direct";
    return cached;

  } catch (err) {
    console.warn("[updater] Install source detection failed:", err);
    // Do NOT cache failures — retry next call
    return "direct";
  }
}

module.exports = { getInstallSource };
