import { renderMarkdown } from "../src/modules/markdown.js";
import fs from "fs";
import path from "path";

console.log("--- Running SnapDock Markdown Renderer Test Suite ---\n");

// Mock window/electron API for local attachment check
globalThis.window = {
  electronAPI: {
    resolveLocalAttachment: (docPath, src) => `app://local-assets/${src}`
  }
};

// Render Pipeline Verification
const sampleMarkdown = `
# Title Test

::: note
This is a note callout.
:::

::: info
This is an info callout.
:::

::: details Click to expand
Hidden details content.
:::

* [x] Task done
* [ ] Task pending

Check this ~sub~, ^sup^, and ==mark== text :rocket:

External Link: https://staxdash.com
Internal Link: [Jump](#title-test)

![Image test](attachment.png)
`;

try {
  const html = renderMarkdown(sampleMarkdown, { documentPath: "/docs/test.md" });

  const validations = [
    { label: "Anchor (H1)", pass: html.includes('id="title-test"') },
    { label: "Container (note)", pass: html.includes('<div class="md-note">') },
    { label: "Container (info)", pass: html.includes('<div class="md-info">') },
    { label: "Container (details)", pass: html.includes('<details class="md-details"><summary>Click to expand</summary>') },
    { label: "Task List", pass: html.includes('type="checkbox"') },
    { label: "Sub / Sup / Mark", pass: html.includes("<sub>") && html.includes("<sup>") && html.includes("<mark>") },
    { label: "Emoji", pass: html.includes("🚀") },
    { label: "Link Attributes External (MILA)", pass: html.includes('href="https://staxdash.com"') && html.includes('target="_blank"') },
    { label: "Link Attributes Internal (MILA bypass)", pass: html.includes('href="#title-test"') && !html.includes('href="#title-test" target="_blank"') },
    { label: "Electron Attachment Hook", pass: html.includes('src="app://local-assets/attachment.png"') }
  ];

  console.log("--- Feature Render Verification ---");
  let failed = false;
  validations.forEach(v => {
    if (v.pass) {
      console.log(`  ✔ ${v.label}: Output match`);
    } else {
      console.warn(`  ⚠️ ${v.label}: Did not find expected markup`);
      failed = true;
    }
  });

  if (failed) {
    process.exit(1);
  }

} catch (err) {
  console.error("✖ Execution crashed during rendering:", err);
  process.exit(1);
}

// Subpath Import Scan
console.log("\n--- Source Code Scan ---");
function scanForForbiddenImports(dir) {
  let violations = [];
  for (const file of fs.readdirSync(dir)) {
    if (["node_modules", ".git", "dist", "build"].includes(file)) continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      violations = violations.concat(scanForForbiddenImports(fullPath));
    } else if (/\.(js|ts|jsx|tsx)$/.test(file)) {
      if (file !== "markdown-render.js" && fs.readFileSync(fullPath, "utf8").includes("markdown-it" + "/lib/")) {
        violations.push(fullPath);
      }
    }
  }
  return violations;
}

const badImports = scanForForbiddenImports(process.cwd());
if (badImports.length > 0) {
  console.error("✖ Found obsolete internal subpath imports:");
  badImports.forEach(b => console.error(`  - ${b}`));
  process.exit(1);
} else {
  console.log("✔ No deprecated 'markdown-it/lib/*' imports found.");
}

console.log("\n--- Test Suite Complete ---");