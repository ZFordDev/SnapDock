// src/modules/updater/rollback.js
// running previous installer
// 
// validating rollback availability

const { shell } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const os = require("os");

const { getInstallSource } = require("./detectSource");
const { getSettings } = require("./settings");
const pkg = require("../../../package.json");

// -----------------------------
// Rollback availability
// -----------------------------
function rollbackAllowed() {
  return getInstallSource() === "direct";
}

// -----------------------------
// GitHub API helper
// -----------------------------
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "SnapDock-Updater",
          "Accept": "application/vnd.github+json"
        }
      },
      res => {
        if (res.statusCode !== 200) {
          reject(new Error(`GitHub API error: ${res.statusCode}`));
          return;
        }

        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      }
    ).on("error", reject);
  });
}

// -----------------------------
// Download file helper (with redirect support)
// -----------------------------
function downloadFile(url, dest, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error("Too many redirects while downloading installer."));
    }

    https.get(
      url,
      {
        headers: {
          "User-Agent": "SnapDock-Updater"
        }
      },
      response => {
        // --- Handle redirects ---
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          const nextURL = response.headers.location;
          return resolve(downloadFile(nextURL, dest, redirectCount + 1));
        }

        // --- Handle errors ---
        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP ${response.statusCode}`));
        }

        // --- Stream file to disk ---
        const file = fs.createWriteStream(dest);
        response.pipe(file);

        file.on("finish", () => {
          file.close(() => resolve(dest));
        });

        file.on("error", err => {
          fs.unlink(dest, () => reject(err));
        });
      }
    ).on("error", reject);
  });
}


// -----------------------------
// Pick correct asset for platform
// -----------------------------
function pickAsset(assets) {
  const platform = process.platform;

  if (platform === "win32") {
    return assets.find(a => a.name.endsWith(".exe"));
  }

  if (platform === "linux") {
    // Electron-updater uses AppImage internally → match that behavior
    return assets.find(a => a.name.endsWith(".AppImage"));
  }

  if (platform === "darwin") {
    // Prefer dmg, fallback to zip
    return (
      assets.find(a => a.name.endsWith(".dmg")) ||
      assets.find(a => a.name.endsWith(".zip"))
    );
  }

  return null;
}

// -----------------------------
// Run rollback
// -----------------------------
async function runRollback() {
  if (!rollbackAllowed()) {
    return { error: "Rollback not allowed for this install source." };
  }

  const { lastInstalledVersion } = getSettings();

  if (!lastInstalledVersion) {
    return { error: "No previous version recorded." };
  }

  const base = pkg.homepage.replace(/\/$/, "");
  const apiURL = `${base.replace("https://github.com/", "https://api.github.com/repos/")}/releases/tags/${lastInstalledVersion}`;

  try {
    // Fetch release metadata
    const release = await fetchJSON(apiURL);

    if (!release.assets || release.assets.length === 0) {
      return { error: "No assets found for this version." };
    }

    // Pick correct installer for platform
    const asset = pickAsset(release.assets);

    if (!asset) {
      return { error: "No compatible installer found for this platform." };
    }

    const tempPath = path.join(os.tmpdir(), asset.name);

    // Download installer
    await downloadFile(asset.browser_download_url, tempPath);

    // Linux AppImage needs chmod
    if (process.platform === "linux") {
      fs.chmodSync(tempPath, 0o755);
    }

    // Run installer
    shell.openPath(tempPath);

    return { status: "running-installer" };

  } catch (err) {
    return { error: err.message };
  }
}

module.exports = {
  rollbackAllowed,
  runRollback
};
