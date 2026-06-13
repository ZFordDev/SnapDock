// src/modules/updater/detectSource.js

let cached = null;

function getInstallSource(metaInstallSource = null) {
  // If metadata provided, trust it 100%
  if (metaInstallSource) {
    cached = metaInstallSource;
    return cached;
  }

  // If already cached, return it
  if (cached) return cached;

  // Fallback: legacy runtime detection (dev mode only)
  try {
    const exe = (process.execPath || "").replace(/\\/g, "/");
    const env = process.env;

    const isWindowsStore =
      Boolean(process.windowsStore) ||
      /Program Files\/WindowsApps\//i.test(exe) ||
      /WindowsApps/i.test(exe);

    if (isWindowsStore) {
      cached = "windows-store";
      return cached;
    }

    const isSnap =
      Boolean(env.SNAP) ||
      Boolean(env.SNAP_REVISION) ||
      /(^|\/)snap\//i.test(exe);

    const isAppImage =
      Boolean(env.APPIMAGE) ||
      exe.endsWith(".AppImage") ||
      /AppImage/.test(exe);

    if (isSnap && !isAppImage) {
      cached = "snap-store";
      return cached;
    }

    cached = "direct";
    return cached;

  } catch (err) {
    console.warn("[updater] Install source detection failed:", err);
    return "direct";
  }
}

module.exports = { getInstallSource };
