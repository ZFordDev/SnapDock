// scripts/inject-metadata.js

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const platform = require("./helpers/platform");

// --- Parse CLI args ---------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const prefix = `--${name}=`;
  const match = args.find(a => a.startsWith(prefix));
  return match ? match.replace(prefix, "") : fallback;
};

// Required build metadata
const buildStage = getArg("stage", "dev");      // dev | test | release
const channel = getArg("channel", "dev");       // dev | beta | stable

// NEW: installSource metadata
// direct | windows-store | snap-store
const installSource = getArg("installSource", "direct");

// --- Load package.json ------------------------------------------------------
const pkg = require("../package.json");

// --- Generate metadata ------------------------------------------------------
const metadata = {
  version: pkg.version,
  buildStage,
  channel,
  installSource, // ← NEW FIELD
  releaseDate: new Date().toISOString(),

  // Normalised platform values
  platform: platform.isWindows()
    ? "windows"
    : platform.isLinux()
    ? "linux"
    : platform.isMac()
    ? "mac"
    : "unknown",

  // Architecture from helper
  arch: platform.arch(),

  // Environment flags
  isSnap: platform.isSnap(),
  isCI: platform.isCI(),

  commit: execSync("git rev-parse --short HEAD").toString().trim(),
  buildNumber: Date.now() // fallback until CI injects real numbers
};

// --- Ensure /build exists ---------------------------------------------------
const outDir = path.join(__dirname, "..", "build");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// --- Write metadata.json ----------------------------------------------------
const outFile = path.join(outDir, "metadata.json");
fs.writeFileSync(outFile, JSON.stringify(metadata, null, 2));

if (platform.isLinux()) {
  const linuxDir = path.join(outDir, "linux");
  if (!fs.existsSync(linuxDir)) {
    fs.mkdirSync(linuxDir);
  }

  // --- Desktop entry --------------------------------------------------------
  const desktopEntry = `
[Desktop Entry]
Type=Application
Name=SnapDock
Comment=A modern Markdown editor with a clean UI.
Exec=/usr/bin/snapdock
Icon=snapdock.png
Terminal=false
MimeType=text/markdown;text/plain;
Categories=Utility;
X-SnapDock-Version=${metadata.version}
X-SnapDock-Channel=${metadata.channel}
X-SnapDock-BuildStage=${metadata.buildStage}
X-SnapDock-InstallSource=${metadata.installSource}
X-SnapDock-Commit=${metadata.commit}
X-SnapDock-BuildNumber=${metadata.buildNumber}
`;

  const desktopFile = path.join(linuxDir, "snapdock.desktop");
  fs.writeFileSync(desktopFile, desktopEntry.trim() + "\n");

  console.log("Linux desktop entry generated:");
  console.log(desktopEntry);

}
