const esbuild = require("esbuild");

esbuild.build({
  entryPoints: ["src/scripts.js"],
  bundle: true,
  outfile: "dist/bundle.js",
  platform: "browser",
}).catch(() => process.exit(1));