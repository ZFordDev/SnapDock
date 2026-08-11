const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const target = path.join(root, "app-dist");
fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.copyFileSync(path.join(root, "index.html"), path.join(target, "index.html"));
fs.cpSync(path.join(root, "dist"), path.join(target, "dist"), { recursive: true });
