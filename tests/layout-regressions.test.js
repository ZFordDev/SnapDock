import { strict as assert } from "node:assert";
import fs from "node:fs";

const tabsCss = fs.readFileSync("src/styles/components/tabs.css", "utf8");
const mainProcess = fs.readFileSync("main.js", "utf8");
const tailwindInput = fs.readFileSync("src/styles/tailwind.css", "utf8");

for (const declaration of [
  "flex-direction: row !important",
  "width: 100% !important",
  "max-width: none !important",
  "position: relative !important",
  "inset: auto !important",
]) {
  assert.ok(
    tabsCss.includes(declaration),
    `split view must override the base layout utility: ${declaration}`,
  );
}

assert.equal(
  /utilities\.css[^;]*\bimportant\b/.test(tailwindInput),
  false,
  "Tailwind utilities must not globally override runtime component states",
);

assert.equal(
  mainProcess.includes("setZoomFactor"),
  false,
  "Electron's native DPI scaling must not be compounded by a manual zoom factor",
);

console.log("layout regression tests passed");
