const test = require("node:test");
const assert = require("node:assert/strict");

const { isExternalLink, resolveLocalPath } = require("../src/modules/linkNavigation.js");

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
    resolveLocalPath("/home/user/project/docs/guide.md", "./README.md"),
    "/home/user/project/docs/README.md"
  );
  assert.equal(
    resolveLocalPath("/home/user/project/docs/guide.md", "../README.md"),
    "/home/user/project/README.md"
  );
});

test("strips anchors and queries before resolving a local path", () => {
  assert.equal(
    resolveLocalPath("/home/user/project/docs/guide.md", "./README.md#section"),
    "/home/user/project/docs/README.md"
  );
  assert.equal(
    resolveLocalPath("/home/user/project/docs/guide.md", "./README.md?view=full"),
    "/home/user/project/docs/README.md"
  );
});
