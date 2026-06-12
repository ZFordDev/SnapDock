// scripts/inject-metadata.js

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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

// --- Load package.json ------------------------------------------------------
const pkg = require("../package.json");

// --- Generate metadata ------------------------------------------------------
const metadata = {
  version: pkg.version,
  buildStage,
  channel,
  releaseDate: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
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

console.log("Metadata generated:");
console.log(metadata);
