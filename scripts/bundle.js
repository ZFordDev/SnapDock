const esbuild = require("esbuild");
esbuild.build({
    entryPoints: ["src/scripts.ts"],
    bundle: true,
    outfile: "dist/bundle.js",
    platform: "browser",
  }).catch(() => process.exit(1));
