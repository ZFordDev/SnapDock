const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { isExternalLink, resolveLocalPath } = require("../src/modules/linkNavigation.js");
const documentDir = path.resolve("test-documents", "project", "docs");
const documentPath = path.join(documentDir, "guide.md");

test("classifies external URLs correctly", () => {
  assert.equal(isExternalLink("https://google.com"), true);
  assert.equal(isExternalLink("http://example.com"), true);
  assert.equal(isExternalLink("mailto:test@example.com"), true);
  assert.equal(isExternalLink("tel:+123456"), true);
  assert.equal(isExternalLink("./README.md"), false);
  assert.equal(isExternalLink("README.md"), false);
  assert.equal(isExternalLink("#section"), false);
});

test("resolves relative links against the current document directory", () => {
  assert.equal(
    resolveLocalPath(documentPath, "./README.md"),
    path.join(documentDir, "README.md")
  );
  assert.equal(
    resolveLocalPath(documentPath, "../README.md"),
    path.join(path.dirname(documentDir), "README.md")
  );
});

test("strips anchors and queries before resolving a local path", () => {
  assert.equal(
    resolveLocalPath(documentPath, "./README.md#section"),
    path.join(documentDir, "README.md")
  );
  assert.equal(
    resolveLocalPath(documentPath, "./README.md?view=full"),
    path.join(documentDir, "README.md")
  );
});
