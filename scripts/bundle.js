const esbuild = require("esbuild");
const path = require("path");

esbuild.build({
  entryPoints: [path.join(__dirname, "..", "src", "scripts.js")],
  bundle: true,
  // ZFordDev: emit the preview renderer separately so its first import loads it on demand.
  outdir: path.join(__dirname, "..", "dist"),
  entryNames: "bundle",
  chunkNames: "chunks/[name]-[hash]",
  format: "esm",
  splitting: true,
  platform: "browser",
}).catch(() => process.exit(1));
