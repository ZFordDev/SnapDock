const esbuild = require("esbuild");
const path = require("path");

esbuild.build({
  entryPoints: [path.join(__dirname, "..", "src", "scripts.js")],
  bundle: true,
  outfile: path.join(__dirname, "..", "dist", "bundle.js"),
  platform: "browser",
}).catch(() => process.exit(1));
